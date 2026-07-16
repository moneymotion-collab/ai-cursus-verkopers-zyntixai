import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  callArchiveLeadRpc,
  callConvertLeadToCustomerRpc,
  callCreateLeadRpc,
  callRestoreLeadRpc,
  callTransitionLeadStageRpc,
  callTransitionLeadStatusRpc,
  LEAD_RPC_NAMES,
} from "@/features/leads/server/lead-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  archiveRestoreInput,
  convertLeadInput,
  createLeadInput,
  NEW_LEAD_ID,
  transitionStageInput,
  transitionStatusInput,
} from "../helpers/lead-mutation-mocks";
import { CUSTOMER_ID, LEAD_ID, MEMBER_ID, ORG_ID, USER_ID } from "../helpers/lead-read-query-mocks";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createRpcSupabase(options: {
  data?: unknown;
  error?: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: options.data ?? null,
    error: options.error ?? null,
  });

  return {
    client: { rpc } as unknown as SupabaseClient<Database>,
    rpc,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role: "staff",
      userId: USER_ID,
    },
  });
});

describe("lead RPC adapters", () => {
  it("maps create_lead arguments and returned lead id", async () => {
    const { client, rpc } = createRpcSupabase({ data: NEW_LEAD_ID });

    const result = await callCreateLeadRpc({
      supabase: client,
      organizationId: ORG_ID,
      input: createLeadInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.leadId).toBe(NEW_LEAD_ID);
    }
    expect(rpc).toHaveBeenCalledWith(LEAD_RPC_NAMES.create, {
      p_organization_id: ORG_ID,
      p_display_name: "Prospect Co",
      p_first_name: "Pat",
      p_last_name: "Prospect",
      p_email: "ops@prospect.test",
      p_phone: "+1",
      p_owner_member_id: undefined,
      p_source_type: "manual",
      p_source_detail: "Inbound",
      p_pursuit_label: "Q3 deal",
      p_metadata: {},
    });
  });

  it("maps void stage and status transitions to lead ids", async () => {
    const stage = createRpcSupabase({ data: null });
    const status = createRpcSupabase({ data: null });

    const stageResult = await callTransitionLeadStageRpc({
      supabase: stage.client,
      organizationId: ORG_ID,
      input: transitionStageInput,
    });
    const statusResult = await callTransitionLeadStatusRpc({
      supabase: status.client,
      organizationId: ORG_ID,
      input: transitionStatusInput,
    });

    expect(stageResult.ok).toBe(true);
    expect(statusResult.ok).toBe(true);
    if (stageResult.ok && statusResult.ok) {
      expect(stageResult.leadId).toBe(LEAD_ID);
      expect(statusResult.leadId).toBe(LEAD_ID);
    }
    expect(stage.rpc).toHaveBeenCalledWith(
      LEAD_RPC_NAMES.transitionStage,
      expect.objectContaining({
        p_lead_id: LEAD_ID,
        p_to_stage_id: transitionStageInput.toStageId,
      }),
    );
    expect(status.rpc).toHaveBeenCalledWith(
      LEAD_RPC_NAMES.transitionStatus,
      expect.objectContaining({
        p_to_status: "lost",
      }),
    );
  });

  it("maps convert_lead_to_customer customer id return", async () => {
    const { client, rpc } = createRpcSupabase({ data: CUSTOMER_ID });

    const result = await callConvertLeadToCustomerRpc({
      supabase: client,
      organizationId: ORG_ID,
      input: convertLeadInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.leadId).toBe(LEAD_ID);
      expect(result.customerId).toBe(CUSTOMER_ID);
    }
    expect(rpc).toHaveBeenCalledWith(
      LEAD_RPC_NAMES.convert,
      expect.objectContaining({
        p_lead_id: LEAD_ID,
        p_existing_customer_id: undefined,
      }),
    );
  });

  it("maps archive and restore void RPCs", async () => {
    const archive = createRpcSupabase({ data: null });
    const restore = createRpcSupabase({ data: null });

    const archiveResult = await callArchiveLeadRpc({
      supabase: archive.client,
      organizationId: ORG_ID,
      input: archiveRestoreInput,
    });
    const restoreResult = await callRestoreLeadRpc({
      supabase: restore.client,
      organizationId: ORG_ID,
      input: archiveRestoreInput,
    });

    expect(archiveResult.ok).toBe(true);
    expect(restoreResult.ok).toBe(true);
    expect(archive.rpc).toHaveBeenCalledWith(LEAD_RPC_NAMES.archive, {
      p_organization_id: ORG_ID,
      p_lead_id: LEAD_ID,
    });
    expect(restore.rpc).toHaveBeenCalledWith(LEAD_RPC_NAMES.restore, {
      p_organization_id: ORG_ID,
      p_lead_id: LEAD_ID,
    });
  });

  it("normalizes RPC failures and empty create returns", async () => {
    const failed = createRpcSupabase({
      error: { message: "insufficient role to create leads" },
    });
    const empty = createRpcSupabase({ data: null });

    const failedResult = await callCreateLeadRpc({
      supabase: failed.client,
      organizationId: ORG_ID,
      input: createLeadInput,
    });
    const emptyResult = await callCreateLeadRpc({
      supabase: empty.client,
      organizationId: ORG_ID,
      input: createLeadInput,
    });

    expect(failedResult.ok).toBe(false);
    expect(emptyResult.ok).toBe(false);
    if (!failedResult.ok) {
      expect(failedResult.error.code).toBe("INSUFFICIENT_ROLE");
    }
  });

  it("rejects invalid adapter input before RPC", async () => {
    const { client, rpc } = createRpcSupabase({ data: NEW_LEAD_ID });

    const result = await callCreateLeadRpc({
      supabase: client,
      organizationId: ORG_ID,
      input: { organizationId: "bad", displayName: "x" } as never,
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
