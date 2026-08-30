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
import { DATA_CSV_MIME } from "@/features/data-intake/domain/constants";
import { sourceColumnKey } from "@/features/data-intake/domain/source-column";
import {
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
} from "./memory-query-client";
import {
  createMemoryDataIntakeMatchingRpc,
  type DataIntakeMemoryStore,
  type MemoryCustomer,
} from "./memory-rpc";
import { DATA_INTAKE_MATCHING_RPC } from "@/features/data-intake/server/data-intake-matching-rpc";

const VALID_CSV = new TextEncoder().encode(
  "name,email\nAlice Example,alice@example.com\nBob Example,bob@example.com\n",
);
const CASE_CSV = new TextEncoder().encode("name,email\nPerson Example,PERSON@EXAMPLE.COM\n");
const NULL_EMAIL_CSV = new TextEncoder().encode("name,email\nAlice Example,\n");
const INVALID_CSV = new TextEncoder().encode("name,email\n,not-an-email\n");
const NAME_CSV = new TextEncoder().encode("name,email\nJohn Smith,other@example.com\n");
const FUZZY_CSV = new TextEncoder().encode("name,email\nAlice Example,alic@example.com\n");
const DUP_CSV = new TextEncoder().encode(
  "name,email\nAlice One,same@example.com\nAlice Two,same@example.com\n",
);
const CUSTOMER_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CUSTOMER_A2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const CUSTOMER_B = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function nonEffect(store: DataIntakeMemoryStore, customers: MemoryCustomer[]) {
  expect(store.customers).toEqual(customers);
  expect(store.plans).toEqual([]);
  expect(store.rowResults).toEqual([]);
  expect(store.links).toEqual([]);
}

function seedCustomer(store: DataIntakeMemoryStore, customer: MemoryCustomer) {
  store.customers.push(customer);
}

async function stagedSession(input: {
  userId?: string;
  bytes?: Uint8Array;
  map?: Array<{ index: number; target: "display_name" | "email" }>;
}) {
  const bytes = input.bytes ?? VALID_CSV;
  const ctx = createService({ userId: input.userId ?? OWNER_USER });
  const created = await ctx.service.createDataIntakeSession({
    organizationId: ORG_A,
    targetDomain: "customer",
    sourceKind: "csv",
  });
  if (!created.ok) throw new Error("create failed");
  const registered = await ctx.service.registerDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: "qa.csv",
    mimeType: DATA_CSV_MIME,
    byteSize: bytes.byteLength,
    sha256: sha256Hex(bytes),
    sourceKind: "csv",
  });
  if (!registered.ok) throw new Error(`register failed ${registered.error.code}`);
  const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: "qa.csv",
    mimeType: DATA_CSV_MIME,
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
      sourceFieldKey: sourceColumnKey({ format: "csv", index: item.index }),
      targetField: item.target,
    });
    if (!mapped.ok) throw new Error(`map failed ${mapped.error.code}`);
  }
  const confirmed = await ctx.service.confirmDataIntakeMapping({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
  });
  if (!confirmed.ok) throw new Error(`confirm failed ${confirmed.error.code}`);
  const staged = await ctx.service.validateAndStageDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    mappingHash: confirmed.value.snapshotHash,
  });
  if (!staged.ok) throw new Error(`stage failed ${staged.error.code}`);
  return {
    ...ctx,
    sessionId: created.value.sessionId,
    sourceId: uploaded.value.sourceId as string,
    mappingHash: confirmed.value.snapshotHash as string,
    staged,
  };
}

describe("DATA-1H deterministic Customer matching", () => {
  it("links exactly one same-organization Customer and never writes Customers or import tables", async () => {
    const ctx = await stagedSession({});
    seedCustomer(ctx.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
    });
    const before = structuredClone(ctx.store.customers);
    const fingerprints = ctx.store.staging.map((row) => row.row_fingerprint);
    const raw = structuredClone(ctx.store.staging.map((row) => row.raw_values));
    const normalized = structuredClone(ctx.store.staging.map((row) => row.normalized_values));
    const errors = structuredClone(ctx.store.staging.map((row) => row.error_codes));
    const matched = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    expect(matched.ok).toBe(true);
    if (!matched.ok) return;
    expect(matched.value.matcherVersion).toBe("customer-matcher-v1");
    expect(matched.value.eventType).toBe("matching_completed");
    expect(matched.value.summary.exactMatches).toBe(1);
    expect(matched.value.summary.noMatches).toBe(1);
    expect(matched.value.rows[0]).toMatchObject({
      resolution: "duplicate",
      targetOperation: "link",
      targetRecordId: CUSTOMER_A,
    });
    expect(matched.value.rows[1]).toMatchObject({
      resolution: "create",
      targetOperation: "create",
      targetRecordId: null,
    });
    expect(ctx.store.staging.map((row) => row.row_fingerprint)).toEqual(fingerprints);
    expect(ctx.store.staging.map((row) => row.raw_values)).toEqual(raw);
    expect(ctx.store.staging.map((row) => row.normalized_values)).toEqual(normalized);
    expect(ctx.store.staging.map((row) => row.error_codes)).toEqual(errors);
    expect(JSON.stringify(ctx.store.events)).not.toContain("alice@example.com");
    expect(JSON.stringify(ctx.store.events)).not.toContain("create_customer");
    nonEffect(ctx.store, before);
  });

  it("matches a canonical email against a differently cased staged source value", async () => {
    const ctx = await stagedSession({ bytes: CASE_CSV });
    seedCustomer(ctx.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "person@example.com",
      archived_at: null,
    });
    const matched = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(matched.ok).toBe(true);
    if (!matched.ok) return;
    expect(ctx.store.staging[0]?.normalized_values.email).toBe("person@example.com");
    expect(matched.value.rows[0]?.targetRecordId).toBe(CUSTOMER_A);
    expect(matched.value.rows[0]?.resolution).toBe("duplicate");
    nonEffect(ctx.store, ctx.store.customers);
  });

  it("classifies no-match, no-key, name-only, and fuzzy values without creating Customers", async () => {
    const none = await stagedSession({});
    const noMatch = await none.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: none.sessionId,
    });
    expect(noMatch.ok).toBe(true);
    if (!noMatch.ok) return;
    expect(noMatch.value.rows.every((row) => row.resolution === "create")).toBe(true);
    expect(noMatch.value.rows.every((row) => row.targetRecordId === null)).toBe(true);
    nonEffect(none.store, []);

    const missing = await stagedSession({ bytes: NULL_EMAIL_CSV });
    const noKey = await missing.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: missing.sessionId,
    });
    expect(noKey.ok).toBe(true);
    if (!noKey.ok) return;
    expect(noKey.value.rows[0]).toMatchObject({
      resolution: "none",
      targetOperation: null,
      targetRecordId: null,
    });
    expect(noKey.value.summary.noKeyRows).toBe(1);
    expect(noKey.value.status).toBe("review_required");

    const named = await stagedSession({ bytes: NAME_CSV });
    seedCustomer(named.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "john@example.com",
      archived_at: null,
      display_name: "John Smith",
    });
    const nameOnly = await named.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: named.sessionId,
    });
    expect(nameOnly.ok).toBe(true);
    if (!nameOnly.ok) return;
    expect(nameOnly.value.rows[0]?.resolution).toBe("create");
    expect(nameOnly.value.rows[0]?.targetRecordId).toBeNull();

    const fuzzy = await stagedSession({ bytes: FUZZY_CSV });
    seedCustomer(fuzzy.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
    });
    const near = await fuzzy.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: fuzzy.sessionId,
    });
    expect(near.ok).toBe(true);
    if (!near.ok) return;
    expect(near.value.rows[0]?.resolution).toBe("create");
    expect(near.value.rows[0]?.targetRecordId).toBeNull();
  });

  it("treats duplicate canonical emails and staged-row collisions as conflict", async () => {
    const multi = await stagedSession({ bytes: CASE_CSV });
    seedCustomer(multi.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "person@example.com",
      archived_at: null,
    });
    seedCustomer(multi.store, {
      id: CUSTOMER_A2,
      organization_id: ORG_A,
      email: "person@example.com",
      archived_at: null,
    });
    const ambiguous = await multi.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: multi.sessionId,
    });
    expect(ambiguous.ok).toBe(true);
    if (!ambiguous.ok) return;
    expect(ambiguous.value.rows[0]).toMatchObject({
      resolution: "conflict",
      targetRecordId: null,
    });
    expect(ambiguous.value.summary.ambiguousRows).toBe(1);

    const sameTarget = await stagedSession({ bytes: DUP_CSV });
    seedCustomer(sameTarget.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "same@example.com",
      archived_at: null,
    });
    const collision = await sameTarget.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: sameTarget.sessionId,
    });
    expect(collision.ok).toBe(true);
    if (!collision.ok) return;
    expect(collision.value.rows.every((row) => row.resolution === "conflict")).toBe(true);
    expect(collision.value.rows.every((row) => row.targetRecordId === null)).toBe(true);
    expect(sameTarget.store.staging).toHaveLength(2);

    const createDup = await stagedSession({ bytes: DUP_CSV });
    const createCollision = await createDup.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: createDup.sessionId,
    });
    expect(createCollision.ok).toBe(true);
    if (!createCollision.ok) return;
    expect(createCollision.value.rows.every((row) => row.resolution === "conflict")).toBe(true);
    expect(createCollision.value.summary.collisions).toBe(2);
    expect(createDup.store.customers).toEqual([]);
  });

  it("never sees a foreign-organization Customer and rejects target injection", async () => {
    const ctx = await stagedSession({ bytes: CASE_CSV });
    seedCustomer(ctx.store, {
      id: CUSTOMER_B,
      organization_id: ORG_B,
      email: "person@example.com",
      archived_at: null,
    });
    const matched = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(matched.ok).toBe(true);
    if (!matched.ok) return;
    expect(matched.value.rows[0]?.resolution).toBe("create");
    expect(JSON.stringify(matched.value)).not.toContain(CUSTOMER_B);

    const injected = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      // @ts-expect-error caller must not choose a target
      targetRecordId: CUSTOMER_B,
    });
    expect(injected.ok).toBe(false);
    if (!injected.ok) expect(injected.error.code).toBe("SOURCE_INVALID");

    const rpc = createMemoryDataIntakeMatchingRpc({
      tables: ctx.tables,
      store: ctx.store,
    });
    const forced = await rpc.rpc(DATA_INTAKE_MATCHING_RPC, {
      p_operation: "confirm_source_matching",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: {
        session_id: ctx.sessionId,
        source_id: ctx.sourceId,
        target_record_id: CUSTOMER_B,
      },
    });
    expect(forced.data).toMatchObject({ ok: false, code: "SOURCE_INVALID" });
    expect(ctx.store.staging.every((row) => row.target_record_id !== CUSTOMER_B)).toBe(true);
  });

  it("skips blocked rows and still matches archived same-organization Customers", async () => {
    const blocked = await stagedSession({ bytes: INVALID_CSV });
    seedCustomer(blocked.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "not-an-email",
      archived_at: null,
    });
    const skipped = await blocked.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: blocked.sessionId,
    });
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(skipped.value.rows[0]).toMatchObject({
      lifecycle: "blocked",
      resolution: "none",
      targetRecordId: null,
    });
    expect(skipped.value.rows[0]?.errorCodes).toEqual(
      expect.arrayContaining(["REQUIRED_VALUE_MISSING", "INVALID_EMAIL"]),
    );
    expect(skipped.value.status).toBe("review_required");

    const archived = await stagedSession({ bytes: CASE_CSV });
    seedCustomer(archived.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "person@example.com",
      archived_at: "2026-01-01T00:00:00.000Z",
    });
    const linked = await archived.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: archived.sessionId,
    });
    expect(linked.ok).toBe(true);
    if (!linked.ok) return;
    expect(linked.value.rows[0]).toMatchObject({
      resolution: "duplicate",
      targetOperation: "link",
      targetRecordId: CUSTOMER_A,
    });
  });

  it("replays, serializes concurrency, and recomputes after a canonical Customer change", async () => {
    const ctx = await stagedSession({ bytes: CASE_CSV });
    const first = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.rows[0]?.resolution).toBe("create");
    const second = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(
      ctx.store.events.filter((event) => event.event_type === "matching_completed"),
    ).toHaveLength(1);

    seedCustomer(ctx.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "person@example.com",
      archived_at: null,
    });
    const recomputed = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(recomputed.ok).toBe(true);
    if (!recomputed.ok) return;
    expect(recomputed.value.replayed).toBe(false);
    expect(recomputed.value.rows[0]?.targetRecordId).toBe(CUSTOMER_A);
    expect(
      ctx.store.events.filter((event) => event.event_type === "matching_completed"),
    ).toHaveLength(2);

    const concurrent = await stagedSession({});
    seedCustomer(concurrent.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
    });
    const [left, right] = await Promise.all([
      concurrent.service.matchDataIntakeSourceCustomers({
        organizationId: ORG_A,
        sessionId: concurrent.sessionId,
      }),
      concurrent.service.matchDataIntakeSourceCustomers({
        organizationId: ORG_A,
        sessionId: concurrent.sessionId,
      }),
    ]);
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect([left.value.replayed, right.value.replayed].filter(Boolean)).toHaveLength(1);
    expect(
      concurrent.store.events.filter((event) => event.event_type === "matching_completed"),
    ).toHaveLength(1);
    expect(new Set(concurrent.store.staging.map((row) => row.target_record_id))).toEqual(
      new Set([CUSTOMER_A, null]),
    );
  });

  it("authorizes Owner and Admin and denies Staff, Viewer, foreign, suspended, and unauthenticated actors", async () => {
    const owner = await stagedSession({});
    const payload = { organizationId: ORG_A, sessionId: owner.sessionId };
    const adminCtx = await stagedSession({ userId: ADMIN_USER });
    const admin = await adminCtx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: adminCtx.sessionId,
    });
    expect(admin.ok).toBe(true);

    const staff = await createService({ userId: STAFF_USER }).service.matchDataIntakeSourceCustomers(
      payload,
    );
    const viewer = await createService({ userId: VIEWER_USER }).service.matchDataIntakeSourceCustomers(
      payload,
    );
    const foreign = await createService({ userId: FOREIGN_USER }).service.matchDataIntakeSourceCustomers(
      payload,
    );
    const anon = await createService({ userId: null }).service.matchDataIntakeSourceCustomers(payload);
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
    }).service.matchDataIntakeSourceCustomers(payload);
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");

    const foreignSession = await createService({
      userId: FOREIGN_USER,
    }).service.matchDataIntakeSourceCustomers({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
    });
    expect(foreignSession.ok).toBe(false);
    if (!foreignSession.ok) expect(foreignSession.error.code).toBe("SESSION_NOT_FOUND");

    const foreignSource = await createService({
      userId: FOREIGN_USER,
    }).service.matchDataIntakeSourceCustomers({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
      sourceId: owner.sourceId,
    });
    expect(foreignSource.ok).toBe(false);
    if (!foreignSource.ok) expect(foreignSource.error.code).toBe("SESSION_NOT_FOUND");

    const rpc = createMemoryDataIntakeMatchingRpc({
      tables: owner.tables,
      store: owner.store,
      isServiceRole: false,
    });
    const withoutRole = await rpc.rpc(DATA_INTAKE_MATCHING_RPC, {
      p_operation: "confirm_source_matching",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: { session_id: owner.sessionId, source_id: owner.sourceId },
    });
    expect(withoutRole.data).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
  });

  it("keeps cancellation available after matching and does not invent a matching state", async () => {
    const ctx = await stagedSession({});
    const matched = await ctx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(matched.ok).toBe(true);
    if (!matched.ok) return;
    expect(matched.value.status).toBe("ready_for_approval");
    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("cancelled");
    expect(ctx.store.staging).toHaveLength(2);
    nonEffect(ctx.store, []);
  });
});
