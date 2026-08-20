import React from "react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { MemberAdministrationRolloutNotice } from "@/features/invitations/ui/member-administration-rollout-notice";
import { InviteMemberForm } from "@/features/invitations/ui/invite-member-form";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import { CREATE_INVITATION_MESSAGES } from "@/features/invitations/server/create-invitation-result";
import { RESEND_INVITATION_MESSAGES } from "@/features/invitations/server/resend-invitation-result";
import { REVOKE_INVITATION_MESSAGES } from "@/features/invitations/server/revoke-invitation-result";
import type { PendingInvitationListItem } from "@/features/invitations/domain/member-administration-read-types";

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

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const STAFF_INVITE: PendingInvitationListItem = {
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

const ADMIN_INVITE: PendingInvitationListItem = {
  ...STAFF_INVITE,
  invitationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  emailNormalized: "admin-invitee@example.com",
  role: "admin",
};

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Slice 4 gate-aware rollout notice", () => {
  it("shows Acceptance-disabled and delivery-disabled notice when both gates OFF", () => {
    const html = renderToStaticMarkup(
      <MemberAdministrationRolloutNotice
        invitationAcceptanceEnabled={false}
        invitationEmailDeliveryEnabled={false}
      />,
    );

    expect(html).toContain("restricted rollout");
    expect(html.toLowerCase()).toContain("acceptance is currently disabled");
    expect(html.toLowerCase()).toContain("email delivery is currently disabled");
    expect(html.toLowerCase()).not.toContain("email sent");
    expect(html.toLowerCase()).not.toContain("recipient notified");
    expect(html).not.toContain("INVITATIONS_ENABLED");
    expect(html).not.toContain("process.env");
  });

  it("shows delivery-only notice when acceptance ON and delivery OFF", () => {
    const html = renderToStaticMarkup(
      <MemberAdministrationRolloutNotice
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled={false}
      />,
    );
    expect(html).toContain("restricted rollout");
    expect(html.toLowerCase()).toContain("email delivery is currently disabled");
    expect(html.toLowerCase()).not.toContain("acceptance is currently disabled");
  });

  it("hides notice when both acceptance and delivery gates ON", () => {
    const html = renderToStaticMarkup(
      <MemberAdministrationRolloutNotice
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled
      />,
    );

    expect(html).toBe("");
  });
});

describe("Slice 4 create/resend/revoke message truthfulness", () => {
  it("create success no longer implies acceptance is available", () => {
    expect(CREATE_INVITATION_MESSAGES.success).toBe(
      "Invitation created. It is pending.",
    );
    expect(CREATE_INVITATION_MESSAGES.success.toLowerCase()).not.toContain(
      "until accepted",
    );
    expect(CREATE_INVITATION_MESSAGES.success.toLowerCase()).not.toContain(
      "email sent",
    );
  });

  it("form appends acceptance-disabled note when gate OFF and keeps controls usable", () => {
    const html = renderToStaticMarkup(
      <InviteMemberForm
        organizationId={ORG_ID}
        invitableRoles={["staff", "viewer"]}
        invitationAcceptanceEnabled={false}
        invitationEmailDeliveryEnabled={false}
      />,
    );

    expect(html).toContain("Create invitation");
    expect(html).not.toContain("disabled=\"\"");
    expect(html).not.toContain("disabled={true}");
    expect(html).toContain('aria-disabled="false"');
    expect(html.toLowerCase()).toContain("invitation email delivery is currently disabled");
    expect(html.toLowerCase()).not.toContain("email sent");
  });

  it("form remains usable when Acceptance is ON and reflects delivery gate truthfully", () => {
    const html = renderToStaticMarkup(
      <InviteMemberForm
        organizationId={ORG_ID}
        invitableRoles={["admin", "staff", "viewer"]}
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled={false}
      />,
    );

    expect(html).toContain("Create invitation");
    expect(html.toLowerCase()).toContain("invitation email delivery is currently disabled");
    expect(html.toLowerCase()).not.toContain("email sent");
    expect(html.toLowerCase()).not.toContain("recipient notified");
  });

  it("resend and revoke base success copy stay free of mailbox-delivery claims", () => {
    expect(RESEND_INVITATION_MESSAGES.success.toLowerCase()).not.toMatch(
      /\bdelivered\b|\bnotified\b|inbox/,
    );
    expect(RESEND_INVITATION_MESSAGES.success_submitted.toLowerCase()).toContain(
      "email submitted",
    );
    expect(
      RESEND_INVITATION_MESSAGES.success_submitted.toLowerCase(),
    ).not.toContain("delivered");
    expect(REVOKE_INVITATION_MESSAGES.success).toBe("Invitation revoked.");
  });
});

describe("Slice 4 pending availability while Acceptance OFF", () => {
  it("keeps Resend and Revoke available for authorized Owner rows", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[STAFF_INVITE]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(html).toContain("Resend");
    expect(html).toContain("Revoke");
    expect(html).not.toContain("Owner access required");
  });

  it("shows Admin admin-target row with manage hint and no actions", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[ADMIN_INVITE]}
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
});

describe("Slice 4 empty and partial-error presentation", () => {
  it("renders pending empty state without duplicate Invite CTA", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(html).toContain("No pending invitations");
    expect(html).toContain(
      "There are no pending invitations for this organization.",
    );
    expect(html).not.toContain("Create invitation");
    expect(html).not.toContain("Invite member");
  });

  it("keeps active empty distinct from load failure", () => {
    const empty = renderToStaticMarkup(
      <ActiveMembersSection members={[]} timeZone="UTC" loadFailed={false} />,
    );
    expect(empty).toContain("No active members");
    expect(empty).not.toContain('role="alert"');

    const failed = renderToStaticMarkup(
      <ActiveMembersSection
        members={[]}
        timeZone="UTC"
        loadFailed
        errorMessage="Unable to load active members. Please try again."
      />,
    );
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Unable to load active members");
    expect(failed).not.toContain("No active members");
  });
});

describe("Slice 4 boundary", () => {
  it("resolves gate on page without mutating action semantics", () => {
    const page = readSrc(
      "src/app/(authenticated)/settings/members/page.tsx",
    );
    const createAction = readSrc(
      "src/features/invitations/actions/create-invitation-action.ts",
    );
    const resendAction = readSrc(
      "src/features/invitations/actions/resend-invitation-action.ts",
    );
    const revokeAction = readSrc(
      "src/features/invitations/actions/revoke-invitation-action.ts",
    );

    expect(page).toContain("isInvitationsFeatureEnabled");
    expect(page).toContain("invitationAcceptanceEnabled");
    expect(page).not.toContain("INVITATIONS_ENABLED");
    expect(page).not.toContain("process.env");

    expect(createAction).not.toContain("isInvitationsFeatureEnabled");
    expect(resendAction).not.toContain("isInvitationsFeatureEnabled");
    expect(revokeAction).not.toContain("isInvitationsFeatureEnabled");
  });

  it("does not introduce delivery, rate-limit, or membership mutation code", () => {
    const notice = readSrc(
      "src/features/invitations/ui/member-administration-rollout-notice.tsx",
    );
    const form = readSrc(
      "src/features/invitations/ui/invite-member-form.tsx",
    );
    for (const source of [notice, form]) {
      expect(source).not.toContain("service_role");
      expect(source).not.toMatch(/sendEmail|nodemailer|postmark|sendgrid/i);
      expect(source).not.toMatch(/rate.?limit/i);
      expect(source).not.toMatch(/suspendMembership|removeMembership/i);
      expect(source).not.toContain("raw_token");
      expect(source).not.toContain("token_hash");
    }
  });
});
