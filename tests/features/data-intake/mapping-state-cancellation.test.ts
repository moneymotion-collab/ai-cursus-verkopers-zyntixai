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

const CSV_BYTES = new TextEncoder().encode("Voornaam,Achternaam,E-mail,Notes\na,b,c,d\n");
const NAME_KEY = sourceColumnKey({ format: "csv", index: 0 });
const NOTES_KEY = sourceColumnKey({ format: "csv", index: 3 });

async function parsedSession(userId = OWNER_USER) {
  const ctx = createService({ userId });
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
    byteSize: CSV_BYTES.byteLength,
    sha256: sha256Hex(CSV_BYTES),
    sourceKind: "csv",
  });
  if (!registered.ok) throw new Error(`register failed ${registered.error.code}`);
  const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: "qa.csv",
    mimeType: DATA_CSV_MIME,
    bytes: CSV_BYTES,
  });
  if (!uploaded.ok) throw new Error(`upload failed ${uploaded.error.code}`);
  const discovered = await ctx.service.discoverDataIntakeSourceStructure({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
  });
  if (!discovered.ok) throw new Error(`discover failed ${discovered.error.code}`);
  return { ...ctx, sessionId: created.value.sessionId };
}

async function mappingRequiredSession(userId = OWNER_USER) {
  const ctx = await parsedSession(userId);
  const mapped = await ctx.service.upsertDataIntakeMapping({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    sourceFieldKey: NAME_KEY,
    targetField: "display_name",
  });
  if (!mapped.ok) throw new Error(`map failed ${mapped.error.code}`);
  await ctx.service.ignoreDataIntakeSourceColumn({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    sourceFieldKey: NOTES_KEY,
  });
  return ctx;
}

async function mappedSession(userId = OWNER_USER) {
  const ctx = await mappingRequiredSession(userId);
  const confirmed = await ctx.service.confirmDataIntakeMapping({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
  });
  if (!confirmed.ok) throw new Error(`confirm failed ${confirmed.error.code}`);
  return { ...ctx, snapshotHash: confirmed.value.snapshotHash };
}

function nonEffect(store: ReturnType<typeof createService>["store"]) {
  expect(store.staging).toEqual([]);
  expect(store.plans).toEqual([]);
  expect(store.rowResults).toEqual([]);
  expect(store.links).toEqual([]);
}

describe("DATA-1F-R1 mapping-state cancellation", () => {
  it("lets Owner cancel mapping_required and retains mapping evidence", async () => {
    const ctx = await mappingRequiredSession();
    expect(ctx.store.sessions[0]?.status).toBe("mapping_required");
    const mappingCount = ctx.store.mappings.length;
    const proposedEvents = ctx.store.events.filter((event) => event.event_type === "mapping_proposed")
      .length;
    expect(mappingCount).toBeGreaterThan(0);

    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
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
    expect(ctx.store.mappings).toHaveLength(mappingCount);
    expect(ctx.store.events.filter((event) => event.event_type === "mapping_proposed")).toHaveLength(
      proposedEvents,
    );
    expect(ctx.store.sources[0]?.header_row_index).toBe(1);
    expect(JSON.stringify(ctx.store.events)).not.toContain("a,b,c,d");

    const retryMap = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: NAME_KEY,
      targetField: "display_name",
    });
    expect(retryMap.ok).toBe(false);
    if (!retryMap.ok) expect(retryMap.error.code).toBe("INVALID_STATE");
    nonEffect(ctx.store);
  });

  it("lets Owner cancel mapped sessions without rewriting confirmation evidence", async () => {
    const ctx = await mappedSession();
    expect(ctx.store.sessions[0]?.status).toBe("mapped");
    expect(ctx.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
    const confirmedRows = ctx.store.mappings.filter((row) => row.status === "confirmed");
    expect(confirmedRows.length).toBeGreaterThan(0);
    const confirmEvents = ctx.store.events.filter((event) => event.event_type === "mapping_confirmed");
    expect(confirmEvents).toHaveLength(1);
    expect(confirmEvents[0]?.metadata.mapping_hash).toBe(ctx.snapshotHash);
    const mappingSnapshot = JSON.stringify(ctx.store.mappings);

    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("cancelled");
    expect(ctx.store.sessions[0]?.cancelled_at).toEqual(expect.any(String));
    expect(ctx.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(
      1,
    );
    expect(ctx.store.events.filter((event) => event.event_type === "mapping_confirmed")).toHaveLength(
      1,
    );
    expect(ctx.store.events.find((event) => event.event_type === "mapping_confirmed")?.metadata.mapping_hash).toBe(
      ctx.snapshotHash,
    );
    expect(JSON.stringify(ctx.store.mappings)).toBe(mappingSnapshot);
    expect(ctx.store.mappings.some((row) => row.status === "confirmed")).toBe(true);

    const retryEdit = await ctx.service.upsertDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      sourceFieldKey: sourceColumnKey({ format: "csv", index: 1 }),
      targetField: "last_name",
    });
    const retryConfirm = await ctx.service.confirmDataIntakeMapping({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(retryEdit.ok).toBe(false);
    if (!retryEdit.ok) expect(retryEdit.error.code).toBe("INVALID_STATE");
    expect(retryConfirm.ok).toBe(false);
    if (!retryConfirm.ok) expect(retryConfirm.error.code).toBe("INVALID_STATE");
    expect(JSON.stringify(ctx.store.mappings)).toBe(mappingSnapshot);
    nonEffect(ctx.store);
  });

  it("lets Admin cancel mapping_required and mapped sessions", async () => {
    const required = await mappingRequiredSession(ADMIN_USER);
    const requiredCancel = await required.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: required.sessionId,
    });
    expect(requiredCancel.ok).toBe(true);

    const mapped = await mappedSession(ADMIN_USER);
    const mappedCancel = await mapped.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: mapped.sessionId,
    });
    expect(mappedCancel.ok).toBe(true);
    expect(mapped.store.events.filter((event) => event.event_type === "mapping_confirmed")).toHaveLength(
      1,
    );
  });

  it("denies Staff, Viewer, foreign, unauthenticated, and suspended actors for mapping states", async () => {
    const required = await mappingRequiredSession();
    const mapped = await mappedSession();
    const requiredPayload = { organizationId: ORG_A, sessionId: required.sessionId };
    const mappedPayload = { organizationId: ORG_A, sessionId: mapped.sessionId };

    for (const payload of [requiredPayload, mappedPayload]) {
      const staff = await createService({ userId: STAFF_USER }).service.cancelDataIntakeSession(
        payload,
      );
      const viewer = await createService({ userId: VIEWER_USER }).service.cancelDataIntakeSession(
        payload,
      );
      const foreign = await createService({ userId: FOREIGN_USER }).service.cancelDataIntakeSession(
        payload,
      );
      const foreignSession = await createService({
        userId: FOREIGN_USER,
      }).service.cancelDataIntakeSession({
        organizationId: ORG_B,
        sessionId: payload.sessionId,
      });
      const anon = await createService({ userId: null }).service.cancelDataIntakeSession(payload);
      const privileged = await createService({
        userId: OWNER_USER,
        isServiceRole: false,
      }).service.cancelDataIntakeSession(payload);
      expect(staff.ok).toBe(false);
      if (!staff.ok) expect(staff.error.code).toBe("FORBIDDEN_ROLE");
      expect(viewer.ok).toBe(false);
      if (!viewer.ok) expect(viewer.error.code).toBe("FORBIDDEN_ROLE");
      expect(foreign.ok).toBe(false);
      if (!foreign.ok) expect(foreign.error.code).toBe("ORG_NOT_FOUND");
      expect(foreignSession.ok).toBe(false);
      if (!foreignSession.ok) expect(foreignSession.error.code).toBe("SESSION_NOT_FOUND");
      expect(anon.ok).toBe(false);
      if (!anon.ok) expect(anon.error.code).toBe("UNAUTHORIZED");
      expect(privileged.ok).toBe(false);
      if (!privileged.ok) expect(privileged.error.code).toBe("UNAUTHORIZED");
    }

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
    }).service.cancelDataIntakeSession(requiredPayload);
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");
  });

  it("keeps later unauthorized states and cancelled replay fail-closed", async () => {
    const mapped = await mappedSession();
    const later = mapped.store.sessions[0];
    if (!later) throw new Error("missing session");
    later.status = "approved";
    const blocked = await mapped.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: mapped.sessionId,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("INVALID_STATE");
    later.status = "mapped";

    const first = await mapped.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: mapped.sessionId,
    });
    expect(first.ok).toBe(true);
    const stamped = mapped.store.sessions[0]?.cancelled_at;
    const mappingSnapshot = JSON.stringify(mapped.store.mappings);
    const hash = mapped.store.events.find((event) => event.event_type === "mapping_confirmed")
      ?.metadata.mapping_hash;
    const replay = await mapped.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: mapped.sessionId,
    });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error.code).toBe("INVALID_STATE");
    expect(mapped.store.sessions[0]?.cancelled_at).toBe(stamped);
    expect(mapped.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(
      1,
    );
    expect(JSON.stringify(mapped.store.mappings)).toBe(mappingSnapshot);
    expect(
      mapped.store.events.find((event) => event.event_type === "mapping_confirmed")?.metadata
        .mapping_hash,
    ).toBe(hash);
    nonEffect(mapped.store);
  });

  it("still cancels created, source_ready, and parsed sessions", async () => {
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

    const parsed = await parsedSession();
    expect(parsed.store.sessions[0]?.status).toBe("parsed");
    const parsedCancel = await parsed.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: parsed.sessionId,
    });
    expect(parsedCancel.ok).toBe(true);
    expect(parsed.store.sources[0]?.header_row_index).toBe(1);
  });
});
