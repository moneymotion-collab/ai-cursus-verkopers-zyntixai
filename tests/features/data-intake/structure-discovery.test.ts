import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  OWNER_USER,
  STAFF_USER,
  VIEWER_USER,
  createService,
} from "./harness";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import { DATA_CSV_MIME, DATA_PARSER_VERSION, DATA_XLSX_MIME } from "@/features/data-intake/domain/constants";
import {
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
} from "./memory-query-client";
import { buildSimpleXlsx } from "./xlsx-fixtures";

const CSV_BYTES = new TextEncoder().encode("qa,col\n1,2\n");

async function verifiedSource(input: {
  userId?: string;
  sourceKind?: "csv" | "xlsx";
  bytes?: Uint8Array;
  filename?: string;
  mimeType?: string;
  verify?: boolean;
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
  if (!registered.ok) throw new Error("register failed");
  if (input.verify !== false) {
    const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: input.filename ?? (sourceKind === "csv" ? "qa.csv" : "qa.xlsx"),
      mimeType: input.mimeType ?? (sourceKind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME),
      bytes,
    });
    if (!uploaded.ok) throw new Error(`upload failed ${uploaded.error.code}`);
  }
  return { ...ctx, created, registered, bytes };
}

describe("DATA-1E source structure discovery", () => {
  it("lets Owner and Admin discover a verified CSV without exposing rows", async () => {
    const owner = await verifiedSource({ userId: OWNER_USER });
    const discovered = await owner.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: owner.created.value.sessionId,
    });
    expect(discovered.ok).toBe(true);
    if (!discovered.ok) return;
    expect(discovered.value.status).toBe("parsed");
    expect(discovered.value.eventType).toBe("source_parsed");
    expect(discovered.value.replayed).toBe(false);
    expect(discovered.value.discovery?.parserVersion).toBe(DATA_PARSER_VERSION);
    expect(discovered.value.discovery?.headers).toEqual(["qa", "col"]);
    expect(JSON.stringify(discovered.value)).not.toContain("1,2");
    expect(owner.store.events.filter((event) => event.event_type === "source_parsed")).toHaveLength(1);
    expect(JSON.stringify(owner.store.events.at(-1)?.metadata)).not.toContain("qa,col");

    const admin = await verifiedSource({ userId: ADMIN_USER });
    const adminDiscovered = await admin.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: admin.created.value.sessionId,
    });
    expect(adminDiscovered.ok).toBe(true);
  });

  it("is idempotent on replay and does not duplicate the parsed event", async () => {
    const ctx = await verifiedSource({});
    const first = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    const second = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(second.value.status).toBe("parsed");
    expect(ctx.store.events.filter((event) => event.event_type === "source_parsed")).toHaveLength(1);
    expect(ctx.store.mappings).toHaveLength(0);
    expect(ctx.store.staging).toHaveLength(0);
    expect(ctx.store.plans).toHaveLength(0);
    expect(ctx.store.rowResults).toHaveLength(0);
    expect(ctx.store.links).toHaveLength(0);
  });

  it("discovers a verified XLSX workbook", async () => {
    const bytes = await buildSimpleXlsx({
      sheets: [{ name: "Customers", rows: [["id", "label"], [1, "alpha"]] }],
    });
    const ctx = await verifiedSource({
      sourceKind: "xlsx",
      bytes,
      filename: "qa.xlsx",
      mimeType: DATA_XLSX_MIME,
    });
    const discovered = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(discovered.ok).toBe(true);
    if (!discovered.ok) return;
    expect(discovered.value.discovery?.format).toBe("xlsx");
    if (discovered.value.discovery?.format === "xlsx") {
      expect(discovered.value.discovery.selectedSheet).toBe("Customers");
      expect(discovered.value.discovery.headers).toEqual(["id", "label"]);
    }
  });

  it("denies Staff, Viewer, foreign Owner, unverified sources, cancelled sessions, and client paths", async () => {
    const ctx = await verifiedSource({});
    const payload = {
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    };
    const staff = createService({ userId: STAFF_USER });
    const viewer = createService({ userId: VIEWER_USER });
    const foreign = createService({ userId: FOREIGN_USER });
    const anon = createService({ userId: null });
    const suspendedTables = emptyDataIntakeTables();
    seedOrg(suspendedTables, ORG_A);
    seedMember(suspendedTables, {
      userId: OWNER_USER,
      role: "owner",
      membershipId: OWNER_MEMBER,
      status: "suspended",
    });
    const suspended = createService({
      userId: OWNER_USER,
      tables: suspendedTables,
      seedDefaultOrg: false,
    });
    const staffResult = await staff.service.discoverDataIntakeSourceStructure(payload);
    const viewerResult = await viewer.service.discoverDataIntakeSourceStructure(payload);
    const foreignResult = await foreign.service.discoverDataIntakeSourceStructure(payload);
    const anonResult = await anon.service.discoverDataIntakeSourceStructure(payload);
    const suspendedResult = await suspended.service.discoverDataIntakeSourceStructure(payload);
    expect(staffResult.ok).toBe(false);
    if (!staffResult.ok) expect(staffResult.error.code).toBe("FORBIDDEN_ROLE");
    expect(viewerResult.ok).toBe(false);
    if (!viewerResult.ok) expect(viewerResult.error.code).toBe("FORBIDDEN_ROLE");
    expect(foreignResult.ok).toBe(false);
    if (!foreignResult.ok) expect(foreignResult.error.code).toBe("ORG_NOT_FOUND");
    expect(anonResult.ok).toBe(false);
    if (!anonResult.ok) expect(anonResult.error.code).toBe("UNAUTHORIZED");
    expect(suspendedResult.ok).toBe(false);
    if (!suspendedResult.ok) expect(suspendedResult.error.code).toBe("ORG_NOT_FOUND");

    const unverified = await verifiedSource({ verify: false });
    const unverifiedResult = await unverified.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: unverified.created.value.sessionId,
    });
    expect(unverifiedResult.ok).toBe(false);
    if (!unverifiedResult.ok) expect(unverifiedResult.error.code).toBe("SOURCE_NOT_VERIFIED");

    const cancelled = await verifiedSource({});
    await cancelled.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: cancelled.created.value.sessionId,
    });
    const afterCancel = await cancelled.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: cancelled.created.value.sessionId,
    });
    expect(afterCancel.ok).toBe(false);
    if (!afterCancel.ok) expect(afterCancel.error.code).toBe("INVALID_STATE");

    const pathRejected = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      storagePath: "evil.csv",
    } as never);
    expect(pathRejected.ok).toBe(false);
    if (!pathRejected.ok) expect(pathRejected.error.code).toBe("SOURCE_INVALID");
  });

  it("does not log source bytes or headers", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = await verifiedSource({});
    await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    const logged = [...spy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("qa,col");
    expect(logged).not.toContain("1,2");
    spy.mockRestore();
    errorSpy.mockRestore();
  });
});
