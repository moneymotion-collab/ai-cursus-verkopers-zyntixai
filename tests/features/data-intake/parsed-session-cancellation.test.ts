import { describe, expect, it } from "vitest";
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
import { DATA_CSV_MIME, DATA_PARSER_VERSION } from "@/features/data-intake/domain/constants";
import {
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
} from "./memory-query-client";

const CSV_BYTES = new TextEncoder().encode("qa,col\n1,2\n");

async function verifiedSource(input: { userId?: string } = {}) {
  const bytes = CSV_BYTES;
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
  if (!registered.ok) throw new Error("register failed");
  const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: "qa.csv",
    mimeType: DATA_CSV_MIME,
    bytes,
  });
  if (!uploaded.ok) throw new Error(`upload failed ${uploaded.error.code}`);
  return { ...ctx, created, registered, bytes };
}

describe("DATA-1E-R1 parsed session cancellation", () => {
  it("still cancels created and source_ready sessions", async () => {
    const createdCtx = createService({ userId: OWNER_USER });
    const created = await createdCtx.service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const createdCancel = await createdCtx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
    });
    expect(createdCancel.ok).toBe(true);
    if (createdCancel.ok) expect(createdCancel.value.status).toBe("cancelled");

    const ready = await verifiedSource({});
    expect(ready.store.sessions[0]?.status).toBe("source_ready");
    const readyCancel = await ready.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ready.created.value.sessionId,
    });
    expect(readyCancel.ok).toBe(true);
    if (readyCancel.ok) expect(readyCancel.value.status).toBe("cancelled");
  });

  it("cancels a parsed session after structure discovery and retains evidence", async () => {
    const ctx = await verifiedSource({});
    const discovered = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(discovered.ok).toBe(true);
    if (!discovered.ok) return;
    expect(discovered.value.status).toBe("parsed");

    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("cancelled");
    expect(cancelled.value.eventType).toBe("import_cancelled");
    expect(ctx.store.sessions[0]?.status).toBe("cancelled");
    expect(ctx.store.sessions[0]?.cancelled_at).toEqual(expect.any(String));
    expect(ctx.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(
      1,
    );
    expect(ctx.store.events.filter((event) => event.event_type === "source_parsed")).toHaveLength(1);
    expect(ctx.store.events.filter((event) => event.event_type === "source_object_verified")).toHaveLength(
      1,
    );
    expect(JSON.stringify(ctx.store.events)).not.toContain("1,2");
    expect(ctx.store.sources[0]?.object_verified_at).toEqual(expect.any(String));
    expect(ctx.store.sources[0]?.header_row_index).toBe(1);
    expect(ctx.store.sources[0]?.parse_metadata).toMatchObject({
      parser_version: DATA_PARSER_VERSION,
      format: "csv",
    });
    expect(ctx.store.mappings).toHaveLength(0);
    expect(ctx.store.staging).toHaveLength(0);
    expect(ctx.store.plans).toHaveLength(0);
    expect(ctx.store.rowResults).toHaveLength(0);
    expect(ctx.store.links).toHaveLength(0);
  });

  it("keeps cancelled terminal: replay is INVALID_STATE and does not rewrite cancelled_at or duplicate events", async () => {
    const ctx = await verifiedSource({});
    const discovered = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    if (!discovered.ok) throw new Error("discover failed");
    const first = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(first.ok).toBe(true);
    const stamped = ctx.store.sessions[0]?.cancelled_at;
    expect(stamped).toEqual(expect.any(String));
    const replay = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error.code).toBe("INVALID_STATE");
    expect(ctx.store.sessions[0]?.cancelled_at).toBe(stamped);
    expect(ctx.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(
      1,
    );
  });

  it("lets Admin cancel parsed sessions and denies Staff, Viewer, suspended, and foreign Owner", async () => {
    const admin = await verifiedSource({ userId: ADMIN_USER });
    const adminDiscovered = await admin.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: admin.created.value.sessionId,
    });
    expect(adminDiscovered.ok).toBe(true);
    const adminCancel = await admin.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: admin.created.value.sessionId,
    });
    expect(adminCancel.ok).toBe(true);

    const owner = await verifiedSource({});
    const discovered = await owner.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: owner.created.value.sessionId,
    });
    if (!discovered.ok) throw new Error("discover failed");
    const payload = {
      organizationId: ORG_A,
      sessionId: owner.created.value.sessionId,
    };
    const staff = await createService({ userId: STAFF_USER }).service.cancelDataIntakeSession(payload);
    const viewer = await createService({ userId: VIEWER_USER }).service.cancelDataIntakeSession(
      payload,
    );
    const foreign = await createService({ userId: FOREIGN_USER }).service.cancelDataIntakeSession(
      payload,
    );
    const anon = await createService({ userId: null }).service.cancelDataIntakeSession(payload);
    const suspendedTables = emptyDataIntakeTables();
    seedOrg(suspendedTables, ORG_A);
    seedMember(suspendedTables, {
      userId: OWNER_USER,
      role: "owner",
      membershipId: OWNER_MEMBER,
      status: "suspended",
    });
    const suspended = await createService({
      userId: OWNER_USER,
      tables: suspendedTables,
      seedDefaultOrg: false,
    }).service.cancelDataIntakeSession(payload);
    expect(staff.ok).toBe(false);
    if (!staff.ok) expect(staff.error.code).toBe("FORBIDDEN_ROLE");
    expect(viewer.ok).toBe(false);
    if (!viewer.ok) expect(viewer.error.code).toBe("FORBIDDEN_ROLE");
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error.code).toBe("ORG_NOT_FOUND");
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.error.code).toBe("UNAUTHORIZED");
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");
  });

  it("rejects foreign session identity and later pipeline states that are not on the cancel allowlist", async () => {
    const ctx = await verifiedSource({});
    await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    const missing = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("SESSION_NOT_FOUND");

    const later = ctx.store.sessions[0];
    if (!later) throw new Error("missing session");
    later.status = "validating";
    const blocked = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("INVALID_STATE");
  });

  it("rejects discovery, register, and upload after parsed cancellation", async () => {
    const ctx = await verifiedSource({});
    const discovered = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    if (!discovered.ok) throw new Error("discover failed");
    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(cancelled.ok).toBe(true);

    const retryDiscover = await ctx.service.discoverDataIntakeSourceStructure({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(retryDiscover.ok).toBe(false);
    if (!retryDiscover.ok) expect(retryDiscover.error.code).toBe("INVALID_STATE");

    const retryRegister = await ctx.service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: CSV_BYTES.byteLength,
      sha256: sha256Hex(CSV_BYTES),
    });
    expect(retryRegister.ok).toBe(false);
    if (!retryRegister.ok) expect(retryRegister.error.code).toBe("INVALID_STATE");

    const retryUpload = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(retryUpload.ok).toBe(false);
    if (!retryUpload.ok) expect(retryUpload.error.code).toBe("INVALID_STATE");
  });
});
