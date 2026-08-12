import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";

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
  expiresAt: "2026-09-01T00:00:00.000Z",
  invitedByMemberId: "33333333-3333-4333-8333-333333333333",
  inviterDisplayName: "Alex Owner",
  isCredentialValid: true,
  isEffectivelyExpired: false,
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
      />,
    );

    expect(html).toContain("Pending invitations");
    expect(html).toContain("No pending invitations");
    expect(html).not.toContain("Create invitation");
    expect(html).not.toContain("Resend");
    expect(html).not.toContain("Revoke");
  });

  it("renders pending invitation email/role/expiry for authorized read surface", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[INVITATION]}
        timeZone="UTC"
        loadFailed={false}
      />,
    );

    expect(html).toContain("invitee@example.com");
    expect(html).toContain("Staff");
    expect(html).toContain("Pending");
    expect(html).toContain("Alex Owner");
    expect(html).not.toContain("token_hash");
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
      />,
    );
    expect(invitesHtml).toContain('role="alert"');
    expect(invitesHtml).toContain("Unable to load pending invitations");
    expect(invitesHtml).not.toContain("No pending invitations");
  });

  it("renders empty active members safely", () => {
    const html = renderToStaticMarkup(
      <ActiveMembersSection members={[]} timeZone="UTC" loadFailed={false} />,
    );
    expect(html).toContain("No active members");
  });
});
