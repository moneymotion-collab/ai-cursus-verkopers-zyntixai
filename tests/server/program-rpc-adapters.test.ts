import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  PROGRAM_RPC_NAMES,
  callArchiveProgramRpc,
  callCreateProgramRpc,
  callRestoreProgramRpc,
  callTransitionProgramStatusRpc,
  callUpdateProgramRpc,
} from "@/features/programs/server/program-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createRpcSupabase(rpcImpl: ReturnType<typeof vi.fn>) {
  return {
    rpc: rpcImpl,
  } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role: "owner",
      userId: "44444444-4444-4444-8444-444444444444",
    },
  });
});

describe("program RPC adapters", () => {
  it("uses exact create_program RPC and argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: PROGRAM_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callCreateProgramRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        name: "Growth Lab",
        deliveryMode: "cohort",
        description: "Intro",
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(PROGRAM_RPC_NAMES.create, {
      p_organization_id: ORG_ID,
      p_name: "Growth Lab",
      p_delivery_mode: "cohort",
      p_description: "Intro",
      p_metadata: {},
    });
  });

  it("uses exact update_program RPC argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callUpdateProgramRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
        name: "Growth Lab",
        deliveryMode: "hybrid",
        description: null,
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(PROGRAM_RPC_NAMES.update, {
      p_organization_id: ORG_ID,
      p_program_id: PROGRAM_ID,
      p_name: "Growth Lab",
      p_description: "",
      p_delivery_mode: "hybrid",
      p_metadata: {},
    });
  });

  it("passes manual source on transition_program_status", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await callTransitionProgramStatusRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
        toStatus: "active",
        reason: "Ready",
      },
    });

    expect(rpc).toHaveBeenCalledWith(PROGRAM_RPC_NAMES.transitionStatus, {
      p_organization_id: ORG_ID,
      p_program_id: PROGRAM_ID,
      p_to_status: "active",
      p_reason: "Ready",
      p_source: "manual",
    });
  });

  it("uses archive and restore RPC names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await callArchiveProgramRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, programId: PROGRAM_ID },
    });
    await callRestoreProgramRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, programId: PROGRAM_ID },
    });

    expect(rpc).toHaveBeenNthCalledWith(1, PROGRAM_RPC_NAMES.archive, {
      p_organization_id: ORG_ID,
      p_program_id: PROGRAM_ID,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, PROGRAM_RPC_NAMES.restore, {
      p_organization_id: ORG_ID,
      p_program_id: PROGRAM_ID,
    });
  });

  it("fails closed when organization membership is unavailable", async () => {
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
    const result = await callCreateProgramRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        name: "X",
        deliveryMode: "cohort",
        description: null,
      },
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps archive-blocked RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "cannot archive program with open enrollments" },
    });

    const result = await callArchiveProgramRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, programId: PROGRAM_ID },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ARCHIVE_BLOCKED_OPEN_ENROLLMENTS");
    }
  });

  it("does not treat browser organizationId as authority without membership resolution", async () => {
    const foreignOrg = "99999999-9999-4999-8999-999999999999";
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
    const result = await callCreateProgramRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: foreignOrg,
      input: {
        organizationId: foreignOrg,
        name: "X",
        deliveryMode: "cohort",
        description: null,
      },
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
