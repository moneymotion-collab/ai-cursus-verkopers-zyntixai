import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Slice 2 create-invitation boundary", () => {
  it("keeps client-facing create result types free of bearer fields", () => {
    const resultTypes = readSrc(
      "src/features/invitations/server/create-invitation-result.ts",
    );
    expect(resultTypes).toContain("CreateInvitationActionResult");
    expect(resultTypes).toContain("discards raw_token");
    expect(resultTypes).not.toContain("accept_url");
    expect(resultTypes).not.toContain("invite_token");
    expect(resultTypes).not.toContain("magic_link");

    const actionResultBlock = resultTypes.slice(
      resultTypes.indexOf("export type CreateInvitationActionResult"),
      resultTypes.indexOf("export const CREATE_INVITATION_MESSAGES"),
    );
    expect(actionResultBlock).not.toContain("raw_token");
    expect(actionResultBlock).not.toContain("token");
  });

  it("does not implement resend, revoke, or membership mutations", () => {
    const action = readSrc(
      "src/features/invitations/actions/create-invitation-action.ts",
    );
    const form = readSrc(
      "src/features/invitations/ui/invite-member-form.tsx",
    );
    const page = readSrc(
      "src/app/(authenticated)/settings/members/page.tsx",
    );

    for (const source of [action, form, page]) {
      expect(source).not.toMatch(/resend_organization_invitation|resendInvitation/i);
      expect(source).not.toMatch(/revoke_organization_invitation|revokeInvitation/i);
      expect(source).not.toMatch(/suspendMembership|reactivateMembership|removeMembership/i);
      expect(source).not.toContain("service_role");
      expect(source).not.toContain("console.log");
    }
  });

  it("wires create through authenticated session path without service role", () => {
    const adapter = readSrc(
      "src/features/invitations/server/create-invitation.ts",
    );
    const action = readSrc(
      "src/features/invitations/actions/create-invitation-action.ts",
    );
    expect(adapter).toContain("create_organization_invitation");
    expect(adapter).not.toContain("service_role");
    expect(action).toContain("createSupabaseServerClient");
    expect(action).toContain("resolveOrganizationContext");
    expect(action).toContain("canCreateOrganizationInvitation");
    expect(action).not.toContain("service_role");
  });
});
