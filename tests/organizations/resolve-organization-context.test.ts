import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const MEMBER_A = "33333333-3333-4333-8333-333333333333";
const USER_ID = "44444444-4444-4444-8444-444444444444";

function createMockSupabase(options: {
  user?: { id: string } | null;
  authError?: { message: string; name?: string } | null;
  memberships?: Array<{
    id: string;
    organization_id: string;
    role: string;
    status: string;
    user_id: string;
  }>;
  membershipError?: { message: string } | null;
}) {
  const activeMembershipQuery = vi.fn().mockResolvedValue({
    data: options.memberships ?? [],
    error: options.membershipError ?? null,
  });
  const userEq = vi.fn().mockReturnValue({ eq: activeMembershipQuery });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: userEq,
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

function createMissingSessionError() {
  const error = new Error("Auth session missing!");
  error.name = "AuthSessionMissingError";
  return error;
}

describe("resolveOrganizationContext", () => {
  it("returns active membership for authenticated user", async () => {
    const supabase = createMockSupabase({
      user: { id: USER_ID },
      memberships: [
        {
          id: MEMBER_A,
          organization_id: ORG_A,
          role: "staff",
          status: "active",
          user_id: USER_ID,
        },
      ],
    });

    const result = await resolveOrganizationContext({
      supabase,
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.role).toBe("staff");
      expect(result.context.membershipId).toBe(MEMBER_A);
    }
  });

  it("fails when unauthenticated", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({ user: null }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("fails with AUTH_REQUIRED for live-equivalent missing session error", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: null,
        authError: createMissingSessionError(),
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
      expect(result.error.message).not.toMatch(/Auth session missing/i);
    }
  });

  it("fails with AUTH_REQUIRED for missing session error name only", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: null,
        authError: { name: "AuthSessionMissingError", message: "Auth session missing!" },
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("fails with AUTH_REQUIRED for compatibility missing session message", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: null,
        authError: { message: "Auth session missing!" },
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("does not classify unrelated auth transport errors as AUTH_REQUIRED", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: null,
        authError: new Error("fetch failed while contacting auth service"),
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NETWORK_ERROR");
      expect(result.error.message).not.toMatch(/fetch failed/i);
    }
  });

  it("fails when membership is missing", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: { id: USER_ID },
        memberships: [],
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });

  it("fails for malformed organization id", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({ user: { id: USER_ID } }),
      organizationId: "not-a-uuid",
    });

    expect(result.ok).toBe(false);
  });

  it("fails when requested org does not match active memberships", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: { id: USER_ID },
        memberships: [
          {
            id: MEMBER_A,
            organization_id: ORG_B,
            role: "staff",
            status: "active",
            user_id: USER_ID,
          },
        ],
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
  });

  it("fails for unknown role values", async () => {
    const result = await resolveOrganizationContext({
      supabase: createMockSupabase({
        user: { id: USER_ID },
        memberships: [
          {
            id: MEMBER_A,
            organization_id: ORG_A,
            role: "superadmin",
            status: "active",
            user_id: USER_ID,
          },
        ],
      }),
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
  });
});
