import { describe, expect, it, vi } from "vitest";
import {
  completeOnboarding,
  saveOnboardingDraft,
} from "@/features/onboarding/server/apply-onboarding";
import {
  buildOnboardingContext,
  readOnboardingContext,
} from "@/features/onboarding/server/read-onboarding-context";

function createSupabaseMock(options: {
  user?: { id: string } | null;
  memberships?: Array<{ organization_id: string; role: string; status: string }>;
  org?: Record<string, unknown> | null;
  profile?: { display_name: string | null } | null;
  rpcData?: Record<string, unknown>;
  rpcError?: { message: string } | null;
}) {
  const user = options.user === undefined ? { id: "user-1" } : options.user;
  const memberships = options.memberships ?? [
    {
      organization_id: "11111111-1111-4111-8111-111111111111",
      role: "owner",
      status: "active",
    },
  ];

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "organization_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: undefined,
          // chain ends with awaitable-like via double eq
        };
      }
      return {};
    }),
    rpc: vi.fn(),
    __memberships: memberships,
    __org: options.org,
    __profile: options.profile,
    __rpcData: options.rpcData,
    __rpcError: options.rpcError ?? null,
  };
}

/**
 * Lightweight chain mock matching the select().eq().eq() / maybeSingle patterns.
 */
function wireListMemberships(supabase: ReturnType<typeof createSupabaseMock>) {
  const memberships = supabase.__memberships;
  supabase.from = vi.fn((table: string) => {
    if (table === "organization_members") {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      // final await: vitest often uses thenable — emulate by returning Promise via eq last call
      let eqCount = 0;
      builder.eq = vi.fn(() => {
        eqCount += 1;
        if (eqCount >= 2) {
          return Promise.resolve({ data: memberships, error: null });
        }
        return builder;
      });
      return builder;
    }

    if (table === "organizations") {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.maybeSingle = vi.fn(async () => ({
        data: supabase.__org,
        error: null,
      }));
      return builder;
    }

    if (table === "profiles") {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.maybeSingle = vi.fn(async () => ({
        data: supabase.__profile,
        error: null,
      }));
      return builder;
    }

    throw new Error(`unexpected table ${table}`);
  });

  supabase.rpc = vi.fn(async () => ({
    data: supabase.__rpcData,
    error: supabase.__rpcError,
  }));
}

describe("buildOnboardingContext", () => {
  it("marks incomplete orgs and lists missing fields", () => {
    const context = buildOnboardingContext({
      organizationId: "11111111-1111-4111-8111-111111111111",
      organizationName: "Org",
      displayName: null,
      businessType: "course_seller",
      primaryAudience: "beginners",
      primaryOffering: null,
      primaryGoal: "organize_leads",
      teamSizeBand: null,
      onboardingCompletedAt: null,
      firstRunChecklistDismissedAt: null,
      membershipRole: "owner",
    });
    expect(context.isComplete).toBe(false);
    expect(context.isOwner).toBe(true);
    expect(context.missingRequiredFields).toEqual([
      "displayName",
      "primaryOffering",
    ]);
  });
});

describe("readOnboardingContext", () => {
  it("returns context for authenticated owner membership", async () => {
    const supabase = createSupabaseMock({
      org: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "QA Org",
        business_type: null,
        primary_audience: null,
        primary_offering: null,
        primary_goal: null,
        team_size_band: null,
        onboarding_completed_at: null,
        first_run_checklist_dismissed_at: null,
      },
      profile: { display_name: "Ada" },
    });
    wireListMemberships(supabase);

    const result = await readOnboardingContext(supabase as never);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.organizationName).toBe("QA Org");
      expect(result.context.displayName).toBe("Ada");
      expect(result.context.isComplete).toBe(false);
    }
  });

  it("denies unauthenticated callers", async () => {
    const supabase = createSupabaseMock({ user: null });
    wireListMemberships(supabase);
    const result = await readOnboardingContext(supabase as never);
    expect(result).toMatchObject({ ok: false, code: "not_authenticated" });
  });

  it("signals ambiguity when multiple memberships and no org id", async () => {
    const supabase = createSupabaseMock({
      memberships: [
        {
          organization_id: "11111111-1111-4111-8111-111111111111",
          role: "owner",
          status: "active",
        },
        {
          organization_id: "22222222-2222-4222-8222-222222222222",
          role: "owner",
          status: "active",
        },
      ],
    });
    wireListMemberships(supabase);
    const result = await readOnboardingContext(supabase as never);
    expect(result).toMatchObject({ ok: false, code: "organization_ambiguous" });
  });
});

describe("apply onboarding writes", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";

  it("draft save does not require full fields and returns RPC payload", async () => {
    const supabase = createSupabaseMock({
      rpcData: {
        organization_id: orgId,
        name: "QA Org",
        business_type: "course_seller",
        primary_audience: null,
        primary_offering: null,
        primary_goal: null,
        team_size_band: null,
        onboarding_completed_at: null,
        first_run_checklist_dismissed_at: null,
        display_name: "Ada",
        is_complete: false,
      },
    });
    wireListMemberships(supabase);

    const result = await saveOnboardingDraft(supabase as never, {
      organizationId: orgId,
      businessType: "course_seller",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.isComplete).toBe(false);
      expect(result.context.businessType).toBe("course_seller");
    }
    expect(supabase.rpc).toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.objectContaining({
        p_mode: "draft",
        p_organization_id: orgId,
        p_business_type: "course_seller",
      }),
    );
  });

  it("rejects non-owner writers before RPC", async () => {
    const supabase = createSupabaseMock({
      memberships: [
        {
          organization_id: orgId,
          role: "admin",
          status: "active",
        },
      ],
    });
    wireListMemberships(supabase);

    const result = await completeOnboarding(supabase as never, {
      organizationId: orgId,
      displayName: "Ada",
      organizationName: "QA Org",
      businessType: "course_seller",
      primaryAudience: "beginners",
      primaryOffering: "online_course",
      primaryGoal: "organize_leads",
    });
    expect(result).toMatchObject({ ok: false, code: "owner_required" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("maps owner membership required RPC errors", async () => {
    const supabase = createSupabaseMock({
      rpcError: { message: "owner membership required" },
    });
    wireListMemberships(supabase);

    const result = await saveOnboardingDraft(supabase as never, {
      organizationId: orgId,
      organizationName: "Renamed",
    });
    expect(result).toMatchObject({ ok: false, code: "owner_required" });
  });

  it("complete mode calls RPC with complete mode", async () => {
    const completedAt = "2026-07-20T10:00:00.000Z";
    const supabase = createSupabaseMock({
      rpcData: {
        organization_id: orgId,
        name: "QA Org",
        business_type: "course_seller",
        primary_audience: "beginners",
        primary_offering: "online_course",
        primary_goal: "organize_leads",
        team_size_band: "solo",
        onboarding_completed_at: completedAt,
        first_run_checklist_dismissed_at: null,
        display_name: "Ada",
        is_complete: true,
      },
    });
    wireListMemberships(supabase);

    const result = await completeOnboarding(supabase as never, {
      organizationId: orgId,
      displayName: "Ada",
      organizationName: "QA Org",
      businessType: "course_seller",
      primaryAudience: "beginners",
      primaryOffering: "online_course",
      primaryGoal: "organize_leads",
      teamSizeBand: "solo",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.isComplete).toBe(true);
      expect(result.context.onboardingCompletedAt).toBe(completedAt);
    }
    expect(supabase.rpc).toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.objectContaining({ p_mode: "complete" }),
    );
  });
});
