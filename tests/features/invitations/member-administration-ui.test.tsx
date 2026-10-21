import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/invitations/actions/resend-invitation-action", () => ({
  resendInvitationAction: vi.fn(),
}));

vi.mock("@/features/invitations/actions/revoke-invitation-action", () => ({
  revokeInvitationAction: vi.fn(),
}));

import { PendingInvitationActions } from "@/features/invitations/ui/pending-invitation-actions";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const MEMBER: MemberAdminMember = {
  membershipId: "33333333-3333-4333-8333-333333333333",
  displayName: "Alex Owner",
  role: "owner",
  status: "active",
  joinedAt: "2026-01-01T00:00:00.000Z",
};

const INVITATION: PendingInvitationListItem = {
  invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  emailNormalized: "invitee@example.com",
  role: "staff",
  status: "pending",
  createdAt: "2026-08-01T00:00:00.000Z",
  expiresAt: "2099-09-01T00:00:00.000Z",
  invitedByMemberId: "33333333-3333-4333-8333-333333333333",
  inviterDisplayName: "Alex Owner",
  isCredentialValid: true,
  isEffectivelyExpired: false,
};

const ADMIN_TARGET: PendingInvitationListItem = {
  ...INVITATION,
  invitationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  emailNormalized: "admin-invitee@example.com",
  role: "admin",
};

describe("Member administration list UI", () => {
  it("renders Members section landmarks, role/status labels, and responsive structures", () => {
    const html = renderToStaticMarkup(
      <ActiveMembersSection
        members={[MEMBER]}
        timeZone="UTC"
        loadFailed={false}
      />,
    );

    expect(html).toContain("Active members");
    expect(html).toContain("Alex Owner");
    expect(html).toContain("Owner");
    expect(html).toContain("Active");
    expect(html).toContain("<table");
    expect(html).toContain('aria-label="Active members"');
    expect(html).not.toContain("token_hash");
  });

  it("renders empty pending state without mutation CTA", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(html).toContain("Pending invitations");
    expect(html).toContain("No pending invitations");
    expect(html).toContain(
      "There are no pending invitations for this organization.",
    );
    expect(html).not.toContain("Create invitation");
    expect(html).not.toContain("Resend");
    expect(html).not.toContain("Revoke");
  });

  it("renders pending invitation actions for Owner-manageable rows", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[INVITATION]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(html).toContain("invitee@example.com");
    expect(html).toContain("Staff");
    expect(html).toContain("Pending");
    expect(html).toContain("Alex Owner");
    expect(html).toContain("Resend");
    expect(html).toContain("Revoke");
    expect(html).toContain('aria-label="Resend invitation for invitee@example.com"');
    expect(html).toContain('aria-label="Revoke invitation for invitee@example.com"');
    expect(html).not.toContain("token_hash");
    expect(html).not.toContain("raw_token");
  });

  it("hides Admin actions for admin-target invitations", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[ADMIN_TARGET]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="admin"
      />,
    );

    expect(html).toContain("admin-invitee@example.com");
    expect(html).toContain("Owner access required to manage this invitation.");
    expect(html).not.toContain("Resend");
    expect(html).not.toContain("Revoke");
  });

  it("announces load-failure distinctly from empty", () => {
    const membersHtml = renderToStaticMarkup(
      <ActiveMembersSection
        members={[]}
        timeZone="UTC"
        loadFailed
        errorMessage="Unable to load active members. Please try again."
      />,
    );
    expect(membersHtml).toContain('role="alert"');
    expect(membersHtml).toContain("Unable to load active members");
    expect(membersHtml).not.toContain("No active members");

    const invitesHtml = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[]}
        timeZone="UTC"
        loadFailed
        errorMessage="Unable to load pending invitations. Please try again."
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );
    expect(invitesHtml).toContain('role="alert"');
    expect(invitesHtml).toContain("Unable to load pending invitations");
    expect(invitesHtml).not.toContain("No pending invitations");
  });
});

describe("PendingInvitationActions", () => {
  it("renders accessible idle controls without token fields", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationActions
        organizationId={ORG_ID}
        invitationId={INVITATION.invitationId}
        emailLabel="invitee@example.com"
        canResend
        canRevoke
      />,
    );

    expect(html).toContain("Resend");
    expect(html).toContain("Revoke");
    expect(html).not.toContain("raw_token");
    expect(html).not.toContain("Copy");
  });
});
