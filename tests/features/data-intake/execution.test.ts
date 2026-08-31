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
  createMemoryDataIntakeExecutionRpc,
  type DataIntakeMemoryStore,
  type MemoryCustomer,
} from "./memory-rpc";
import { DATA_INTAKE_EXECUTION_RPC } from "@/features/data-intake/server/data-intake-execution-rpc";

const VALID_CSV = new TextEncoder().encode(
  "name,email\nAlice Example,alice@example.com\nBob Example,bob@example.com\n",
);
const BOB_ONLY_CSV = new TextEncoder().encode("name,email\nBob Example,bob@example.com\n");
const ALICE_ONLY_CSV = new TextEncoder().encode("name,email\nAlice Example,alice@example.com\n");
const CUSTOMER_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function seedCustomer(store: DataIntakeMemoryStore, customer: MemoryCustomer) {
  store.customers.push(customer);
}

function eventPayload(store: DataIntakeMemoryStore) {
  return JSON.stringify(store.events);
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

async function approvedPlanSession(input: {
  userId?: string;
  bytes?: Uint8Array;
  existing?: MemoryCustomer[];
} = {}) {
  const ctx = await stagedSession({ userId: input.userId, bytes: input.bytes });
  for (const customer of input.existing ?? [
    {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
      display_name: "Alice Example",
    },
  ]) {
    seedCustomer(ctx.store, customer);
  }
  const matched = await ctx.service.matchDataIntakeSourceCustomers({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    mappingHash: ctx.mappingHash,
  });
  if (!matched.ok) throw new Error(`match failed ${matched.error.code}`);
  const planned = await ctx.service.createOrReplayDataIntakeImportPlan({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    mappingHash: ctx.mappingHash,
  });
  if (!planned.ok) throw new Error(`plan failed ${planned.error.code}`);
  const approved = await ctx.service.approveDataIntakeImportPlan({
    organizationId: ORG_A,
    sessionId: ctx.sessionId,
    planHash: planned.value.planHash ?? undefined,
  });
  if (!approved.ok) throw new Error(`approve failed ${approved.error.code}`);
  return {
    ...ctx,
    planned,
    approved,
    customersBefore: structuredClone(ctx.store.customers),
  };
}

describe("DATA-1J governed Customer import execution", () => {
  it("creates a missing Customer, links an existing match, and writes row results without updates or external links", async () => {
    const ctx = await approvedPlanSession();
    const aliceBefore = ctx.store.customers.find((row) => row.id === CUSTOMER_A);
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      planHash: ctx.approved.value.planHash ?? undefined,
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(executed.value.status).toBe("completed");
    expect(executed.value.planStatus).toBe("executed");
    expect(executed.value.done).toBe(true);
    expect(executed.value.summary).toMatchObject({
      imported: 2,
      failed: 0,
      created: 1,
      linked: 1,
    });
    expect(executed.value.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: "link", outcome: "imported", targetRecordId: CUSTOMER_A }),
        expect.objectContaining({ operation: "create", outcome: "imported" }),
      ]),
    );
    expect(ctx.store.customers).toHaveLength(2);
    const created = ctx.store.customers.find((row) => row.email === "bob@example.com");
    expect(created).toMatchObject({
      display_name: "Bob Example",
      status: "onboarding",
      owner_member_id: null,
      created_by_member_id: OWNER_MEMBER,
      source: "import",
      archived_at: null,
    });
    expect(ctx.store.customers.find((row) => row.id === CUSTOMER_A)?.display_name).toBe(
      aliceBefore?.display_name,
    );
    expect(ctx.store.links).toEqual([]);
    expect(ctx.store.rowResults).toHaveLength(2);
    expect(new Set(ctx.store.rowResults.map((row) => row.row_fingerprint)).size).toBe(2);
    expect(eventPayload(ctx.store)).not.toContain("alice@example.com");
    expect(eventPayload(ctx.store)).not.toContain("bob@example.com");
    expect(ctx.store.events.filter((event) => event.event_type === "import_started")).toHaveLength(1);
    expect(ctx.store.events.some((event) => event.event_type === "import_completed")).toBe(true);
  });

  it("creates only when the approved plan has no existing match", async () => {
    const ctx = await approvedPlanSession({ bytes: BOB_ONLY_CSV, existing: [] });
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(executed.value.summary).toMatchObject({ created: 1, linked: 0, imported: 1 });
    expect(ctx.store.customers).toHaveLength(1);
    expect(ctx.store.customers[0]?.email).toBe("bob@example.com");
  });

  it("links only and never updates the existing Customer", async () => {
    const ctx = await approvedPlanSession({
      bytes: ALICE_ONLY_CSV,
      existing: [
        {
          id: CUSTOMER_A,
          organization_id: ORG_A,
          email: "alice@example.com",
          archived_at: null,
          display_name: "Alice Frozen",
          phone: "old",
        },
      ],
    });
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(executed.value.summary).toMatchObject({ created: 0, linked: 1 });
    expect(ctx.store.customers).toHaveLength(1);
    expect(ctx.store.customers[0]).toMatchObject({
      id: CUSTOMER_A,
      display_name: "Alice Frozen",
      phone: "old",
    });
  });

  it("denies draft, cancelled, superseded, and mismatched plan hashes before any Customer write", async () => {
    const draft = await stagedSession({});
    seedCustomer(draft.store, {
      id: CUSTOMER_A,
      organization_id: ORG_A,
      email: "alice@example.com",
      archived_at: null,
    });
    await draft.service.matchDataIntakeSourceCustomers({
      organizationId: ORG_A,
      sessionId: draft.sessionId,
    });
    await draft.service.createOrReplayDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: draft.sessionId,
    });
    const draftExec = await draft.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: draft.sessionId,
    });
    expect(draftExec.ok).toBe(false);
    if (!draftExec.ok) expect(draftExec.error.code).toBe("INVALID_STATE");
    expect(draft.store.customers).toHaveLength(1);
    expect(draft.store.rowResults).toEqual([]);

    const cancelled = await approvedPlanSession();
    await cancelled.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: cancelled.sessionId,
    });
    const cancelledExec = await cancelled.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: cancelled.sessionId,
    });
    expect(cancelledExec.ok).toBe(false);
    if (!cancelledExec.ok) expect(cancelledExec.error.code).toBe("INVALID_STATE");
    expect(cancelled.store.customers).toEqual(cancelled.customersBefore);

    const superseded = await approvedPlanSession();
    superseded.store.plans[0]!.status = "superseded";
    const supersededExec = await superseded.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: superseded.sessionId,
    });
    expect(supersededExec.ok).toBe(false);
    if (!supersededExec.ok) expect(supersededExec.error.code).toMatch(/PLAN_STALE|INVALID_STATE/);
    expect(superseded.store.customers).toEqual(superseded.customersBefore);

    const staleHash = await approvedPlanSession();
    const wrong = await staleHash.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: staleHash.sessionId,
      planHash: "b".repeat(64),
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error.code).toBe("PLAN_STALE");
    expect(staleHash.store.customers).toEqual(staleHash.customersBefore);
  });

  it("fails closed on stale source, matching, create-target appearance, and link-target drift", async () => {
    const sourceStale = await approvedPlanSession();
    sourceStale.store.sources[0]!.sha256 = "c".repeat(64);
    const sourceExec = await sourceStale.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: sourceStale.sessionId,
    });
    expect(sourceExec.ok).toBe(false);
    if (!sourceExec.ok) expect(sourceExec.error.code).toBe("SOURCE_HASH_INVALID");

    const matchingStale = await approvedPlanSession();
    matchingStale.store.events = matchingStale.store.events.filter(
      (event) => event.event_type !== "matching_completed",
    );
    const matchingExec = await matchingStale.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: matchingStale.sessionId,
    });
    expect(matchingExec.ok).toBe(false);
    if (!matchingExec.ok) expect(matchingExec.error.code).toMatch(/INVALID_STATE|PLAN_STALE/);

    const appeared = await approvedPlanSession();
    seedCustomer(appeared.store, {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      organization_id: ORG_A,
      email: "bob@example.com",
      archived_at: null,
    });
    const appearedExec = await appeared.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: appeared.sessionId,
    });
    expect(appearedExec.ok).toBe(false);
    if (!appearedExec.ok) expect(appearedExec.error.code).toBe("PLAN_STALE");
    expect(appeared.store.sessions[0]?.status).toBe("approved");
    expect(appeared.store.plans[0]?.status).toBe("approved");
    expect(appeared.store.rowResults).toEqual([]);

    const linkStale = await approvedPlanSession();
    const alice = linkStale.store.customers.find((row) => row.id === CUSTOMER_A);
    if (alice) alice.email = "moved@example.com";
    const linkExec = await linkStale.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: linkStale.sessionId,
    });
    expect(linkExec.ok).toBe(false);
    if (!linkExec.ok) expect(linkExec.error.code).toBe("PLAN_STALE");
    expect(linkStale.store.rowResults).toEqual([]);
  });

  it("authorizes Owner and Admin execution and denies Staff, Viewer, foreign, suspended, and unauthenticated actors", async () => {
    const owner = await approvedPlanSession();
    const payload = { organizationId: ORG_A, sessionId: owner.sessionId };
    const ownerExec = await owner.service.executeDataIntakeImportPlan(payload);
    expect(ownerExec.ok).toBe(true);

    const admin = await approvedPlanSession({ userId: ADMIN_USER });
    const adminExec = await admin.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: admin.sessionId,
    });
    expect(adminExec.ok).toBe(true);

    const staff = await createService({ userId: STAFF_USER }).service.executeDataIntakeImportPlan(payload);
    const viewer = await createService({ userId: VIEWER_USER }).service.executeDataIntakeImportPlan(payload);
    const foreign = await createService({ userId: FOREIGN_USER }).service.executeDataIntakeImportPlan(payload);
    const anon = await createService({ userId: null }).service.executeDataIntakeImportPlan(payload);
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
    }).service.executeDataIntakeImportPlan(payload);
    expect(suspended.ok).toBe(false);
    if (!suspended.ok) expect(suspended.error.code).toBe("ORG_NOT_FOUND");

    const foreignPlan = await createService({ userId: FOREIGN_USER }).service.executeDataIntakeImportPlan({
      organizationId: ORG_B,
      sessionId: owner.sessionId,
    });
    expect(foreignPlan.ok).toBe(false);
    if (!foreignPlan.ok) expect(foreignPlan.error.code).toBe("SESSION_NOT_FOUND");

    const rpc = createMemoryDataIntakeExecutionRpc({
      tables: owner.tables,
      store: owner.store,
      isServiceRole: false,
    });
    const withoutRole = await rpc.rpc(DATA_INTAKE_EXECUTION_RPC, {
      p_operation: "execute_import_plan",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: { session_id: owner.sessionId, source_id: owner.sourceId },
    });
    expect(withoutRole.data).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
  });

  it("rejects client-supplied Customer fields, row lists, and target authority", async () => {
    const ctx = await approvedPlanSession();
    const injected = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
      display_name: "Injected",
      email: "evil@example.com",
      target_record_id: CUSTOMER_A,
      rows: [],
    } as never);
    expect(injected.ok).toBe(false);
    if (!injected.ok) expect(injected.error.code).toBe("SOURCE_INVALID");
    expect(ctx.store.customers).toEqual(ctx.customersBefore);
    expect(ctx.store.rowResults).toEqual([]);
  });

  it("imports only allowlisted normalized fields and ignores extra or rejected values", async () => {
    const ctx = await approvedPlanSession({ bytes: BOB_ONLY_CSV, existing: [] });
    const staged = ctx.store.staging[0];
    if (!staged) throw new Error("missing staging");
    staged.normalized_values = {
      ...staged.normalized_values,
      phone: "555-0100",
      first_name: "Robert",
      last_name: "Example",
      status: "active",
      owner_member_id: OWNER_MEMBER,
      metadata: "secret",
      ignored: "no",
    };
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(ctx.store.customers[0]).toMatchObject({
      display_name: "Bob Example",
      email: "bob@example.com",
      phone: "555-0100",
      first_name: "Robert",
      last_name: "Example",
      status: "onboarding",
      owner_member_id: null,
      source: "import",
    });
    expect(ctx.store.customers[0]).not.toHaveProperty("metadata");
    expect(JSON.stringify(ctx.store.customers[0])).not.toContain("secret");
  });

  it("replays an executed plan without a second Customer write or duplicate row result", async () => {
    const ctx = await approvedPlanSession();
    const first = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const customersAfterFirst = structuredClone(ctx.store.customers);
    const second = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.replayed).toBe(true);
    expect(second.value.done).toBe(true);
    expect(ctx.store.customers).toEqual(customersAfterFirst);
    expect(ctx.store.rowResults).toHaveLength(2);
    expect(ctx.store.events.filter((event) => event.event_type === "import_started")).toHaveLength(1);
    expect(ctx.store.events.filter((event) => event.event_type === "import_completed")).toHaveLength(1);
  });

  it("serializes concurrent execution onto one claim and one created Customer", async () => {
    const ctx = await approvedPlanSession();
    const [left, right] = await Promise.all([
      ctx.service.executeDataIntakeImportPlan({
        organizationId: ORG_A,
        sessionId: ctx.sessionId,
      }),
      ctx.service.executeDataIntakeImportPlan({
        organizationId: ORG_A,
        sessionId: ctx.sessionId,
      }),
    ]);
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect([left.value.replayed, right.value.replayed].filter(Boolean)).toHaveLength(1);
    expect(ctx.store.customers.filter((row) => row.email === "bob@example.com")).toHaveLength(1);
    expect(ctx.store.rowResults).toHaveLength(2);
    expect(ctx.store.events.filter((event) => event.event_type === "import_started")).toHaveLength(1);
  });

  it("claims an approved plan, denies cancel while importing, and finalizes after the last batch", async () => {
    const ctx = await approvedPlanSession();
    ctx.store.executionBatchSize = 1;
    const first = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.done).toBe(true);
    expect(ctx.store.sessions[0]?.status).toBe("completed");
    expect(ctx.store.plans[0]?.status).toBe("executed");
    expect(ctx.store.events.some((event) => event.event_type === "import_batch_completed")).toBe(
      true,
    );

    const importing = await approvedPlanSession();
    importing.store.sessions[0]!.status = "importing";
    importing.store.plans[0]!.status = "executing";
    const cancelled = await importing.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: importing.sessionId,
    });
    expect(cancelled.ok).toBe(false);
    if (!cancelled.ok) expect(cancelled.error.code).toBe("INVALID_STATE");
    expect(importing.store.sessions[0]?.status).toBe("importing");
    expect(importing.store.customers).toEqual(importing.customersBefore);
  });

  it("rolls back a create when the row result cannot be written and retries exactly once", async () => {
    const ctx = await approvedPlanSession({ bytes: BOB_ONLY_CSV, existing: [] });
    ctx.store.executionFault = "after_create_before_result";
    const failed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(failed.ok).toBe(false);
    expect(ctx.store.customers).toEqual([]);
    expect(ctx.store.rowResults).toEqual([]);
    expect(ctx.store.sessions[0]?.status).toBe("approved");
    ctx.store.executionFault = null;
    const retried = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    expect(ctx.store.customers).toHaveLength(1);
    expect(ctx.store.rowResults).toHaveLength(1);
    expect(ctx.store.customers[0]?.email).toBe("bob@example.com");
  });

  it("rolls back a claim-only crash and retries the same approved plan", async () => {
    const ctx = await approvedPlanSession({ bytes: BOB_ONLY_CSV, existing: [] });
    ctx.store.executionFault = "after_claim";
    const failed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(failed.ok).toBe(false);
    expect(ctx.store.sessions[0]?.status).toBe("approved");
    expect(ctx.store.plans[0]?.status).toBe("approved");
    expect(ctx.store.customers).toEqual([]);
    ctx.store.executionFault = null;
    const retried = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    expect(ctx.store.customers).toHaveLength(1);
  });

  it("retries a failed session without recreating already imported rows", async () => {
    const ctx = await approvedPlanSession();
    const alice = ctx.store.staging.find((row) => row.normalized_values.email === "alice@example.com");
    if (!alice || !ctx.store.plans[0]) throw new Error("missing approved plan fixture");
    ctx.store.rowResults.push({
      id: crypto.randomUUID(),
      organization_id: ORG_A,
      session_id: ctx.sessionId,
      plan_id: ctx.store.plans[0].id,
      row_fingerprint: alice.row_fingerprint,
      source_row_number: alice.source_row_number,
      operation: "link",
      outcome: "imported",
      target_domain: "customer",
      target_record_id: CUSTOMER_A,
      error_code: null,
      created_at: new Date().toISOString(),
    });
    ctx.store.sessions[0]!.status = "failed";
    ctx.store.plans[0].status = "executing";
    ctx.store.sessions[0]!.last_completed_batch_index = 0;
    const retried = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(retried.ok).toBe(true);
    if (!retried.ok) return;
    expect(retried.value.status).toBe("completed");
    expect(ctx.store.customers.filter((row) => row.email === "bob@example.com")).toHaveLength(1);
    expect(ctx.store.rowResults).toHaveLength(2);
    expect(ctx.store.rowResults.filter((row) => row.operation === "link")).toHaveLength(1);
  });

  it("finalizes completed_with_errors when a row fails after claim and keeps successful creates", async () => {
    const ctx = await approvedPlanSession();
    const createFingerprint = ctx.store.plans[0]?.summary.operations;
    const operations = Array.isArray(createFingerprint) ? createFingerprint : [];
    const createOp = operations.find((row) => {
      return Boolean(row && typeof row === "object" && (row as { target_operation?: string }).target_operation === "create");
    }) as { row_fingerprint?: string } | undefined;
    ctx.store.failRowFingerprints = createOp?.row_fingerprint ? [createOp.row_fingerprint] : [];
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(executed.ok).toBe(true);
    if (!executed.ok) return;
    expect(executed.value.status).toBe("completed_with_errors");
    expect(executed.value.planStatus).toBe("executed");
    expect(executed.value.summary).toMatchObject({ failed: 1, linked: 1, created: 0 });
    expect(ctx.store.customers.filter((row) => row.email === "bob@example.com")).toHaveLength(0);
    expect(ctx.store.rowResults.some((row) => row.outcome === "failed")).toBe(true);
  });

  it("keeps planning and approval Customer-write-free and only executes through the execution RPC", async () => {
    const ctx = await approvedPlanSession();
    expect(ctx.store.customers).toEqual(ctx.customersBefore);
    expect(ctx.store.rowResults).toEqual([]);
    expect(ctx.store.links).toEqual([]);
    const executed = await ctx.service.executeDataIntakeImportPlan({
      organizationId: ORG_A,
      sessionId: ctx.sessionId,
    });
    expect(executed.ok).toBe(true);
    expect(ctx.store.customers.length).toBeGreaterThan(ctx.customersBefore.length);
    expect(ctx.store.rowResults.length).toBeGreaterThan(0);
  });
});
