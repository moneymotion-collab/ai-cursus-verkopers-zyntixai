import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadAttentionShellPage } from "@/features/attention/ui/load-attention-shell-page";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { ORG_ID } from "../helpers/attention-test-fixtures";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

vi.mock("@/features/attention/server/resolve-attention-page-organization", () => ({
  resolveAttentionPageOrganization: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveAttentionPageOrganization);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "owner") {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Acme",
    organizationOptions: [
      { organizationId: ORG_ID, displayName: "Acme", role },
    ],
    role,
    timezone: "UTC",
    isMultiOrganization: false,
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

describe("attention shell page loader (B1.7.5-A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps auth_required", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadAttentionShellPage(createSupabase(), {});
    expect(result.kind).toBe("auth_required");
  });

  it("maps organization_unavailable to no_organizations", async () => {
    pageOrgMock.mockResolvedValue({ kind: "organization_unavailable" });
    const result = await loadAttentionShellPage(createSupabase(), {});
    expect(result.kind).toBe("no_organizations");
  });

  it("maps organization_required", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: [
        { organizationId: ORG_ID, displayName: "Acme", role: "owner" },
      ],
    });
    const result = await loadAttentionShellPage(createSupabase(), {});
    expect(result.kind).toBe("organization_required");
    if (result.kind !== "organization_required") return;
    expect(result.organizations).toHaveLength(1);
  });

  it("maps org_context_missing without inventing success data", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "org_context_missing",
      message: "Organization membership is unavailable for Attention.",
    });
    const result = await loadAttentionShellPage(createSupabase(), {
      org: ORG_ID,
    });
    expect(result).toEqual({
      kind: "org_context_missing",
      message: "Organization membership is unavailable for Attention.",
    });
  });

  it("maps query_error as retryable", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
    });
    const result = await loadAttentionShellPage(createSupabase(), {});
    expect(result).toEqual({
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
      retryable: true,
    });
  });

  it("returns success with role capabilities and resolved module access", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    const result = await loadAttentionShellPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;

    expect(result.selectedOrganizationId).toBe(ORG_ID);
    expect(result.role).toBe("viewer");
    expect(result.capabilities.canListItems).toBe(true);
    expect(result.capabilities.canViewArchivedItems).toBe(false);
    expect(result.capabilities.canAcknowledge).toBe(false);
    expect(result.timeZone).toBe("UTC");
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(result.moduleAccess.resolution).toBe("resolved");
    if (result.moduleAccess.resolution === "resolved") {
      expect(result.moduleAccess.navVisibility.attention).toBe(true);
    }

    expect(pageOrgMock).toHaveBeenCalledWith(expect.anything(), ORG_ID);
  });

  it("grants archived visibility only for owner/admin capabilities", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("admin"));
    const result = await loadAttentionShellPage(createSupabase(), {
      org: ORG_ID,
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.capabilities.canViewArchivedItems).toBe(true);
  });
});
