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
import { DATA_CSV_MIME, DATA_INTAKE_STORAGE_BUCKET } from "@/features/data-intake/domain/constants";
import { sourceColumnKey } from "@/features/data-intake/domain/source-column";
import {
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
} from "./memory-query-client";
import {
  createMemoryDataIntakePlanningRpc,
  type DataIntakeMemoryStore,
  type MemoryCustomer,
} from "./memory-rpc";
import { DATA_INTAKE_PLANNING_RPC } from "@/features/data-intake/server/data-intake-planning-rpc";

const VALID_CSV = new TextEncoder().encode(
  "name,email\nAlice Example,alice@example.com\nBob Example,bob@example.com\n",
);
const NULL_EMAIL_CSV = new TextEncoder().encode("name,email\nAlice Example,\n");
const INVALID_CSV = new TextEncoder().encode("name,email\n,not-an-email\n");
const DUP_CSV = new TextEncoder().encode(
  "name,email\nAlice One,same@example.com\nAlice Two,same@example.com\n",
);
const CUSTOMER_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CUSTOMER_B = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function nonEffect(store: DataIntakeMemoryStore, customers: MemoryCustomer[]) {
  expect(store.customers).toEqual(customers);
  expect(store.rowResults).toEqual([]);
  expect(store.links).toEqual([]);
}

function seedCustomer(store: DataIntakeMemoryStore, customer: MemoryCustomer) {
  store.customers.push(customer);
}

async function stagedSession(input: {
  userId?: string;
  bytes?: Uint8Array;
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
  for (const item of [
    { index: 0, target: "display_name" as const },
    { index: 1, target: "email" as const },
  ]) {
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
    bytes,
  };
}

async function matchedPlanSession() {
  const ctx = await stagedSession({});
  seedCustomer(ctx.store, {
    id: CUSTOMER_A,
    organization_id: ORG_A,
    email: "alice@example.com",
    archived_at: null,
  });
  const matched = await ctx.service.matchDataIntakeSourceCustomers({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    mappingHash: ctx.mappingHash,
  });
  if (!matched.ok) throw new Error(`match failed ${matched.error.code}`);
  return { ...ctx, matched, customers: structuredClone(ctx.store.customers) };
}

describe("DATA-1I governed import planning and approval", () => {
  it("creates a deterministic happy-path plan without Customer writes or execution tables", async () => {
    const ctx = await matchedPlanSession();
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      mappingHash: ctx.mappingHash,
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.value.planStatus).toBe("draft");
    expect(planned.value.summary).toMatchObject({
      sourceDataRows: 2,
      createCandidates: 1,
      linkCandidates: 1,
      blockedRows: 0,
      conflicts: 0,
      noKeyRows: 0,
      executableRows: 2,
    });
    expect(planned.value.snapshot?.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetOperation: "link",
          targetRecordId: CUSTOMER_A,
        }),
        expect.objectContaining({
          targetOperation: "create",
          targetRecordId: null,
        }),
      ]),
    );
    expect(planned.value.eventType).toBe("plan_created");
    expect(ctx.store.plans).toHaveLength(1);
    expect(JSON.stringify(ctx.store.events)).not.toContain("alice@example.com");
    nonEffect(ctx.store, ctx.customers);
  });

  it("denies plan creation when ready_for_approval has no current matching_completed", async () => {
    const ctx = await stagedSession({});
    expect(ctx.store.sessions[0]?.status).toBe("ready_for_approval");
    expect(ctx.store.events.some((event) => event.event_type === "matching_completed")).toBe(
      false,
    );
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(false);
    if (!planned.ok) expect(planned.error.code).toBe("INVALID_STATE");
    expect(ctx.store.plans).toEqual([]);
    nonEffect(ctx.store, []);
  });

  it("rejects a historical matching_completed after staging resolution changes", async () => {
    const ctx = await matchedPlanSession();
    const createRow = ctx.store.staging.find((row) => row.target_operation === "create");
    if (!createRow) throw new Error("missing create row");
    createRow.resolution = "duplicate";
    createRow.target_operation = "link";
    createRow.target_record_id = CUSTOMER_A;
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(false);
    if (!planned.ok) expect(planned.error.code).toBe("PLAN_STALE");
    expect(ctx.store.plans).toEqual([]);
    nonEffect(ctx.store, ctx.customers);
  });

  it("denies planning when the stored source object hash no longer matches", async () => {
    const ctx = await matchedPlanSession();
    const source = ctx.store.sources[0];
    if (!source) throw new Error("missing source");
    const key = `${DATA_INTAKE_STORAGE_BUCKET}::${source.storage_path}`;
    ctx.objectStore.records.set(key, {
      bucket: DATA_INTAKE_STORAGE_BUCKET,
      path: source.storage_path,
      bytes: new TextEncoder().encode("name,email\nTampered,tampered@example.com\n"),
    });
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(false);
    if (!planned.ok) expect(planned.error.code).toBe("SOURCE_HASH_INVALID");
    expect(ctx.store.plans).toEqual([]);
  });

  it("denies approval after the confirmed mapping hash changes", async () => {
    const ctx = await matchedPlanSession();
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(true);
    ctx.store.mappings[0]!.target_field = "email";
    const approved = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(approved.ok).toBe(false);
    if (!approved.ok) {
      expect(["MAPPING_HASH_MISMATCH", "PLAN_STALE", "DUPLICATE_TARGET_MAPPING"]).toContain(
        approved.error.code,
      );
    }
    expect(ctx.store.plans[0]?.status).toBe("draft");
    expect(ctx.store.plans[0]?.plan_hash).toBe(planned.ok ? planned.value.planHash : null);
    nonEffect(ctx.store, ctx.customers);
  });

  it("denies approval when the staging snapshot changes after plan creation", async () => {
    const ctx = await matchedPlanSession();
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(true);
    ctx.store.staging[1]!.row_fingerprint = "f".repeat(64);
    const approved = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(approved.ok).toBe(false);
    if (!approved.ok) expect(approved.error.code).toBe("PLAN_STALE");
    expect(ctx.store.plans[0]?.status).toBe("draft");
    nonEffect(ctx.store, ctx.customers);
  });

  it("fails closed when a link target Customer is no longer valid", async () => {
    const ctx = await matchedPlanSession();
    ctx.store.customers[0]!.email = "changed@example.com";
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(false);
    if (!planned.ok) expect(planned.error.code).toBe("PLAN_STALE");
    expect(ctx.store.plans).toEqual([]);
  });

  it("denies plan creation for blocked, conflict, and no-key rows", async () => {
    const blocked = await stagedSession({ bytes: INVALID_CSV });
    await blocked.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: blocked.sessionId,
    });
    const blockedPlan = await blocked.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: blocked.sessionId,
    });
    expect(blockedPlan.ok).toBe(false);
    if (!blockedPlan.ok) expect(blockedPlan.error.code).toBe("INVALID_STATE");
    expect(blocked.store.plans).toEqual([]);

    const conflict = await stagedSession({ bytes: DUP_CSV });
    await conflict.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: conflict.sessionId,
    });
    const conflictPlan = await conflict.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: conflict.sessionId,
    });
    expect(conflictPlan.ok).toBe(false);
    if (!conflictPlan.ok) expect(conflictPlan.error.code).toBe("INVALID_STATE");
    expect(conflict.store.plans).toEqual([]);

    const noKey = await stagedSession({ bytes: NULL_EMAIL_CSV });
    await noKey.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: noKey.sessionId,
    });
    const noKeyPlan = await noKey.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: noKey.sessionId,
    });
    expect(noKeyPlan.ok).toBe(false);
    if (!noKeyPlan.ok) expect(noKeyPlan.error.code).toBe("INVALID_STATE");
    expect(noKey.store.plans).toEqual([]);
  });

  it("rejects client-authored target operations and foreign Customer IDs", async () => {
    const ctx = await matchedPlanSession();
    const injected = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      targetRecordId: CUSTOMER_B,
      targetOperation: "link",
    } as never);
    expect(injected.ok).toBe(false);
    if (!injected.ok) expect(injected.error.code).toBe("SOURCE_INVALID");

    ctx.store.staging[0]!.target_record_id = CUSTOMER_B;
    const foreignCustomer = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(foreignCustomer.ok).toBe(false);
    if (!foreignCustomer.ok) expect(["PLAN_STALE", "INVALID_STATE"]).toContain(foreignCustomer.error.code);
    expect(ctx.store.plans).toEqual([]);
    nonEffect(ctx.store, ctx.customers);
  });

  it("replays the same plan, serializes concurrency, and keeps one authoritative draft", async () => {
    const ctx = await matchedPlanSession();
    const first = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    const second = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(second.value.planId).toBe(first.value.planId);
    expect(second.value.planHash).toBe(first.value.planHash);
    expect(ctx.store.plans.filter((plan) => plan.status === "draft")).toHaveLength(1);
    expect(ctx.store.events.filter((event) => event.event_type === "plan_created")).toHaveLength(1);

    const concurrent = await matchedPlanSession();
    const [left, right] = await Promise.all([
      concurrent.service.createOrReplayDataIntakeImportPlan({
        organizationId: ORG_A,
        sessionId: concurrent.sessionId,
      }),
      concurrent.service.createOrReplayDataIntakeImportPlan({
        organizationId: ORG_A,
        sessionId: concurrent.sessionId,
      }),
    ]);
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect([left.value.replayed, right.value.replayed].filter(Boolean)).toHaveLength(1);
    expect(concurrent.store.plans.filter((plan) => plan.status === "draft")).toHaveLength(1);
    expect(new Set([left.value.planHash, right.value.planHash]).size).toBe(1);
  });

  it("approves a clean plan, binds actor and hash, and never writes Customers", async () => {
    const ctx = await matchedPlanSession();
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    const approved = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      planHash: planned.value.planHash ?? undefined,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.value.status).toBe("approved");
    expect(approved.value.planStatus).toBe("approved");
    expect(approved.value.approvedByUserId).toBe(OWNER_USER);
    expect(approved.value.approvedAt).toBeTruthy();
    expect(approved.value.planHash).toBe(planned.value.planHash);
    expect(approved.value.eventType).toBe("plan_approved");
    expect(ctx.store.events.filter((event) => event.event_type === "plan_approved")).toHaveLength(1);
    expect(JSON.stringify(ctx.store.events)).not.toContain("alice@example.com");
    nonEffect(ctx.store, ctx.customers);
  });

  it("authorizes Owner and Admin approval and denies Staff, Viewer, foreign, suspended, and unauthenticated actors", async () => {
    const owner = await matchedPlanSession();
    const ownerPlan = await owner.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: owner.sessionId,
    });
    expect(ownerPlan.ok).toBe(true);
    const payload = { organizationId: ORG_A, sessionId: owner.sessionId };

    const adminCtx = await stagedSession({ userId: ADMIN_USER });
    seedCustomer(adminCtx.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
    });
    await adminCtx.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: adminCtx.sessionId,
    });
    await adminCtx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: adminCtx.sessionId,
    });
    const admin = await adminCtx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: adminCtx.sessionId,
    });
    expect(admin.ok).toBe(true);

    const staff = await createService({ userId: STAFF_USER }).service.approveDataIntakeImportPlan(payload);
    const viewer = await createService({ userId: VIEWER_USER }).service.approveDataIntakeImportPlan(payload);
    const foreign = await createService({ userId: FOREIGN_USER }).service.approveDataIntakeImportPlan(payload);
    const anon = await createService({ userId: null }).service.approveDataIntakeImportPlan(payload);
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
    }).service.approveDataIntakeImportPlan(payload);
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");

    const foreignPlan = await createService({ userId: FOREIGN_USER }).service.approveDataIntakeImportPlan({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
    });
    expect(foreignPlan.ok).toBe(false);
    if (!foreignPlan.ok) expect(foreignPlan.error.code).toBe("SESSION_NOT_FOUND");

    const rpc = createMemoryDataIntakePlanningRpc({
      tables: owner.tables,
      store: owner.store,
      isServiceRole: false,
    });
    const withoutRole = await rpc.rpc(DATA_INTAKE_PLANNING_RPC, {
      p_operation: "approve_import_plan",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: { session_id: owner.sessionId, source_id: owner.sourceId },
    });
    expect(withoutRole.data).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
  });

  it("replays approval without rewriting stamps or emitting a second event", async () => {
    const ctx = await matchedPlanSession();
    await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    const first = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(second.value.approvedAt).toBe(first.value.approvedAt);
    expect(second.value.approvedByUserId).toBe(first.value.approvedByUserId);
    expect(second.value.planHash).toBe(first.value.planHash);
    expect(ctx.store.events.filter((event) => event.event_type === "plan_approved")).toHaveLength(1);
    nonEffect(ctx.store, ctx.customers);
  });

  it("keeps an approved snapshot immutable and does not treat later staging drift as executable authority", async () => {
    const ctx = await matchedPlanSession();
    const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    const approved = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    const frozenHash = approved.value.planHash;
    const frozenApprovedAt = approved.value.approvedAt;
    ctx.store.plans[0]!.summary = { ...ctx.store.plans[0]!.summary, executable_rows: 99 };
    const replay = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    expect(replay.value.planHash).toBe(frozenHash);
    expect(ctx.store.plans[0]?.plan_hash).toBe(frozenHash);
    expect(ctx.store.plans[0]?.approved_at).toBe(frozenApprovedAt);

    ctx.store.staging[1]!.resolution = "none";
    ctx.store.staging[1]!.target_operation = null;
    const drifted = await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(drifted.ok).toBe(false);
    if (!drifted.ok) expect(drifted.error.code).toBe("PLAN_STALE");
    expect(ctx.store.plans[0]?.status).toBe("approved");
    expect(ctx.store.plans[0]?.plan_hash).toBe(frozenHash);
    nonEffect(ctx.store, ctx.customers);
  });

  it("cancels an approved session before execution without mutating the plan snapshot", async () => {
    const ctx = await matchedPlanSession();
    await ctx.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    const approved = await ctx.service.approveDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    const hash = approved.value.planHash;
    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("cancelled");
    expect(ctx.store.plans[0]?.status).toBe("approved");
    expect(ctx.store.plans[0]?.plan_hash).toBe(hash);
    expect(ctx.store.events.filter((event) => event.event_type === "import_cancelled")).toHaveLength(
      1,
    );
    nonEffect(ctx.store, ctx.customers);
  });
});
