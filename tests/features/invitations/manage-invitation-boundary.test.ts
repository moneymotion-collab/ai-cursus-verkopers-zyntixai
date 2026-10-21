import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Slice 3 pending invitation actions boundary", () => {
  it("keeps client action results free of bearer fields", () => {
    const resend = readSrc(
      "src/features/invitations/server/resend-invitation-result.ts",
    );
    const revoke = readSrc(
      "src/features/invitations/server/revoke-invitation-result.ts",
    );

    const resendAction = resend.slice(
      resend.indexOf("export type ResendInvitationActionResult"),
      resend.indexOf("export const RESEND_INVITATION_MESSAGES"),
    );
    const revokeAction = revoke.slice(
      revoke.indexOf("export type RevokeInvitationActionResult"),
      revoke.indexOf("export const REVOKE_INVITATION_MESSAGES"),
    );

    for (const block of [resendAction, revokeAction]) {
      expect(block).not.toContain("raw_token");
      expect(block).not.toContain("rawToken");
      expect(block).not.toMatch(/\btoken\b/);
      expect(block).not.toContain("accept_url");
      expect(block).not.toContain("magic_link");
    }

    expect(resend).toMatch(/discards raw_token|Discard bearer/i);
  });

  it("does not claim mailbox delivery or expose copy-token UX", () => {
    const ui = readSrc(
      "src/features/invitations/ui/pending-invitation-actions.tsx",
    );
    const messages = readSrc(
      "src/features/invitations/server/resend-invitation-result.ts",
    );

    expect(ui).not.toMatch(/Copy (link|token)/i);
    expect(ui).not.toContain("accept_url");
    expect(messages).not.toMatch(/Email resent|Recipient notified|Message delivered|inbox/i);
    expect(messages).toContain("Invitation refreshed");
    expect(messages).toContain("email submitted");
  });

  it("wires manage path through authenticated session without service role or SQL", () => {
    const files = [
      "src/features/invitations/actions/resend-invitation-action.ts",
      "src/features/invitations/actions/revoke-invitation-action.ts",
      "src/features/invitations/server/resend-invitation.ts",
      "src/features/invitations/server/revoke-invitation.ts",
      "src/features/invitations/server/load-invitation-for-manage.ts",
    ];

    for (const relative of files) {
      const source = readSrc(relative);
      expect(source).not.toContain("service_role");
      expect(source).not.toContain("createServiceRole");
      expect(source).not.toMatch(/\.sql`|execute_sql|from\(".*"\)\.delete\(/);
      expect(source).not.toContain("console.log");
    }

    const resendAction = readSrc(
      "src/features/invitations/actions/resend-invitation-action.ts",
    );
    const revokeAction = readSrc(
      "src/features/invitations/actions/revoke-invitation-action.ts",
    );
    expect(resendAction).toContain("createSupabaseServerClient");
    expect(resendAction).toContain("resolveOrganizationContext");
    expect(resendAction).toContain("canManageOrganizationInvitation");
    expect(resendAction).toContain("revalidatePath");
    expect(revokeAction).toContain("canManageOrganizationInvitation");
    expect(revokeAction).toContain("revalidatePath");
  });

  it("does not modify create flow or membership mutations", () => {
    const createAction = readSrc(
      "src/features/invitations/actions/create-invitation-action.ts",
    );
    const createAdapter = readSrc(
      "src/features/invitations/server/create-invitation.ts",
    );
    expect(createAction).not.toMatch(/resend_organization_invitation/);
    expect(createAction).not.toMatch(/revoke_organization_invitation/);
    expect(createAdapter).not.toMatch(/resend_organization_invitation/);

    const ui = readSrc(
      "src/features/invitations/ui/pending-invitation-actions.tsx",
    );
    expect(ui).not.toMatch(/suspendMembership|reactivateMembership|removeMembership/i);
  });
});
