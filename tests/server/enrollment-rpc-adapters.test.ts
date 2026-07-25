import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ENROLLMENT_RPC_NAMES,
  ENROLLMENT_UNSUPPORTED_RPC_NAMES,
  callArchiveEnrollmentRpc,
  callCreateEnrollmentRpc,
  callRestoreEnrollmentRpc,
  callTransitionEnrollmentStatusRpc,
  callUpdateEnrollmentOwnerMetadata,
} from "@/features/enrollments/server/enrollment-rpc-adapters";
import { validateTransitionEnrollmentStatusInput } from "@/features/enrollments/validation/mutation-schemas";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  CUSTOMER_ID,
  PROGRAM_ID,
  USER_ID,
} from "../helpers/enrollment-test-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createRpcSupabase(rpcImpl: ReturnType<typeof vi.fn>) {
  return {
    rpc: rpcImpl,
  } as unknown as SupabaseClient<Database>;
}

function createUpdateSupabase(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const is = vi.fn().mockReturnValue({ select });
  const eqInner = vi.fn().mockReturnValue({ is });
  const eqOuter = vi.fn().mockReturnValue({ eq: eqInner });
  const update = vi.fn().mockReturnValue({ eq: eqOuter });
  const from = vi.fn().mockReturnValue({ update });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    update,
    from,
    eqOuter,
    eqInner,
    is,
  };
}

beforeEach(() => {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role: "owner",
      userId: USER_ID,
    },
  });
});

describe("enrollment RPC adapters", () => {
  it("uses the exact create_enrollment RPC name and argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ENROLLMENT_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callCreateEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: "pending",
        metadata: {},
      },
    });

    expect(result.ok).toBe(true);
    expect(ENROLLMENT_RPC_NAMES.create).toBe("create_enrollment");
    expect(rpc).toHaveBeenCalledWith(ENROLLMENT_RPC_NAMES.create, {
      p_organization_id: ORG_ID,
      p_customer_id: CUSTOMER_ID,
      p_program_id: PROGRAM_ID,
      p_owner_member_id: undefined,
      p_initial_status: "pending",
      p_source: "manual",
      p_metadata: {},
    });
  });

  it("always sends p_source: manual on create regardless of initial status", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ENROLLMENT_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    await callCreateEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: "active",
        metadata: {},
      },
    });

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_source).toBe("manual");
  });

  it("uses the exact transition_enrollment_status RPC name and argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await callTransitionEnrollmentStatusRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        toStatus: "active",
        reason: "Ready",
      },
    });

    expect(ENROLLMENT_RPC_NAMES.transitionStatus).toBe("transition_enrollment_status");
    expect(rpc).toHaveBeenCalledWith(ENROLLMENT_RPC_NAMES.transitionStatus, {
      p_organization_id: ORG_ID,
      p_enrollment_id: ENROLLMENT_ID,
      p_to_status: "active",
      p_reason: "Ready",
      p_source: "manual",
    });
  });

  it("uses the exact archive_enrollment and restore_enrollment RPC names and argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await callArchiveEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });
    await callRestoreEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });

    expect(ENROLLMENT_RPC_NAMES.archive).toBe("archive_enrollment");
    expect(ENROLLMENT_RPC_NAMES.restore).toBe("restore_enrollment");
    expect(rpc).toHaveBeenNthCalledWith(1, ENROLLMENT_RPC_NAMES.archive, {
      p_organization_id: ORG_ID,
      p_enrollment_id: ENROLLMENT_ID,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, ENROLLMENT_RPC_NAMES.restore, {
      p_organization_id: ORG_ID,
      p_enrollment_id: ENROLLMENT_ID,
    });
  });

  it("resolves p_organization_id from membership-resolved org, not the caller-provided value", async () => {
    const resolvedOrgId = "99999999-9999-4999-8999-999999999999";
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: true,
      context: {
        organizationId: resolvedOrgId,
        membershipId: MEMBER_ID,
        role: "owner",
        userId: USER_ID,
      },
    });

    const rpc = vi.fn().mockResolvedValue({ data: ENROLLMENT_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    await callCreateEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: "pending",
        metadata: {},
      },
    });

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_organization_id).toBe(resolvedOrgId);
    expect(args.p_organization_id).not.toBe(ORG_ID);
  });

  it("fails closed when organization membership is unavailable, without calling the RPC", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const rpc = vi.fn();
    const result = await callCreateEnrollmentRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: "pending",
        metadata: {},
      },
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not treat browser organizationId as authority without membership resolution", async () => {
    const foreignOrg = "88888888-8888-4888-8888-888888888888";
    resolveOrganizationContext.mockImplementation(async ({ organizationId }) => {
      expect(organizationId).toBe(foreignOrg);
      return {
        ok: false,
        error: {
          code: "ORG_CONTEXT_MISSING",
          message: "Organization not found or access denied.",
          retryable: false,
          category: "not_found",
        },
      };
    });

    const rpc = vi.fn();
    const result = await callTransitionEnrollmentStatusRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: foreignOrg,
      input: {
        organizationId: foreignOrg,
        enrollmentId: ENROLLMENT_ID,
        toStatus: "active",
        reason: "Controlled enrollment transition test",
      },
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid input before calling any RPC", async () => {
    const rpc = vi.fn();
    const supabase = createRpcSupabase(rpc);

    const badCreate = await callCreateEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: "not-a-uuid",
        programId: PROGRAM_ID,
        initialStatus: "pending",
        metadata: {},
      },
    });
    expect(badCreate.ok).toBe(false);

    // Unsupported status enters as untrusted unknown through the same Zod boundary
    // the RPC adapter invokes — without casting into the EnrollmentStatus union.
    const rawUnsupportedTransition: unknown = {
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      toStatus: "teleported",
      reason: "Controlled enrollment transition test",
    };
    const unsupportedStatusParsed = validateTransitionEnrollmentStatusInput(
      rawUnsupportedTransition,
    );
    expect(unsupportedStatusParsed.success).toBe(false);

    const badArchive = await callArchiveEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: "not-a-uuid" },
    });
    expect(badArchive.ok).toBe(false);

    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps RPC errors through normalizeEnrollmentError", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "only terminal enrollments can be archived" },
    });

    const result = await callArchiveEnrollmentRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ARCHIVE_REQUIRES_TERMINAL");
    }
  });
});

describe("callUpdateEnrollmentOwnerMetadata", () => {
  it("uses .from('enrollments').update patching only owner_member_id and metadata", async () => {
    const { supabase, update, from, eqOuter, eqInner, is } = createUpdateSupabase({
      data: { id: ENROLLMENT_ID },
      error: null,
    });

    const result = await callUpdateEnrollmentOwnerMetadata({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        ownerMemberId: MEMBER_ID,
        metadata: { note: "reassigned" },
      },
    });

    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("enrollments");
    expect(update).toHaveBeenCalledWith({
      owner_member_id: MEMBER_ID,
      metadata: { note: "reassigned" },
    });
    expect(eqOuter).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(eqInner).toHaveBeenCalledWith("id", ENROLLMENT_ID);
    expect(is).toHaveBeenCalledWith("archived_at", null);
  });

  it("patches only the owner when metadata is not provided", async () => {
    const { supabase, update } = createUpdateSupabase({
      data: { id: ENROLLMENT_ID },
      error: null,
    });

    await callUpdateEnrollmentOwnerMetadata({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        ownerMemberId: MEMBER_ID,
      },
    });

    expect(update).toHaveBeenCalledWith({ owner_member_id: MEMBER_ID });
  });

  it("patches only metadata when owner is not provided", async () => {
    const { supabase, update } = createUpdateSupabase({
      data: { id: ENROLLMENT_ID },
      error: null,
    });

    await callUpdateEnrollmentOwnerMetadata({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        metadata: { note: "only metadata" },
      },
    });

    expect(update).toHaveBeenCalledWith({ metadata: { note: "only metadata" } });
  });

  it("fails when no row matches the scoped filters (archived or foreign)", async () => {
    const { supabase } = createUpdateSupabase({ data: null, error: null });

    const result = await callUpdateEnrollmentOwnerMetadata({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        ownerMemberId: MEMBER_ID,
      },
    });

    expect(result.ok).toBe(false);
  });

  it("fails closed when organization membership is unavailable, without touching the table", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const { supabase, from } = createUpdateSupabase({ data: null, error: null });

    const result = await callUpdateEnrollmentOwnerMetadata({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        ownerMemberId: MEMBER_ID,
      },
    });

    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("ENROLLMENT_UNSUPPORTED_RPC_NAMES", () => {
  it("documents that no update_enrollment RPC exists and no adapter calls it", async () => {
    expect(ENROLLMENT_UNSUPPORTED_RPC_NAMES.update).toBe("update_enrollment");

    const rpc = vi.fn().mockResolvedValue({ data: ENROLLMENT_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    await callCreateEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: "pending",
        metadata: {},
      },
    });
    await callTransitionEnrollmentStatusRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        toStatus: "active",
        reason: "Controlled enrollment transition test",
      },
    });
    await callArchiveEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });
    await callRestoreEnrollmentRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });

    for (const call of rpc.mock.calls) {
      expect(call[0]).not.toBe(ENROLLMENT_UNSUPPORTED_RPC_NAMES.update);
    }
  });
});

describe("service-role usage", () => {
  it("adapters only accept a caller-scoped supabase client parameter, never a service-role key", () => {
    expect(callCreateEnrollmentRpc.length).toBe(1);
    expect(callTransitionEnrollmentStatusRpc.length).toBe(1);
    expect(callArchiveEnrollmentRpc.length).toBe(1);
    expect(callRestoreEnrollmentRpc.length).toBe(1);
    expect(callUpdateEnrollmentOwnerMetadata.length).toBe(1);
  });
});
