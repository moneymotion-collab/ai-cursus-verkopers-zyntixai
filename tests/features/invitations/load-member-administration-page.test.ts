import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadMemberAdministrationPage } from "@/features/invitations/server/load-member-administration-page";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { loadActiveOrganizationMembers } from "@/features/invitations/server/load-active-organization-members";
import { loadPendingOrganizationInvitations } from "@/features/invitations/server/load-pending-organization-invitations";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { mockKnowledgeProductModuleAccess } from "../product-access/module-access-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: vi.fn(),
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/invitations/server/load-active-organization-members", () => ({
  loadActiveOrganizationMembers: vi.fn(),
}));

vi.mock(
  "@/features/invitations/server/load-pending-organization-invitations",
  () => ({
    loadPendingOrganizationInvitations: vi.fn(),
  }),
);

vi.mock("@/features/onboarding/server/enforce-product-onboarding", () => ({
  redirectIfOrganizationOnboardingIncomplete: vi.fn(),
}));

const listMembershipsMock = vi.mocked(listActiveOrganizationMemberships);
const resolveOrgContextMock = vi.mocked(resolveOrganizationContext);
const loadMembersMock = vi.mocked(loadActiveOrganizationMembers);
const loadInvitationsMock = vi.mocked(loadPendingOrganizationInvitations);
const onboardingMock = vi.mocked(redirectIfOrganizationOnboardingIncomplete);
const loadModuleAccessMock = vi.mocked(loadProductModuleAccess);

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";

function createSupabase(options?: { user?: { id: string } | null }) {
  const user = options?.user === undefined ? { id: USER_ID } : options.user;
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.in = vi.fn(async () => ({
          data: [{ id: ORG_ID, name: "Acme" }],
          error: null,
        }));
        return chain;
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient<Database>;
}

function readyContext(role: "owner" | "admin" | "staff" | "viewer") {
  return {
    ok: true as const,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBERSHIP_ID,
      role,
      userId: USER_ID,
    },
  };
}

describe("loadMemberAdministrationPage authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingMock.mockResolvedValue(undefined as never);
    loadMembersMock.mockResolvedValue({ ok: true, members: [] });
    loadInvitationsMock.mockResolvedValue({ ok: true, invitations: [] });
    loadModuleAccessMock.mockResolvedValue(mockKnowledgeProductModuleAccess());
  });

  it("allows active Owner and loads members + pending invitations", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "owner" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.role).toBe("owner");
    expect(result.organizationId).toBe(ORG_ID);
    expect(loadMembersMock).toHaveBeenCalledWith(expect.anything(), ORG_ID);
    expect(loadInvitationsMock).toHaveBeenCalledWith(expect.anything(), ORG_ID);
  });

  it("allows active Admin", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "admin" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.role).toBe("admin");
  });

  it("denies Staff before privileged loaders run", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "staff" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("staff"));

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result).toMatchObject({
      kind: "forbidden",
      role: "staff",
    });
    expect(loadMembersMock).not.toHaveBeenCalled();
    expect(loadInvitationsMock).not.toHaveBeenCalled();
  });

  it("denies Viewer before privileged invitation emails can load", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "viewer" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("viewer"));

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("forbidden");
    expect(loadInvitationsMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "hidden",
      access: {
        ...mockKnowledgeProductModuleAccess(),
        navVisibility: {
          ...mockKnowledgeProductModuleAccess().navVisibility,
          members: false,
        },
      },
    },
    {
      label: "unresolved",
      access: {
        ...mockKnowledgeProductModuleAccess(),
        resolution: "unresolved" as const,
        relevantCapabilities: null,
        navVisibility: {
          ...mockKnowledgeProductModuleAccess().navVisibility,
          members: false,
        },
      },
    },
  ])("denies direct route when members capability is $label before privileged reads", async ({ access }) => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "owner" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadModuleAccessMock.mockResolvedValue(access);

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result).toMatchObject({ kind: "forbidden", role: "owner" });
    expect(loadModuleAccessMock).toHaveBeenCalledWith(ORG_ID);
    expect(loadMembersMock).not.toHaveBeenCalled();
    expect(loadInvitationsMock).not.toHaveBeenCalled();
  });

  it("fail-closes when auth is missing", async () => {
    const result = await loadMemberAdministrationPage(
      createSupabase({ user: null }),
      {},
    );
    expect(result).toEqual({ kind: "auth_required" });
    expect(listMembershipsMock).not.toHaveBeenCalled();
  });

  it("fail-closes when no active organization memberships exist", async () => {
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });

    const result = await loadMemberAdministrationPage(createSupabase(), {});
    expect(result).toEqual({ kind: "no_organizations" });
  });

  it("does not trust a foreign org id outside active memberships", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "owner" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: OTHER_ORG,
    });

    // Single-org membership: invalid foreign org is ignored; selection stays on the only org.
    expect(resolveOrgContextMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
    });
    expect(result.kind).toBe("success");
  });

  it("requires explicit org selection for multi-org without trusting client alone", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_ID, role: "owner" },
        { organizationId: OTHER_ORG, role: "admin" },
      ],
    });

    const missing = await loadMemberAdministrationPage(createSupabase(), {});
    expect(missing.kind).toBe("organization_required");
    expect(resolveOrgContextMock).not.toHaveBeenCalled();

    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    const selected = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });
    expect(selected.kind).toBe("success");
    expect(resolveOrgContextMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
    });
  });

  it("distinguishes load failure from empty success data", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "owner" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadMembersMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "members failed" },
    });
    loadInvitationsMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "invites failed" },
    });

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("query_error");
    if (result.kind !== "query_error") return;
    expect(result.retryable).toBe(true);
  });

  it("surfaces partial section failures without inventing a full empty success", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_ID, role: "admin" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadMembersMock.mockResolvedValue({ ok: true, members: [] });
    loadInvitationsMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "invites failed" },
    });

    const result = await loadMemberAdministrationPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.invitationsLoadFailed).toBe(true);
    expect(result.membersLoadFailed).toBe(false);
    expect(result.invitationsErrorMessage).toBe("invites failed");
  });
});
