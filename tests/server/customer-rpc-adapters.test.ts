import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  CUSTOMER_RPC_NAMES,
  callArchiveCustomerRpc,
  callCreateCustomerRpc,
  callRestoreCustomerRpc,
  callTransitionCustomerStatusRpc,
} from "@/features/customers/server/customer-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
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
      role: "staff",
      userId: "44444444-4444-4444-8444-444444444444",
    },
  });
});

describe("customer RPC adapters", () => {
  it("uses exact create_customer RPC and argument names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: CUSTOMER_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callCreateCustomerRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        displayName: "Acme",
        firstName: null,
        lastName: null,
        email: "ops@acme.test",
        phone: null,
        ownerMemberId: MEMBER_ID,
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(CUSTOMER_RPC_NAMES.create, {
      p_organization_id: ORG_ID,
      p_display_name: "Acme",
      p_first_name: undefined,
      p_last_name: undefined,
      p_email: "ops@acme.test",
      p_phone: undefined,
      p_owner_member_id: MEMBER_ID,
    });
  });

  it("uses exact transition_customer_status RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callTransitionCustomerStatusRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        toStatus: "paused",
        reason: "Waiting",
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(CUSTOMER_RPC_NAMES.transitionStatus, {
      p_organization_id: ORG_ID,
      p_customer_id: CUSTOMER_ID,
      p_to_status: "paused",
      p_reason: "Waiting",
    });
  });

  it("uses exact archive and restore RPC names", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await callArchiveCustomerRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, customerId: CUSTOMER_ID },
    });
    await callRestoreCustomerRpc({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, customerId: CUSTOMER_ID },
    });

    expect(rpc).toHaveBeenNthCalledWith(1, CUSTOMER_RPC_NAMES.archive, {
      p_organization_id: ORG_ID,
      p_customer_id: CUSTOMER_ID,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, CUSTOMER_RPC_NAMES.restore, {
      p_organization_id: ORG_ID,
      p_customer_id: CUSTOMER_ID,
    });
  });

  it("normalizes RPC failures safely", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "customer email already exists in organization" } });
    const supabase = createRpcSupabase(rpc);

    const result = await callCreateCustomerRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        displayName: "Acme",
        firstName: null,
        lastName: null,
        email: "ops@acme.test",
        phone: null,
        ownerMemberId: null,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DUPLICATE_CUSTOMER");
      expect(result.error.message).not.toContain("customer email");
    }
  });

  it("does not use dynamic RPC dispatch", async () => {
    const source = await import("@/features/customers/server/customer-rpc-adapters");
    expect(source.CUSTOMER_RPC_NAMES.create).toBe("create_customer");
    expect(Object.keys(source)).not.toContain("callCustomerRpc");
  });
});
