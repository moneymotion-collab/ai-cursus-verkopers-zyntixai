import React from "react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import type { PendingInvitationListItem } from "@/features/invitations/domain/member-administration-read-types";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

const INVITE_A: PendingInvitationListItem = {
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

const INVITE_B: PendingInvitationListItem = {
  ...INVITE_A,
  invitationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  emailNormalized: "second@example.com",
};

const ADMIN_TARGET: PendingInvitationListItem = {
  ...INVITE_A,
  invitationId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  emailNormalized: "admin-invitee@example.com",
  role: "admin",
};

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("Slice 5 pending action ownership", () => {
  it("mounts exactly one action owner per invitation", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[INVITE_A, INVITE_B]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(
      countOccurrences(
        html,
        `data-pending-action-owner="${INVITE_A.invitationId}"`,
      ),
    ).toBe(1);
    expect(
      countOccurrences(
        html,
        `data-pending-action-owner="${INVITE_B.invitationId}"`,
      ),
    ).toBe(1);
    expect(
      countOccurrences(html, 'aria-label="Resend invitation for invitee@example.com"'),
    ).toBe(1);
    expect(
      countOccurrences(html, 'aria-label="Revoke invitation for invitee@example.com"'),
    ).toBe(1);
    expect(
      countOccurrences(html, 'aria-label="Resend invitation for second@example.com"'),
    ).toBe(1);
  });

  it("does not render a second independent pending card-list action tree", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[INVITE_A]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    expect(html).toContain("<table");
    expect(html).toContain("Actions");
    expect(html).not.toContain('aria-label="Pending invitations"');
    expect(html).toContain('id="pending-invitations-heading"');
    expect(html).toContain('tabindex="-1"');
  });

  it("keeps Active members dual read markup without mutation owners", () => {
    const html = renderToStaticMarkup(
      <ActiveMembersSection
        members={[]}
        timeZone="UTC"
        loadFailed={false}
      />,
    );
    expect(html).toContain("No active members");

    const source = readSrc(
      "src/features/invitations/ui/member-administration-lists.tsx",
    );
    expect(source).toContain("cardList");
    expect(source).toContain("tableWrap");
    expect(source).toMatch(/Active members[\s\S]*cardList/);
  });
});

describe("Slice 5 focus and announcement contracts", () => {
  it("wires revoke success focus to pending heading and cancel restore to Revoke", () => {
    const actions = readSrc(
      "src/features/invitations/ui/pending-invitation-actions.tsx",
    );
    const lists = readSrc(
      "src/features/invitations/ui/member-administration-lists.tsx",
    );

    expect(lists).toContain("pendingHeadingRef");
    expect(lists).toContain("tabIndex={-1}");
    expect(actions).toContain("pendingHeadingRef?.current?.focus()");
    expect(actions).toContain("restoreRevokeFocusRef");
    expect(actions).toContain("revokeButtonRef.current?.focus()");
    expect(actions).toContain("handleRevokeCancel");
    expect(actions).not.toContain("matchMedia");
    expect(actions).not.toContain("innerWidth");
  });

  it("keeps one live-region surface per action owner markup", () => {
    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[INVITE_A]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_ID}
        actorRole="owner"
      />,
    );

    // Idle owner markup has no success/error live regions until mutation.
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(
      countOccurrences(html, 'data-pending-action-owner="'),
    ).toBe(1);
  });

  it("preserves Admin restricted-row semantics without actions", () => {
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
    expect(html).not.toContain("data-pending-action-owner");
  });
});

describe("Slice 5 architecture boundary", () => {
  it("avoids viewport JS switching and keeps mutation actions unchanged", () => {
    const lists = readSrc(
      "src/features/invitations/ui/member-administration-lists.tsx",
    );
    const actions = readSrc(
      "src/features/invitations/ui/pending-invitation-actions.tsx",
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

    for (const source of [lists, actions]) {
      expect(source).not.toContain("matchMedia");
      expect(source).not.toContain("innerWidth");
      expect(source).not.toContain("addEventListener(\"resize\"");
      expect(source).not.toContain("service_role");
      expect(source).not.toContain("raw_token");
      expect(source).not.toContain("token_hash");
    }

    expect(createAction).not.toContain("pendingHeadingRef");
    expect(resendAction).not.toContain("pendingHeadingRef");
    expect(revokeAction).not.toContain("pendingHeadingRef");
  });

  it("documents single-table pending responsive CSS without second action mount", () => {
    const css = readSrc(
      "src/features/invitations/ui/member-administration-lists.module.css",
    );
    expect(css).toContain(".pendingTable");
    expect(css).toContain("@media (max-width: 1023px)");
    expect(css).toContain('content: attr(data-label)');
  });
});
