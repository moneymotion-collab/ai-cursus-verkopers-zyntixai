import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Member administration Slice 1 boundary", () => {
  it("does not implement invitation or membership mutations", () => {
    const page = readSrc(
      "src/app/(authenticated)/settings/members/page.tsx",
    );
    const lists = readSrc(
      "src/features/invitations/ui/member-administration-lists.tsx",
    );
    const loader = readSrc(
      "src/features/invitations/server/load-member-administration-page.ts",
    );

    for (const source of [page, lists, loader]) {
      expect(source).not.toMatch(/createInvitation/i);
      expect(source).not.toMatch(/resendInvitation/i);
      expect(source).not.toMatch(/revokeInvitation/i);
      expect(source).not.toMatch(/suspendMembership/i);
      expect(source).not.toMatch(/reactivateMembership/i);
      expect(source).not.toMatch(/removeMembership/i);
      expect(source).not.toMatch(/token_hash/);
    }
  });

  it("pending loader selects only safe invitation columns", () => {
    const source = readSrc(
      "src/features/invitations/server/load-pending-organization-invitations.ts",
    );
    expect(source).toContain("PENDING_INVITATION_SAFE_COLUMNS");
    expect(source).toContain("email_normalized");
    expect(source).not.toMatch(/select\(\s*["']\*["']\s*\)/);
    expect(source).toMatch(/token_hash must never/i);
  });

  it("keeps database.generated.ts free of Slice 1 edits expectation via local types", () => {
    const readTypes = readSrc(
      "src/features/invitations/domain/member-administration-read-types.ts",
    );
    expect(readTypes).toContain("MemberAdminMember");
    expect(readTypes).toContain("PendingInvitationListItem");
    expect(readTypes).not.toContain("token_hash");
  });
});
