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

const CSV_BYTES = new TextEncoder().encode("Voornaam,Achternaam,E-mail,Notes\na,b,c,d\n");

async function parsedSession(input: {
  userId?: string;
  bytes?: Uint8Array;
  sourceKind?: "csv" | "xlsx";
  filename?: string;
  mimeType?: string;
}) {
  const sourceKind = input.sourceKind ?? "csv";
  const bytes = input.bytes ?? CSV_BYTES;
  const ctx = createService({ userId: input.userId ?? OWNER_USER });
  const created = await ctx.service.createDataIntakeSession({
    organizationId: ORG_A,
    targetDomain: "customer",
    sourceKind,
  });
  if (!created.ok) throw new Error("create failed");
  const registered = await ctx.service.registerDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: input.filename ?? (sourceKind === "csv" ? "qa.csv" : "qa.xlsx"),
    mimeType: input.mimeType ?? (sourceKind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME),
    byteSize: bytes.byteLength,
    sha256: sha256Hex(bytes),
    sourceKind,
  });
  if (!registered.ok) throw new Error(`register failed ${registered.error.code}`);
  const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: input.filename ?? (sourceKind === "csv" ? "qa.csv" : "qa.xlsx"),
    mimeType: input.mimeType ?? (sourceKind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME),
    bytes,
  });
  if (!uploaded.ok) throw new Error(`upload failed ${uploaded.error.code}`);
  const discovered = await ctx.service.discoverDataIntakeSourceStructure({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
  });
  if (!discovered.ok) throw new Error(`discover failed ${discovered.error.code}`);
  return { ...ctx, sessionId: created.value.sessionId, sourceId: uploaded.value.sourceId };
}

function nonEffect(store: ReturnType<typeof createService>["store"]) {
  expect(store.staging).toEqual([]);
  expect(store.plans).toEqual([]);
  expect(store.rowResults).toEqual([]);
  expect(store.links).toEqual([]);
}

describe("DATA-1F semantic mapping", () => {
  it("lets Owner map distinct columns, ignore one, and confirm a deterministic snapshot", async () => {
    const ctx = await parsedSession({});
    expect(ctx.service.listCustomerImportTargetCatalog().map((field) => field.key)).toEqual([
      "display_name",
      "email",
      "phone",
      "first_name",
      "last_name",
    ]);
    expect(JSON.stringify(ctx.service.listCustomerImportTargetCatalog())).not.toContain(
      "organization_id",
    );
    const first = sourceColumnKey({ format: "csv", index: 0 });
    const email = sourceColumnKey({ format: "csv", index: 2 });
    const notes = sourceColumnKey({ format: "csv", index: 3 });
    const mappedName = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: first,
      targetField: "display_name",
    });
    const mappedEmail = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: email,
      targetField: "email",
    });
    const ignored = await ctx.service.ignoreDataIntakeSourceColumn({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: notes,
    });
    expect(mappedName.ok && mappedEmail.ok && ignored.ok).toBe(true);
    if (!mappedName.ok || !mappedEmail.ok || !ignored.ok) return;
    expect(mappedName.value.status).toBe("mapping_required");
    expect(ignored.value.completeness.ignored).toBe(1);
    expect(ignored.value.completeness.unresolved).toBe(1);
    expect(ignored.value.completeness.confirmable).toBe(true);

    const confirmed = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.value.status).toBe("mapped");
    expect(confirmed.value.eventType).toBe("mapping_confirmed");
    expect(confirmed.value.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
    expect(confirmed.value.decisions.filter((row) => row.status === "confirmed")).toHaveLength(2);
    expect(confirmed.value.decisions.some((row) => row.status === "rejected")).toBe(true);
    expect(JSON.stringify(confirmed.value)).not.toContain("a,b,c,d");
    expect(ctx.store.events.some((event) => event.event_type === "mapping_confirmed")).toBe(true);
    expect(JSON.stringify(ctx.store.events)).not.toContain("a,b,c,d");
    nonEffect(ctx.store);
  });

  it("allows Admin and is idempotent on identical mapping and confirm replay", async () => {
    const ctx = await parsedSession({ userId: ADMIN_USER });
    const key = sourceColumnKey({ format: "csv", index: 0 });
    const first = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    });
    const second = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(ctx.store.events.filter((event) => event.event_type === "mapping_proposed")).toHaveLength(1);
    const confirmA = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    const confirmB = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(confirmA.ok && confirmB.ok).toBe(true);
    if (!confirmA.ok || !confirmB.ok) return;
    expect(confirmB.value.replayed).toBe(true);
    expect(ctx.store.events.filter((event) => event.event_type === "mapping_confirmed")).toHaveLength(1);
    nonEffect(ctx.store);
  });

  it("denies Staff, Viewer, foreign Owner, unauthenticated, and suspended members", async () => {
    const owner = await parsedSession({});
    const key = sourceColumnKey({ format: "csv", index: 0 });
    const input = {
      organizationId: ORG_A,
      sessionId: owner.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    };
    const staff = await createService({ userId: STAFF_USER }).service.upsertDataIntakeMapping(input);
    const viewer = await createService({ userId: VIEWER_USER }).service.upsertDataIntakeMapping(input);
    const foreign = await createService({ userId: FOREIGN_USER }).service.upsertDataIntakeMapping(input);
    const anon = await createService({ userId: null }).service.upsertDataIntakeMapping(input);
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
    }).service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: owner.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    });
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");

    const foreignSession = await createService({ userId: FOREIGN_USER }).service.upsertDataIntakeMapping({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    });
    expect(foreignSession.ok).toBe(false);
    if (!foreignSession.ok) expect(foreignSession.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("rejects unknown columns, forbidden targets, duplicate targets, and pre-discovery sessions", async () => {
    const ctx = await parsedSession({});
    const unknown = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: "csv:99",
      targetField: "display_name",
    });
    const forbidden = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "organization_id",
    });
    const malformed = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "customer.email",
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe("SOURCE_COLUMN_UNKNOWN");
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.error.code).toBe("TARGET_FIELD_FORBIDDEN");
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.error.code).toBe("TARGET_FIELD_UNKNOWN");

    await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "email",
    });
    const duplicate = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 1 }),
      targetField: "email",
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.code).toBe("DUPLICATE_TARGET_MAPPING");

    const createdOnly = createService({ userId: OWNER_USER });
    const created = await createdOnly.service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const tooEarly = await createdOnly.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "display_name",
    });
    expect(tooEarly.ok).toBe(false);
    if (!tooEarly.ok) expect(tooEarly.error.code).toBe("INVALID_STATE");

    const incomplete = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(incomplete.ok).toBe(false);
    if (!incomplete.ok) expect(incomplete.error.code).toBe("MAPPING_INCOMPLETE");
    nonEffect(ctx.store);
  });

  it("denies cancelled sessions and maps XLSX columns with sheet identity", async () => {
    const bytes = await buildSimpleXlsx({
      sheets: [
        {
          name: "People",
          rows: [
            ["Naam", "Mail"],
            ["x", "y"],
          ],
        },
      ],
    });
    const ctx = await parsedSession({
      sourceKind: "xlsx",
      bytes,
      filename: "qa.xlsx",
      mimeType: DATA_XLSX_MIME,
    });
    const key = sourceColumnKey({ format: "xlsx", index: 0, sheetName: "People" });
    const mapped = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: key,
      targetField: "display_name",
    });
    expect(mapped.ok).toBe(true);

    const cancelled = await parsedSession({});
    await cancelled.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: cancelled.sessionId,
    });
    const afterCancel = await cancelled.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: cancelled.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "display_name",
    });
    expect(afterCancel.ok).toBe(false);
    if (!afterCancel.ok) expect(afterCancel.error.code).toBe("INVALID_STATE");
  });

  it("reopens a mapped session for a later edit and never writes Customers", async () => {
    const ctx = await parsedSession({});
    await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 0 }),
      targetField: "display_name",
    });
    const confirmed = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(confirmed.ok).toBe(true);
    const edited = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 1 }),
      targetField: "last_name",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.status).toBe("mapping_required");
    expect(ctx.store.mappings.some((row) => row.status === "confirmed")).toBe(false);
    expect(JSON.stringify(ctx.store)).not.toContain("create_customer");
    expect(sha256Hex(CSV_BYTES)).toHaveLength(64);
    nonEffect(ctx.store);
  });
});
