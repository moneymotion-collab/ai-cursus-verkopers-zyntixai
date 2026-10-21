import { describe, expect, it, vi } from "vitest";
import {
  loadPendingOrganizationInvitations,
  PENDING_INVITATION_SAFE_COLUMNS,
} from "@/features/invitations/server/load-pending-organization-invitations";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const EXPIRED_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const INVITER_MEMBER = "33333333-3333-4333-8333-333333333333";
const INVITER_USER = "44444444-4444-4444-8444-444444444444";

const NOW = new Date("2026-08-12T12:00:00.000Z");

type InvitationRow = {
  id: string;
  organization_id: string;
  email_normalized: string;
  role: string;
  status: string;
  invited_by_member_id: string;
  expires_at: string;
  created_at: string;
  token_hash?: string;
};

function createSupabase(handlers: {
  invitations?: { data: InvitationRow[] | null; error: unknown };
  members?: {
    data: Array<{ id: string; user_id: string }> | null;
    error?: unknown;
  };
  profiles?: {
    data: Array<{ id: string; display_name: string | null }> | null;
    error?: unknown;
  };
}) {
  const from = vi.fn((table: string) => {
    if (table === "organization_invitations") {
      const chain: Record<string, unknown> = {};
      let eqCount = 0;
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => {
        eqCount += 1;
        return chain;
      });
      chain.order = vi.fn(async () => handlers.invitations ?? { data: [], error: null });
      return chain;
    }

    if (table === "organization_members") {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.in = vi.fn(async () => handlers.members ?? { data: [], error: null });
      return chain;
    }

    if (table === "profiles") {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.in = vi.fn(async () => handlers.profiles ?? { data: [], error: null });
      return chain;
    }

    throw new Error(`unexpected table ${table}`);
  });

  return { from } as never;
}

describe("loadPendingOrganizationInvitations", () => {
  it("returns pending invitations with safe columns only and inviter labels", async () => {
    const supabase = createSupabase({
      invitations: {
        data: [
          {
            id: INVITE_ID,
            organization_id: ORG_ID,
            email_normalized: "invitee@example.com",
            role: "staff",
            status: "pending",
            invited_by_member_id: INVITER_MEMBER,
            expires_at: "2026-09-01T00:00:00.000Z",
            created_at: "2026-08-01T00:00:00.000Z",
            token_hash: "should-never-be-selected",
          },
        ],
        error: null,
      },
      members: {
        data: [{ id: INVITER_MEMBER, user_id: INVITER_USER }],
      },
      profiles: {
        data: [{ id: INVITER_USER, display_name: "Alex Owner" }],
      },
    });

    const result = await loadPendingOrganizationInvitations(supabase, ORG_ID, {
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.invitations).toHaveLength(1);
    expect(result.invitations[0]).toEqual({
      invitationId: INVITE_ID,
      emailNormalized: "invitee@example.com",
      role: "staff",
      status: "pending",
      createdAt: "2026-08-01T00:00:00.000Z",
      expiresAt: "2026-09-01T00:00:00.000Z",
      invitedByMemberId: INVITER_MEMBER,
      inviterDisplayName: "Alex Owner",
      isCredentialValid: true,
      isEffectivelyExpired: false,
    });

    const serialized = JSON.stringify(result.invitations);
    expect(serialized).not.toContain("token_hash");
    expect(serialized).not.toContain("should-never-be-selected");

    const from = (supabase as { from: ReturnType<typeof vi.fn> }).from;
    expect(from).toHaveBeenCalledWith("organization_invitations");
    const inviteChain = from.mock.results[0]?.value as {
      select: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
    };
    expect(inviteChain.select).toHaveBeenCalledWith(PENDING_INVITATION_SAFE_COLUMNS);
    expect(PENDING_INVITATION_SAFE_COLUMNS).not.toContain("token_hash");
    expect(inviteChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(inviteChain.eq).toHaveBeenCalledWith("status", "pending");
    expect(inviteChain.eq).not.toHaveBeenCalledWith("organization_id", OTHER_ORG);
  });

  it("excludes effectively expired pending invitations from actionable pending", async () => {
    const result = await loadPendingOrganizationInvitations(
      createSupabase({
        invitations: {
          data: [
            {
              id: EXPIRED_ID,
              organization_id: ORG_ID,
              email_normalized: "stale@example.com",
              role: "viewer",
              status: "pending",
              invited_by_member_id: INVITER_MEMBER,
              expires_at: "2026-08-01T00:00:00.000Z",
              created_at: "2026-07-01T00:00:00.000Z",
            },
          ],
          error: null,
        },
        members: { data: [{ id: INVITER_MEMBER, user_id: INVITER_USER }] },
        profiles: { data: [{ id: INVITER_USER, display_name: "Alex Owner" }] },
      }),
      ORG_ID,
      { now: NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invitations).toEqual([]);
  });

  it("uses Team member fallback when inviter profile is missing", async () => {
    const result = await loadPendingOrganizationInvitations(
      createSupabase({
        invitations: {
          data: [
            {
              id: INVITE_ID,
              organization_id: ORG_ID,
              email_normalized: "invitee@example.com",
              role: "admin",
              status: "pending",
              invited_by_member_id: INVITER_MEMBER,
              expires_at: "2026-09-01T00:00:00.000Z",
              created_at: "2026-08-01T00:00:00.000Z",
            },
          ],
          error: null,
        },
        members: { data: [] },
        profiles: { data: [] },
      }),
      ORG_ID,
      { now: NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invitations[0]?.inviterDisplayName).toBe("Team member");
  });

  it("returns empty pending without inventing success failure", async () => {
    const result = await loadPendingOrganizationInvitations(
      createSupabase({ invitations: { data: [], error: null } }),
      ORG_ID,
      { now: NOW },
    );
    expect(result).toEqual({ ok: true, invitations: [] });
  });

  it("returns query_failed distinctly from empty", async () => {
    const result = await loadPendingOrganizationInvitations(
      createSupabase({
        invitations: { data: null, error: { message: "boom" } },
      }),
      ORG_ID,
      { now: NOW },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "query_failed",
        message: "Unable to load pending invitations. Please try again.",
      },
    });
  });
});
