/**
 * Slice 6 — Member Administration integrated QA pack.
 * Composition / multi-org / gate / partial-read / fail-closed glue.
 * TEST-ONLY. No fake database framework.
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppShell } from "@/components/app-shell";
import {
  MEMBERS_NAV_LABEL,
  resolveMembersNavVisible,
} from "@/features/invitations/domain/members-navigation";
import { getInvitableOrganizationRoles } from "@/features/invitations/domain/permissions";
import { loadMemberAdministrationPage } from "@/features/invitations/server/load-member-administration-page";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { loadActiveOrganizationMembers } from "@/features/invitations/server/load-active-organization-members";
import { loadPendingOrganizationInvitations } from "@/features/invitations/server/load-pending-organization-invitations";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import { InviteMemberForm } from "@/features/invitations/ui/invite-member-form";
import { MemberAdministrationRolloutNotice } from "@/features/invitations/ui/member-administration-rollout-notice";
import {
  ORG_A,
  ORG_B,
  USER_ID,
  INVITE_ID,
  INVITE_ID_B,
  activeMember,
  pendingListItem,
  readyOrgContext,
} from "./helpers/member-admin-fixtures";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/invitations/actions/create-invitation-action", () => ({
  createInvitationAction: vi.fn(),
}));

vi.mock("@/features/invitations/actions/resend-invitation-action", () => ({
  resendInvitationAction: vi.fn(),
}));

vi.mock("@/features/invitations/actions/revoke-invitation-action", () => ({
  revokeInvitationAction: vi.fn(),
}));

const listMembershipsMock = vi.mocked(listActiveOrganizationMemberships);
const resolveOrgContextMock = vi.mocked(resolveOrganizationContext);
const loadMembersMock = vi.mocked(loadActiveOrganizationMembers);
const loadInvitationsMock = vi.mocked(loadPendingOrganizationInvitations);
const onboardingMock = vi.mocked(redirectIfOrganizationOnboardingIncomplete);

function createSupabase(orgRows: Array<{ id: string; name: string }>) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER_ID } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn(() => chain);
        chain.in = vi.fn(async () => ({ data: orgRows, error: null }));
        return chain;
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient<Database>;
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/**
 * Nearest composition boundary: page.tsx is an async RSC that cannot be
 * rendered cleanly without deep Next server mocking. Compose the same
 * published Member Admin surfaces the page wires after a successful load.
 */
function renderMemberAdminComposition(options: {
  actorRole: "owner" | "admin";
  invitationAcceptanceEnabled: boolean;
  invitations?: ReturnType<typeof pendingListItem>[];
  members?: ReturnType<typeof activeMember>[];
}) {
  const invitableRoles = getInvitableOrganizationRoles(
    options.actorRole,
    "active",
  );
  const invitations = options.invitations ?? [pendingListItem()];
  const members = options.members ?? [activeMember()];

  return renderToStaticMarkup(
    <div>
      <header>
        <h1>Members</h1>
        <p>Review active members and pending invitations for this organization.</p>
      </header>
      <MemberAdministrationRolloutNotice
        invitationAcceptanceEnabled={options.invitationAcceptanceEnabled}
      />
      <InviteMemberForm
        organizationId={ORG_A}
        invitableRoles={invitableRoles}
        invitationAcceptanceEnabled={options.invitationAcceptanceEnabled}
      />
      <ActiveMembersSection
        members={members}
        timeZone="UTC"
        loadFailed={false}
      />
      <PendingInvitationsSection
        invitations={invitations}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_A}
        actorRole={options.actorRole}
      />
    </div>,
  );
}

describe("MULTI-ORG AUTHORITY", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingMock.mockResolvedValue(undefined as never);
    loadMembersMock.mockResolvedValue({ ok: true, members: [] });
    loadInvitationsMock.mockResolvedValue({ ok: true, invitations: [] });
  });

  it("denies selected Viewer org even when actor is Owner elsewhere", async () => {
    const options = [
      { organizationId: ORG_A, role: "owner" as const },
      { organizationId: ORG_B, role: "viewer" as const },
    ];

    expect(
      resolveMembersNavVisible({
        organizationOptions: options,
        selectedOrganizationId: ORG_B,
      }),
    ).toBe(false);

    const navHtml = renderToStaticMarkup(
      <AppShell
        activeNav="tasks"
        organizationOptions={[
          { organizationId: ORG_A, role: "owner", displayName: "Org A" },
          { organizationId: ORG_B, role: "viewer", displayName: "Org B" },
        ]}
        selectedOrganizationId={ORG_B}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(navHtml).not.toContain(`>${MEMBERS_NAV_LABEL}<`);

    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "viewer" },
      ],
    });
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("viewer", ORG_B));

    const result = await loadMemberAdministrationPage(
      createSupabase([
        { id: ORG_A, name: "Org A" },
        { id: ORG_B, name: "Org B" },
      ]),
      { org: ORG_B },
    );

    expect(result).toMatchObject({ kind: "forbidden", role: "viewer" });
    expect(loadMembersMock).not.toHaveBeenCalled();
    expect(loadInvitationsMock).not.toHaveBeenCalled();
    expect(resolveOrgContextMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_B,
    });
  });

  it("allows selected Admin org and does not inherit Viewer from another org", async () => {
    const options = [
      { organizationId: ORG_A, role: "viewer" as const },
      { organizationId: ORG_B, role: "admin" as const },
    ];

    expect(
      resolveMembersNavVisible({
        organizationOptions: options,
        selectedOrganizationId: ORG_B,
      }),
    ).toBe(true);

    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "viewer" },
        { organizationId: ORG_B, role: "admin" },
      ],
    });
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("admin", ORG_B));

    const result = await loadMemberAdministrationPage(
      createSupabase([
        { id: ORG_A, name: "Org A" },
        { id: ORG_B, name: "Org B" },
      ]),
      { org: ORG_B },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.role).toBe("admin");
    expect(result.organizationId).toBe(ORG_B);
    expect(loadMembersMock).toHaveBeenCalledWith(expect.anything(), ORG_B);
    expect(loadInvitationsMock).toHaveBeenCalledWith(expect.anything(), ORG_B);
  });
});

describe("STAFF / VIEWER FAIL-CLOSED GLUE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingMock.mockResolvedValue(undefined as never);
    loadMembersMock.mockResolvedValue({ ok: true, members: [] });
    loadInvitationsMock.mockResolvedValue({ ok: true, invitations: [] });
  });

  it.each([
    ["staff", "staff"] as const,
    ["viewer", "viewer"] as const,
  ])(
    "%s: nav hidden + page loader denied before privileged reads",
    async (label, role) => {
      expect(
        resolveMembersNavVisible({
          organizationOptions: [{ organizationId: ORG_A, role }],
          selectedOrganizationId: ORG_A,
        }),
      ).toBe(false);

      listMembershipsMock.mockResolvedValue({
        ok: true,
        memberships: [{ organizationId: ORG_A, role }],
      });
      resolveOrgContextMock.mockResolvedValue(readyOrgContext(role));

      const result = await loadMemberAdministrationPage(
        createSupabase([{ id: ORG_A, name: "Acme" }]),
        { org: ORG_A },
      );

      expect(result).toMatchObject({ kind: "forbidden", role });
      expect(loadMembersMock).not.toHaveBeenCalled();
      expect(loadInvitationsMock).not.toHaveBeenCalled();
      expect(label).toBe(role);
    },
  );
});

describe("PARTIAL READS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingMock.mockResolvedValue(undefined as never);
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("owner"));
  });

  it("keeps pending invitations when members loader fails (inverse partial)", async () => {
    const invitation = pendingListItem();
    loadMembersMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "members failed" },
    });
    loadInvitationsMock.mockResolvedValue({
      ok: true,
      invitations: [invitation],
    });

    const result = await loadMemberAdministrationPage(
      createSupabase([{ id: ORG_A, name: "Acme" }]),
      { org: ORG_A },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.membersLoadFailed).toBe(true);
    expect(result.invitationsLoadFailed).toBe(false);
    expect(result.members).toEqual([]);
    expect(result.pendingInvitations).toEqual([invitation]);
    expect(result.membersErrorMessage).toBe("members failed");
  });

  it("keeps members when pending invitations loader fails", async () => {
    const member = activeMember();
    loadMembersMock.mockResolvedValue({ ok: true, members: [member] });
    loadInvitationsMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "invites failed" },
    });

    const result = await loadMemberAdministrationPage(
      createSupabase([{ id: ORG_A, name: "Acme" }]),
      { org: ORG_A },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.membersLoadFailed).toBe(false);
    expect(result.invitationsLoadFailed).toBe(true);
    expect(result.members).toEqual([member]);
    expect(result.pendingInvitations).toEqual([]);
  });

  it("collapses to query_error when both privileged loaders fail", async () => {
    loadMembersMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "members failed" },
    });
    loadInvitationsMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "invites failed" },
    });

    const result = await loadMemberAdministrationPage(
      createSupabase([{ id: ORG_A, name: "Acme" }]),
      { org: ORG_A },
    );

    expect(result.kind).toBe("query_error");
  });
});

describe("COMPOSED PAGE STATE", () => {
  it("renders Owner composition with invite form, sections, and one action owner", () => {
    const invite = pendingListItem({
      invitationId: INVITE_ID,
      emailNormalized: "invitee@example.com",
    });
    const html = renderMemberAdminComposition({
      actorRole: "owner",
      invitationAcceptanceEnabled: true,
      invitations: [invite],
    });

    expect(html).toContain("<h1>Members</h1>");
    expect(html).toContain("Invite member");
    expect(html).toContain("Create invitation");
    expect(html).toContain("Active members");
    expect(html).toContain("Pending invitations");
    expect(html).toContain('value="admin"');
    expect(html).toContain('value="staff"');
    expect(html).toContain('value="viewer"');
    expect(html).toContain("invitee@example.com");
    expect(html).toContain(`data-pending-action-owner="${INVITE_ID}"`);
    expect(countOccurrences(html, 'data-pending-action-owner="')).toBe(1);
    expect(html).toContain("<caption");
    expect(html).toContain("Pending organization invitations");
    expect(html).toContain('scope="col"');
    expect(html).toContain(">Actions</th>");
    expect(html).not.toContain("token_hash");
    expect(html).not.toContain("raw_token");
  });
});

describe("GATE COMPOSITION", () => {
  it("Gate OFF: notice + delivery limit visible while create/resend/revoke remain usable", () => {
    const html = renderMemberAdminComposition({
      actorRole: "owner",
      invitationAcceptanceEnabled: false,
      invitations: [pendingListItem()],
    });

    expect(html.toLowerCase()).toContain("acceptance is currently disabled");
    expect(html.toLowerCase()).toContain("email delivery");
    expect(html).toContain("Invite member");
    expect(html).toContain("Create invitation");
    expect(html).toContain("Resend");
    expect(html).toContain("Revoke");
    expect(html.toLowerCase()).not.toMatch(/email sent|recipient notified|can accept now/);
    expect(html).not.toContain('disabled=""');
  });

  it("Gate ON: acceptance-disabled warning absent and delivery still not claimed", () => {
    const html = renderMemberAdminComposition({
      actorRole: "owner",
      invitationAcceptanceEnabled: true,
      invitations: [pendingListItem()],
    });

    expect(html.toLowerCase()).not.toContain("acceptance is currently disabled");
    expect(html).toContain("Invite member");
    expect(html).toContain("Resend");
    expect(html).toContain("Revoke");
    expect(html.toLowerCase()).not.toMatch(/email sent|delivery enabled|recipient notified/);
  });
});

describe("REVOKE UI POST-REFRESH PROPS TRANSITION", () => {
  it("removes revoked invitation from pending props without inventing empty-success failure", () => {
    const inviteA = pendingListItem({
      invitationId: INVITE_ID,
      emailNormalized: "gone@example.com",
    });
    const inviteB = pendingListItem({
      invitationId: INVITE_ID_B,
      emailNormalized: "still@example.com",
      role: "viewer",
    });

    const before = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[inviteA, inviteB]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_A}
        actorRole="owner"
      />,
    );
    expect(before).toContain("gone@example.com");
    expect(before).toContain("still@example.com");
    expect(before).toContain(`data-pending-action-owner="${INVITE_ID}"`);

    const afterOne = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[inviteB]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_A}
        actorRole="owner"
      />,
    );
    expect(afterOne).not.toContain("gone@example.com");
    expect(afterOne).toContain("still@example.com");
    expect(afterOne).not.toContain(`data-pending-action-owner="${INVITE_ID}"`);
    expect(afterOne).not.toContain("No pending invitations");

    const afterLast = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_A}
        actorRole="owner"
      />,
    );
    expect(afterLast).toContain("No pending invitations");
    expect(afterLast).not.toContain("Resend");
    expect(afterLast).not.toContain("Revoke");
    expect(afterLast).not.toContain("token_hash");
  });
});
