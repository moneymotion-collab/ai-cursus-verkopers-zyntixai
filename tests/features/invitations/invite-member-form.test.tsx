import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InviteMemberForm } from "@/features/invitations/ui/invite-member-form";
import { getInvitableOrganizationRoles } from "@/features/invitations/domain/permissions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/invitations/actions/create-invitation-action", () => ({
  createInvitationAction: vi.fn(),
}));

const ORG_ID = "11111111-1111-4111-8111-111111111111";

describe("InviteMemberForm role options", () => {
  it("offers Owner invitable roles and never owner", () => {
    const roles = getInvitableOrganizationRoles("owner", "active");
    expect(roles).toEqual(["admin", "staff", "viewer"]);

    const html = renderToStaticMarkup(
      <InviteMemberForm
        organizationId={ORG_ID}
        invitableRoles={roles}
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled={false}
      />,
    );

    expect(html).toContain("Invite member");
    expect(html).toContain('id="invite-member-email"');
    expect(html).toContain('id="invite-member-role"');
    expect(html).toContain(">Admin<");
    expect(html).toContain(">Staff<");
    expect(html).toContain(">Viewer<");
    expect(html).not.toContain('value="owner"');
    expect(html).toContain("Create invitation");
    expect(html).toContain("Invitation email delivery is currently disabled.");
    expect(html.toLowerCase()).not.toContain("email sent");
  });

  it("offers Admin invitable roles without admin target", () => {
    const roles = getInvitableOrganizationRoles("admin", "active");
    expect(roles).toEqual(["staff", "viewer"]);

    const html = renderToStaticMarkup(
      <InviteMemberForm
        organizationId={ORG_ID}
        invitableRoles={roles}
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled
      />,
    );

    expect(html).toContain(">Staff<");
    expect(html).toContain(">Viewer<");
    expect(html).not.toContain('value="admin"');
    expect(html).not.toContain('value="owner"');
    expect(html).toContain("When delivery is enabled");
  });

  it("renders nothing when actor has no invitable roles", () => {
    const html = renderToStaticMarkup(
      <InviteMemberForm
        organizationId={ORG_ID}
        invitableRoles={getInvitableOrganizationRoles("staff", "active")}
        invitationAcceptanceEnabled
        invitationEmailDeliveryEnabled={false}
      />,
    );
    expect(html).toBe("");
  });
});
