import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerMutationResult } from "@/features/customers/domain/types";
import type { Database } from "@/types/database";
import * as customerActions from "@/features/customers/actions/customer-actions";
import * as customerMutations from "@/features/customers/server/customer-mutations";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CUSTOMER_MUTATION_REFRESH_HINTS } from "@/features/customers/domain/types";
import {
  archiveRestoreInput,
  createCustomerInput,
  sampleCustomerDetail,
  transitionStatusInput,
  updateProfileInput,
} from "../helpers/customer-mutation-mocks";
import { ORG_ID, CUSTOMER_ID } from "../helpers/customer-read-query-mocks";

const mockSupabase = { auth: { getUser: vi.fn() } } as unknown as SupabaseClient<Database>;

const successResult: CustomerMutationResult = {
  ok: true,
  operation: "create",
  customerId: CUSTOMER_ID,
  customer: sampleCustomerDetail,
  committed: true,
  refreshRequired: false,
  refreshHints: CUSTOMER_MUTATION_REFRESH_HINTS.create,
};

const committedRefreshFailure: CustomerMutationResult = {
  ok: false,
  operation: "update_profile",
  committed: true,
  customerId: CUSTOMER_ID,
  refreshHints: CUSTOMER_MUTATION_REFRESH_HINTS.update_profile,
  error: {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest customer.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/customers/server/customer-mutations", () => ({
  createCustomerMutation: vi.fn(),
  updateCustomerProfileMutation: vi.fn(),
  transitionCustomerStatusMutation: vi.fn(),
  archiveCustomerMutation: vi.fn(),
  restoreCustomerMutation: vi.fn(),
  resolveVerifiedCustomerRole: (role: string) =>
    role === "owner" || role === "admin" || role === "staff" || role === "viewer" ? role : null,
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);
const mutationMocks = {
  create: vi.mocked(customerMutations.createCustomerMutation),
  update: vi.mocked(customerMutations.updateCustomerProfileMutation),
  transition: vi.mocked(customerMutations.transitionCustomerStatusMutation),
  archive: vi.mocked(customerMutations.archiveCustomerMutation),
  restore: vi.mocked(customerMutations.restoreCustomerMutation),
};

beforeEach(() => {
  vi.clearAllMocks();
  serverClientMock.mockResolvedValue(mockSupabase);
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: "33333333-3333-4333-8333-333333333333",
      role: "staff",
      userId: "44444444-4444-4444-8444-444444444444",
    },
  });
  mutationMocks.create.mockResolvedValue(successResult);
  mutationMocks.update.mockResolvedValue(committedRefreshFailure);
  mutationMocks.transition.mockResolvedValue(successResult);
  mutationMocks.archive.mockResolvedValue(successResult);
  mutationMocks.restore.mockResolvedValue(successResult);
});

describe("customer server actions", () => {
  it("validates before invoking create service", async () => {
    const result = await customerActions.createCustomerAction({ organizationId: "bad" });
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
    expect(mutationMocks.create).not.toHaveBeenCalled();
  });

  it("creates ordinary server client and resolves organization", async () => {
    await customerActions.createCustomerAction(createCustomerInput);

    expect(serverClientMock).toHaveBeenCalledOnce();
    expect(resolveOrganizationContext).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
    });
    expect(mutationMocks.create).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      role: "staff",
      input: createCustomerInput,
    });
  });

  it("routes each action to one exact mutation service", async () => {
    await customerActions.updateCustomerProfileAction(updateProfileInput);
    await customerActions.transitionCustomerStatusAction(transitionStatusInput);
    await customerActions.archiveCustomerAction(archiveRestoreInput);
    await customerActions.restoreCustomerAction(archiveRestoreInput);

    expect(mutationMocks.update).toHaveBeenCalledOnce();
    expect(mutationMocks.transition).toHaveBeenCalledOnce();
    expect(mutationMocks.archive).toHaveBeenCalledOnce();
    expect(mutationMocks.restore).toHaveBeenCalledOnce();
  });

  it("stops before mutation when organization resolution fails", async () => {
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await customerActions.createCustomerAction(createCustomerInput);
    expect(result.ok).toBe(false);
    expect(mutationMocks.create).not.toHaveBeenCalled();
  });

  it("preserves committed refresh results from services", async () => {
    const result = await customerActions.updateCustomerProfileAction(updateProfileInput);
    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
      expect(result.customerId).toBe(CUSTOMER_ID);
    }
  });

  it("does not expose generic dispatcher exports", () => {
    expect(Object.keys(customerActions)).not.toContain("customerMutationAction");
    expect(Object.keys(customerActions)).not.toContain("dispatchCustomerMutation");
  });
});
