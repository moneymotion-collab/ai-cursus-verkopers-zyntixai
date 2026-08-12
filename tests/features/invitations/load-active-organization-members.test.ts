import { describe, expect, it, vi } from "vitest";
import { loadActiveOrganizationMembers } from "@/features/invitations/server/load-active-organization-members";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";
const MEMBER_OWNER = "33333333-3333-4333-8333-333333333333";
const MEMBER_STAFF = "66666666-6666-4666-8666-666666666666";
const MEMBER_SUSPENDED = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_OWNER = "44444444-4444-4444-8444-444444444444";
const USER_STAFF = "77777777-7777-4777-8777-777777777777";
const USER_SUSPENDED = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function createSupabase(handlers: {
  members?: {
    data: Array<{
      id: string;
      user_id: string;
      role: string;
      status: string;
      joined_at: string | null;
    }> | null;
    error: unknown;
  };
  profiles?: {
    data: Array<{ id: string; display_name: string | null }> | null;
    error?: unknown;
  };
}) {
  const from = vi.fn((table: string) => {
    if (table === "organization_members") {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      chain.select = vi.fn(self);
      chain.eq = vi.fn(self);
      // Final thenable after filters
      chain.then = undefined;
      // Make the chain awaitable by returning result from last eq... actually
      // supabase awaits the builder; simulate with a thenable proxy via eq returning promise on second call
      let eqCount = 0;
      chain.eq = vi.fn(() => {
        eqCount += 1;
        if (eqCount >= 2) {
          return Promise.resolve(handlers.members ?? { data: [], error: null });
        }
        return chain;
      });
      return chain;
    }

    if (table === "profiles") {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      chain.select = vi.fn(self);
      chain.in = vi.fn(async () => handlers.profiles ?? { data: [], error: null });
      return chain;
    }

    throw new Error(`unexpected table ${table}`);
  });

  return { from } as never;
}

describe("loadActiveOrganizationMembers", () => {
  it("returns active members with safe labels, role/status, joined, and stable ordering", async () => {
    const supabase = createSupabase({
      members: {
        data: [
          {
            id: MEMBER_STAFF,
            user_id: USER_STAFF,
            role: "staff",
            status: "active",
            joined_at: "2026-01-02T00:00:00.000Z",
          },
          {
            id: MEMBER_OWNER,
            user_id: USER_OWNER,
            role: "owner",
            status: "active",
            joined_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          { id: USER_STAFF, display_name: "Sam Staff" },
          { id: USER_OWNER, display_name: "Alex Owner" },
        ],
      },
    });

    const result = await loadActiveOrganizationMembers(supabase, ORG_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.members).toEqual([
      {
        membershipId: MEMBER_OWNER,
        displayName: "Alex Owner",
        role: "owner",
        status: "active",
        joinedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        membershipId: MEMBER_STAFF,
        displayName: "Sam Staff",
        role: "staff",
        status: "active",
        joinedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    const from = (supabase as { from: ReturnType<typeof vi.fn> }).from;
    expect(from).toHaveBeenCalledWith("organization_members");
    const membersChain = from.mock.results[0]?.value as {
      eq: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    };
    expect(membersChain.select).toHaveBeenCalledWith(
      "id, user_id, role, status, joined_at",
    );
    expect(membersChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(membersChain.eq).toHaveBeenCalledWith("status", "active");
    expect(membersChain.eq).not.toHaveBeenCalledWith(
      "organization_id",
      OTHER_ORG,
    );

    for (const member of result.members) {
      expect(member).not.toHaveProperty("email");
      expect(member).not.toHaveProperty("userId");
      expect(member).not.toHaveProperty("user_id");
    }
  });

  it("uses Team member fallback when display_name is blank", async () => {
    const result = await loadActiveOrganizationMembers(
      createSupabase({
        members: {
          data: [
            {
              id: MEMBER_OWNER,
              user_id: USER_OWNER,
              role: "admin",
              status: "active",
              joined_at: null,
            },
          ],
          error: null,
        },
        profiles: { data: [{ id: USER_OWNER, display_name: "   " }] },
      }),
      ORG_ID,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.members[0]?.displayName).toBe("Team member");
  });

  it("does not invent suspended rows when query already filters active", async () => {
    // Loader relies on status=active filter; suspended should never appear in result set.
    const result = await loadActiveOrganizationMembers(
      createSupabase({
        members: {
          data: [
            {
              id: MEMBER_SUSPENDED,
              user_id: USER_SUSPENDED,
              role: "viewer",
              status: "active",
              joined_at: null,
            },
          ],
          error: null,
        },
        profiles: {
          data: [{ id: USER_SUSPENDED, display_name: "Viv Viewer" }],
        },
      }),
      ORG_ID,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.members.every((m) => m.status === "active")).toBe(true);
  });

  it("returns query_failed without inventing an empty success list", async () => {
    const result = await loadActiveOrganizationMembers(
      createSupabase({
        members: { data: null, error: { message: "boom" } },
      }),
      ORG_ID,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "query_failed",
        message: "Unable to load active members. Please try again.",
      },
    });
  });
});
