import { describe, expect, it } from "vitest";
import {
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_USER,
  STAFF_USER,
  VIEWER_USER,
  createService,
} from "./harness";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import { DATA_CSV_MIME, DATA_XLSX_MIME } from "@/features/data-intake/domain/constants";
import { sourceColumnKey } from "@/features/data-intake/domain/source-column";
import { buildSimpleXlsx } from "./xlsx-fixtures";
import {
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
} from "./memory-query-client";
import { createMemoryDataIntakeStagingRpc } from "./memory-rpc";

const VALID_CSV = new TextEncoder().encode(
  "name,email\nAlice Example,alice@example.com\nBob Example,bob@example.com\n",
);
const INVALID_CSV = new TextEncoder().encode("name,email\n,not-an-email\n");
const IGNORED_CSV = new TextEncoder().encode(
  "name,email,internal_note\nAlice Example,alice@example.com,secret-internal-note\n",
);
const OPTIONAL_CSV = new TextEncoder().encode("name,email,phone\nAlice Example,,\n");

function nonEffect(store: ReturnType<typeof createService>["store"]) {
  expect(store.plans).toEqual([]);
  expect(store.rowResults).toEqual([]);
  expect(store.links).toEqual([]);
}

async function mappedSession(input: {
  userId?: string;
  bytes?: Uint8Array;
  sourceKind?: "csv" | "xlsx";
  filename?: string;
  mimeType?: string;
  map?: Array<{ index: number; target: "display_name" | "email" | "phone" | "first_name" | "last_name"; sheetName?: string }>;
  ignore?: number[];
}) {
  const sourceKind = input.sourceKind ?? "csv";
  const bytes = input.bytes ?? VALID_CSV;
  const ctx = createService({ userId: input.userId ?? OWNER_USER });
  const created = await ctx.service.createDataIntakeSession({
    organizationId: ORG_A,
    targetDomain: "customer",
    sourceKind,
  });
  if (!created.ok) throw new Error("create failed");
  const filename = input.filename ?? (sourceKind === "csv" ? "qa.csv" : "qa.xlsx");
  const mimeType = input.mimeType ?? (sourceKind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME);
  const registered = await ctx.service.registerDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: filename,
    mimeType,
    byteSize: bytes.byteLength,
    sha256: sha256Hex(bytes),
    sourceKind,
  });
  if (!registered.ok) throw new Error(`register failed ${registered.error.code}`);
  const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: filename,
    mimeType,
    bytes,
  });
  if (!uploaded.ok) throw new Error(`upload failed ${uploaded.error.code}`);
  const discovered = await ctx.service.discoverDataIntakeSourceStructure({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
  });
  if (!discovered.ok) throw new Error(`discover failed ${discovered.error.code}`);
  const maps = input.map ?? [
    { index: 0, target: "display_name" as const },
    { index: 1, target: "email" as const },
  ];
  for (const item of maps) {
    const mapped = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      sourceFieldKey: sourceColumnKey({
        format: sourceKind,
        index: item.index,
        sheetName: item.sheetName,
      }),
      targetField: item.target,
    });
    if (!mapped.ok) throw new Error(`map failed ${mapped.error.code}`);
  }
  for (const index of input.ignore ?? []) {
    const ignored = await ctx.service.ignoreDataIntakeSourceColumn({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      sourceFieldKey: sourceColumnKey({ format: sourceKind, index }),
    });
    if (!ignored.ok) throw new Error(`ignore failed ${ignored.error.code}`);
  }
  const confirmed = await ctx.service.confirmDataIntakeMapping({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
  });
  if (!confirmed.ok) throw new Error(`confirm failed ${confirmed.error.code}`);
  return {
    ...ctx,
    sessionId: created.value.sessionId,
    sourceId: uploaded.value.sourceId as string,
    mappingHash: confirmed.value.snapshotHash as string,
  };
}

describe("DATA-1G deterministic validation and governed staging", () => {
  it("stages two valid CSV rows without writing Customers or import artifacts", async () => {
    const ctx = await mappedSession({});
    const staged = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.value.status).toBe("ready_for_approval");
    expect(staged.value.eventType).toBe("validation_completed");
    expect(staged.value.summary.validRows).toBe(2);
    expect(staged.value.summary.invalidRows).toBe(0);
    expect(staged.value.rows).toHaveLength(2);
    expect(staged.value.rows.map((row) => row.sourceRowNumber)).toEqual([2, 3]);
    expect(staged.value.rows.every((row) => row.lifecycle === "validated")).toBe(true);
    expect(staged.value.rows[0]?.normalizedValues.display_name).toBe("Alice Example");
    expect(staged.value.rows[0]?.normalizedValues.email).toBe("alice@example.com");
    expect(JSON.stringify(staged.value)).not.toContain("create_customer");
    expect(ctx.store.events.filter((event) => event.event_type === "validation_completed")).toHaveLength(
      1,
    );
    expect(JSON.stringify(ctx.store.events)).not.toContain("Alice Example");
    nonEffect(ctx.store);
  });

  it("stages invalid CSV values with deterministic issue codes and no crash", async () => {
    const ctx = await mappedSession({ bytes: INVALID_CSV });
    const staged = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.value.status).toBe("review_required");
    expect(staged.value.rows).toHaveLength(1);
    expect(staged.value.rows[0]?.lifecycle).toBe("blocked");
    expect(staged.value.rows[0]?.errorCodes).toEqual(
      expect.arrayContaining(["REQUIRED_VALUE_MISSING", "INVALID_EMAIL"]),
    );
    expect(JSON.stringify(staged.value.rows[0]?.errorDetails)).not.toContain("not-an-email");
    nonEffect(ctx.store);
  });

  it("excludes ignored columns from staged Customer payloads", async () => {
    const ctx = await mappedSession({
      bytes: IGNORED_CSV,
      ignore: [2],
    });
    const staged = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(Object.keys(staged.value.rows[0]?.rawValues ?? {})).toEqual(["csv:0", "csv:1"]);
    expect(JSON.stringify(staged.value)).not.toContain("secret-internal-note");
    expect(JSON.stringify(ctx.store.staging)).not.toContain("secret-internal-note");
    nonEffect(ctx.store);
  });

  it("stages XLSX rows from the selected sheet and keeps formulas as unevaluated text", async () => {
    const bytes = await buildSimpleXlsx({
      sheets: [
        {
          name: "People",
          rows: [
            ["name", "email"],
            ["Alice Example", "alice@example.com"],
            ["Formula Person", { formula: "A2" }],
          ],
        },
      ],
    });
    const ctx = await mappedSession({
      sourceKind: "xlsx",
      bytes,
      filename: "qa.xlsx",
      mimeType: DATA_XLSX_MIME,
      map: [
        { index: 0, target: "display_name", sheetName: "People" },
        { index: 1, target: "email", sheetName: "People" },
      ],
    });
    const staged = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.value.status).toBe("review_required");
    expect(staged.value.rows).toHaveLength(2);
    expect(staged.value.rows[0]?.lifecycle).toBe("validated");
    expect(staged.value.rows[1]?.rawValues["xlsx:1:People"]).toBe("=A2");
    expect(staged.value.rows[1]?.errorCodes).toContain("INVALID_EMAIL");
    expect(staged.value.rows[1]?.normalizedValues.email).toBeNull();
    nonEffect(ctx.store);
  });

  it("enforces required, optional-null, and exact length boundaries", async () => {
    const boundary = new TextEncoder().encode(
      `name,email,phone\n${"A".repeat(200)},ok@example.com,${"1".repeat(50)}\n${"B".repeat(201)},,${"2".repeat(51)}\n`,
    );
    const ctx = await mappedSession({
      bytes: boundary,
      map: [
        { index: 0, target: "display_name" },
        { index: 1, target: "email" },
        { index: 2, target: "phone" },
      ],
    });
    const staged = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.value.rows[0]?.lifecycle).toBe("validated");
    expect(staged.value.rows[1]?.errorCodes).toEqual(
      expect.arrayContaining(["VALUE_TOO_LONG", "VALUE_TOO_LONG"]),
    );

    const optional = await mappedSession({
      bytes: OPTIONAL_CSV,
      map: [
        { index: 0, target: "display_name" },
        { index: 1, target: "email" },
        { index: 2, target: "phone" },
      ],
    });
    const emptyOptional = await optional.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: optional.sessionId,
    });
    expect(emptyOptional.ok).toBe(true);
    if (!emptyOptional.ok) return;
    expect(emptyOptional.value.rows[0]?.lifecycle).toBe("validated");
    expect(emptyOptional.value.rows[0]?.normalizedValues.email).toBeNull();
    expect(emptyOptional.value.rows[0]?.normalizedValues.phone).toBeNull();
  });

  it("rejects stale mapping hashes, unknown targets, unverified objects, and integrity mismatch", async () => {
    const ctx = await mappedSession({});
    const stale = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: "b".repeat(64),
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("MAPPING_HASH_MISMATCH");
    expect(ctx.store.staging).toEqual([]);

    const mapping = ctx.store.mappings.find((row) => row.target_field === "email");
    if (!mapping) throw new Error("missing mapping");
    mapping.target_field = "organization_id";
    const unknown = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe("TARGET_FIELD_FORBIDDEN");
    mapping.target_field = "email";

    const source = ctx.store.sources[0];
    if (!source) throw new Error("missing source");
    source.object_verified_at = null;
    const unverified = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(unverified.ok).toBe(false);
    if (!unverified.ok) expect(unverified.error.code).toBe("SOURCE_NOT_VERIFIED");
    source.object_verified_at = new Date().toISOString();

    const stored = [...ctx.objectStore.records.values()][0];
    if (!stored) throw new Error("missing object");
    ctx.objectStore.records.set(`${stored.bucket}::${stored.path}`, {
      ...stored,
      bytes: new TextEncoder().encode("tampered,name\nnope,nope\n"),
    });
    const mismatched = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(mismatched.ok).toBe(false);
    if (!mismatched.ok) expect(mismatched.error.code).toBe("SOURCE_HASH_INVALID");
    expect(ctx.store.staging).toEqual([]);
    nonEffect(ctx.store);
  });

  it("allows only mapped sessions and denies earlier or later unauthorized states", async () => {
    const created = createService({ userId: OWNER_USER });
    const session = await created.service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!session.ok) throw new Error("create failed");
    const tooEarly = await created.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: session.value.sessionId,
    });
    expect(tooEarly.ok).toBe(false);
    if (!tooEarly.ok) expect(tooEarly.error.code).toBe("INVALID_STATE");

    const mapped = await mappedSession({});
    for (const status of ["source_ready", "parsed", "mapping_required", "approved", "cancelled"] as const) {
      mapped.store.sessions[0]!.status = status;
      const denied = await mapped.service.validateAndStageDataIntakeSource({
        organizationId: ORG_A,
        sessionId: mapped.sessionId,
      });
      expect(denied.ok).toBe(false);
      if (!denied.ok) expect(denied.error.code).toBe("INVALID_STATE");
    }
    mapped.store.sessions[0]!.status = "mapped";
    const allowed = await mapped.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: mapped.sessionId,
    });
    expect(allowed.ok).toBe(true);
  });

  it("authorizes Owner and Admin and denies Staff, Viewer, foreign, suspended, and unauthenticated actors", async () => {
    const owner = await mappedSession({});
    const payload = { organizationId: ORG_A, sessionId: owner.sessionId };
    const adminCtx = await mappedSession({ userId: ADMIN_USER });
    const admin = await adminCtx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: adminCtx.sessionId,
    });
    expect(admin.ok).toBe(true);

    const staff = await createService({ userId: STAFF_USER }).service.validateAndStageDataIntakeSource(payload);
    const viewer = await createService({ userId: VIEWER_USER }).service.validateAndStageDataIntakeSource(payload);
    const foreign = await createService({ userId: FOREIGN_USER }).service.validateAndStageDataIntakeSource(payload);
    const anon = await createService({ userId: null }).service.validateAndStageDataIntakeSource(payload);
    expect(staff.ok).toBe(false);
    if (!staff.ok) expect(staff.error.code).toBe("FORBIDDEN_ROLE");
    expect(viewer.ok).toBe(false);
    if (!viewer.ok) expect(viewer.error.code).toBe("FORBIDDEN_ROLE");
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error.code).toBe("ORG_NOT_FOUND");
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.error.code).toBe("UNAUTHORIZED");

    const tables = emptyDataIntakeTables();
    seedOrg(tables, ORG_A);
    seedMember(tables, {
      userId: OWNER_USER,
      role: "owner",
      membershipId: OWNER_MEMBER,
      status: "suspended",
    });
    const suspended = await createService({
      userId: OWNER_USER,
      tables,
      seedDefaultOrg: false,
    }).service.validateAndStageDataIntakeSource(payload);
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");

    const foreignSession = await createService({ userId: FOREIGN_USER }).service.validateAndStageDataIntakeSource({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
    });
    expect(foreignSession.ok).toBe(false);
    if (!foreignSession.ok) expect(foreignSession.error.code).toBe("SESSION_NOT_FOUND");

    const foreignSource = await createService({ userId: FOREIGN_USER }).service.validateAndStageDataIntakeSource({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
      sourceId: owner.sourceId,
    });
    expect(foreignSource.ok).toBe(false);
    if (!foreignSource.ok) expect(foreignSource.error.code).toBe("SESSION_NOT_FOUND");
    nonEffect(owner.store);
  });

  it("rejects incomplete RPC payloads atomically and replays the same generation", async () => {
    const ctx = await mappedSession({});
    const rpc = createMemoryDataIntakeStagingRpc({
      tables: ctx.tables,
      store: ctx.store,
    });
    const rejected = await rpc.rpc("apply_data_intake_staging_mutation", {
      p_operation: "confirm_source_validation",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: {
        session_id: ctx.sessionId,
        source_id: ctx.sourceId,
        mapping_hash: ctx.mappingHash,
        source_sha256: ctx.store.sources[0]?.sha256,
        next_status: "ready_for_approval",
        source_data_rows: 1,
        valid_rows: 1,
        invalid_rows: 0,
        staging_rows: [
          {
            source_row_number: 2,
            raw_values: { "csv:0": "Alice Example" },
            normalized_values: { display_name: "Alice Example" },
            row_fingerprint: "d".repeat(64),
            lifecycle: "ready",
            resolution: "create",
            error_codes: [],
            warning_codes: [],
            error_details: [],
            target_record_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          },
        ],
      },
    });
    expect(rejected.data).toMatchObject({ ok: false, code: "SOURCE_INVALID" });
    expect(ctx.store.staging).toEqual([]);
    expect(ctx.store.sessions[0]?.status).toBe("mapped");

    const first = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    const second = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(ctx.store.staging).toHaveLength(2);
    expect(ctx.store.events.filter((event) => event.event_type === "validation_completed")).toHaveLength(
      1,
    );
    expect(second.value.summary).toEqual(first.value.summary);
    nonEffect(ctx.store);
  });

  it("serializes competing starts into one authoritative generation", async () => {
    const ctx = await mappedSession({});
    const [left, right] = await Promise.all([
      ctx.service.validateAndStageDataIntakeSource({
        organizationId: ORG_A,
        sessionId: ctx.sessionId,
        mappingHash: ctx.mappingHash,
      }),
      ctx.service.validateAndStageDataIntakeSource({
        organizationId: ORG_A,
        sessionId: ctx.sessionId,
        mappingHash: ctx.mappingHash,
      }),
    ]);
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect([left.value.replayed, right.value.replayed].filter(Boolean)).toHaveLength(1);
    expect(ctx.store.staging).toHaveLength(2);
    expect(ctx.store.events.filter((event) => event.event_type === "validation_completed")).toHaveLength(
      1,
    );
    expect(new Set(ctx.store.sessions.map((session) => session.status))).toEqual(
      new Set(["ready_for_approval"]),
    );
  });

  it("cancels DATA-1G states without deleting provenance or Customers", async () => {
    const valid = await mappedSession({});
    const staged = await valid.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: valid.sessionId,
    });
    expect(staged.ok).toBe(true);
    const cancelled = await valid.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: valid.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("cancelled");
    expect(valid.store.staging).toHaveLength(2);
    expect(valid.store.mappings.length).toBeGreaterThan(0);
    expect(valid.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(1);
    const replay = await valid.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: valid.sessionId,
    });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error.code).toBe("INVALID_STATE");
    nonEffect(valid.store);

    const review = await mappedSession({ bytes: INVALID_CSV });
    const blocked = await review.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: review.sessionId,
    });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;
    expect(blocked.value.status).toBe("review_required");
    const cancelledReview = await review.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: review.sessionId,
    });
    expect(cancelledReview.ok).toBe(true);
    expect(review.store.staging).toHaveLength(1);
  });

  it("does not treat leftover staging as current after a mapping edit", async () => {
    const ctx = await mappedSession({});
    const first = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok).toBe(true);
    ctx.store.sessions[0]!.status = "mapped";
    const edited = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 1 }),
      targetField: "phone",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.status).toBe("mapping_required");
    const listed = await ctx.service.listDataIntakeStagingState({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value.rows).toEqual([]);
    const confirmed = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.value.snapshotHash).not.toBe(ctx.mappingHash);
    const stale = await ctx.service.validateAndStageDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("MAPPING_HASH_MISMATCH");
  });
});
