import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadMutationResult } from "@/features/leads/domain/types";
import type { Database } from "@/types/database";
import * as leadActions from "@/features/leads/actions/lead-actions";
import * as leadMutations from "@/features/leads/server/lead-mutations";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LEAD_MUTATION_REFRESH_HINTS } from "@/features/leads/domain/types";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { buildUnresolvedProductModuleAccess } from "@/features/product-access/domain/module-access";
import {
  archiveRestoreInput,
  convertLeadInput,
  createLeadInput,
  sampleLeadDetail,
  transitionStageInput,
  transitionStatusInput,
  updateProfileInput,
} from "../helpers/lead-mutation-mocks";
import { CUSTOMER_ID, LEAD_ID, ORG_ID } from "../helpers/lead-read-query-mocks";

const mockSupabase = { auth: { getUser: vi.fn() } } as unknown as SupabaseClient<Database>;

const successResult: LeadMutationResult = {
  ok: true,
  operation: "create",
  leadId: LEAD_ID,
  lead: sampleLeadDetail,
  committed: true,
  refreshRequired: false,
  refreshHints: LEAD_MUTATION_REFRESH_HINTS.create,
};

const convertSuccess: LeadMutationResult = {
  ok: true,
  operation: "convert",
  leadId: LEAD_ID,
  lead: sampleLeadDetail,
  customerId: CUSTOMER_ID,
  committed: true,
  refreshRequired: false,
  refreshHints: LEAD_MUTATION_REFRESH_HINTS.convert,
};

const committedRefreshFailure: LeadMutationResult = {
  ok: false,
  operation: "update_profile",
  committed: true,
  leadId: LEAD_ID,
  refreshHints: LEAD_MUTATION_REFRESH_HINTS.update_profile,
  error: {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest lead.",
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

vi.mock("@/features/product-access/server/load-product-module-access", () => ({
  loadProductModuleAccess: vi.fn(),
}));

vi.mock("@/features/product-access/server/enforce-product-module-access", () => ({
  evaluateProductModuleRouteAccess: vi.fn(),
}));

vi.mock("@/features/leads/server/lead-mutations", () => ({
  createLeadMutation: vi.fn(),
  updateLeadProfileMutation: vi.fn(),
  transitionLeadStageMutation: vi.fn(),
  transitionLeadStatusMutation: vi.fn(),
  convertLeadToCustomerMutation: vi.fn(),
  archiveLeadMutation: vi.fn(),
  restoreLeadMutation: vi.fn(),
  resolveVerifiedLeadRole: (role: string) =>
    role === "owner" || role === "admin" || role === "staff" || role === "viewer" ? role : null,
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);
const loadModuleAccessMock = vi.mocked(loadProductModuleAccess);
const evaluateRouteAccessMock = vi.mocked(evaluateProductModuleRouteAccess);
const mutationMocks = {
  create: vi.mocked(leadMutations.createLeadMutation),
  update: vi.mocked(leadMutations.updateLeadProfileMutation),
  transitionStage: vi.mocked(leadMutations.transitionLeadStageMutation),
  transitionStatus: vi.mocked(leadMutations.transitionLeadStatusMutation),
  convert: vi.mocked(leadMutations.convertLeadToCustomerMutation),
  archive: vi.mocked(leadMutations.archiveLeadMutation),
  restore: vi.mocked(leadMutations.restoreLeadMutation),
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
  loadModuleAccessMock.mockResolvedValue(buildUnresolvedProductModuleAccess());
  evaluateRouteAccessMock.mockReturnValue({ allowed: true });
  mutationMocks.create.mockResolvedValue(successResult);
  mutationMocks.update.mockResolvedValue(committedRefreshFailure);
  mutationMocks.transitionStage.mockResolvedValue(successResult);
  mutationMocks.transitionStatus.mockResolvedValue(successResult);
  mutationMocks.convert.mockResolvedValue(convertSuccess);
  mutationMocks.archive.mockResolvedValue(successResult);
  mutationMocks.restore.mockResolvedValue(successResult);
});

describe("lead server actions", () => {
  it("validates before invoking create service", async () => {
    const result = await leadActions.createLeadAction({ organizationId: "bad" });
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
    expect(mutationMocks.create).not.toHaveBeenCalled();
  });

  it("serializes create success through the action boundary", async () => {
    const result = await leadActions.createLeadAction(createLeadInput);
    expect(result.ok).toBe(true);
    expect(mutationMocks.create).toHaveBeenCalledOnce();
  });

  it("preserves committed refresh failure without reversing mutation success", async () => {
    const result = await leadActions.updateLeadProfileAction(updateProfileInput);
    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
      expect(result.leadId).toBe(LEAD_ID);
    }
  });

  it("rejects converted status at the action boundary", async () => {
    const result = await leadActions.transitionLeadStatusAction({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      toStatus: "converted",
    });
    expect(result.ok).toBe(false);
    expect(mutationMocks.transitionStatus).not.toHaveBeenCalled();
  });

  it("delegates stage, convert, archive and restore actions", async () => {
    await leadActions.transitionLeadStageAction(transitionStageInput);
    await leadActions.transitionLeadStatusAction(transitionStatusInput);
    await leadActions.convertLeadToCustomerAction(convertLeadInput);
    await leadActions.archiveLeadAction(archiveRestoreInput);
    await leadActions.restoreLeadAction(archiveRestoreInput);

    expect(mutationMocks.transitionStage).toHaveBeenCalledOnce();
    expect(mutationMocks.transitionStatus).toHaveBeenCalledOnce();
    expect(mutationMocks.convert).toHaveBeenCalledOnce();
    expect(mutationMocks.archive).toHaveBeenCalledOnce();
    expect(mutationMocks.restore).toHaveBeenCalledOnce();
  });

  it("maps missing organization context without invoking mutation services", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await leadActions.createLeadAction(createLeadInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
    expect(mutationMocks.create).not.toHaveBeenCalled();
  });

  it("denies every lead mutation when the Leads module route is hidden", async () => {
    evaluateRouteAccessMock.mockReturnValue({
      allowed: false,
      message: "This area is not available for your organization.",
    });

    const results = await Promise.all([
      leadActions.createLeadAction(createLeadInput),
      leadActions.updateLeadProfileAction(updateProfileInput),
      leadActions.transitionLeadStageAction(transitionStageInput),
      leadActions.transitionLeadStatusAction(transitionStatusInput),
      leadActions.convertLeadToCustomerAction(convertLeadInput),
      leadActions.archiveLeadAction(archiveRestoreInput),
      leadActions.restoreLeadAction(archiveRestoreInput),
    ]);

    expect(results).toHaveLength(7);
    for (const result of results) {
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
    }
    expect(evaluateRouteAccessMock).toHaveBeenCalledTimes(7);
    expect(evaluateRouteAccessMock).toHaveBeenCalledWith({
      moduleId: "leads",
      access: expect.any(Object),
    });
    for (const mutation of Object.values(mutationMocks)) {
      expect(mutation).not.toHaveBeenCalled();
    }
  });
});
