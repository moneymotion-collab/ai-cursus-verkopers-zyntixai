import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildDraftPayload,
  formValuesFromContext,
  resolveInitialOnboardingStep,
  reviewLabels,
  type OnboardingFormValues,
} from "@/features/onboarding/domain/onboarding-steps";
import {
  PRIMARY_AUDIENCE_LABELS,
  PRIMARY_OFFERING_LABELS,
} from "@/features/onboarding/domain/onboarding-options";
import { buildOnboardingContext } from "@/features/onboarding/server/read-onboarding-context";
import {
  completeOnboarding,
  saveOnboardingDraft,
} from "@/features/onboarding/server/apply-onboarding";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";
import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORG = "11111111-1111-4111-8111-111111111111";

const PAIR_A = {
  offering: "mentorship",
  audience: "business_owners",
  offeringLabel: PRIMARY_OFFERING_LABELS.mentorship,
  audienceLabel: PRIMARY_AUDIENCE_LABELS.business_owners,
} as const;

const PAIR_B = {
  offering: "community",
  audience: "students",
  offeringLabel: PRIMARY_OFFERING_LABELS.community,
  audienceLabel: PRIMARY_AUDIENCE_LABELS.students,
} as const;

function baseValues(
  overrides: Partial<OnboardingFormValues> = {},
): OnboardingFormValues {
  return {
    displayName: "Casey",
    organizationName: "Casey Coaching",
    businessType: "course_seller",
    primaryAudience: "",
    primaryOffering: "",
    primaryGoal: "",
    teamSizeBand: "",
    ...overrides,
  };
}

function ownerContext(
  overrides: Partial<OnboardingContext> = {},
): OnboardingContext {
  return {
    organizationId: ORG,
    displayName: "Casey",
    organizationName: "Casey Coaching",
    businessType: "course_seller",
    primaryAudience: null,
    primaryOffering: null,
    primaryGoal: null,
    teamSizeBand: null,
    onboardingCompletedAt: null,
    firstRunChecklistDismissedAt: null,
    membershipRole: "owner",
    isOwner: true,
    isComplete: false,
    missingRequiredFields: ["primaryAudience", "primaryOffering", "primaryGoal"],
    ...overrides,
  };
}

function createSupabaseMock(options: {
  rpcData?: Record<string, unknown>;
  org?: Record<string, unknown> | null;
}) {
  const memberships = [
    {
      organization_id: ORG,
      role: "owner",
      status: "active",
    },
  ];

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
    from: vi.fn(),
    rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      data: {
        organization_id: ORG,
        name: "Casey Coaching",
        business_type: "course_seller",
        primary_audience: args.p_primary_audience ?? null,
        primary_offering: args.p_primary_offering ?? null,
        primary_goal: args.p_primary_goal ?? null,
        team_size_band: args.p_team_size_band ?? null,
        onboarding_completed_at: null,
        first_run_checklist_dismissed_at: null,
        display_name: "Casey",
        is_complete: false,
        ...options.rpcData,
      },
      error: null,
    })),
    __org: options.org ?? null,
    __memberships: memberships,
  };

  supabase.from = vi.fn((table: string) => {
    if (table === "organization_members") {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
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
        data: { display_name: "Casey" },
        error: null,
      }));
      return builder;
    }
    throw new Error(`unexpected table ${table}`);
  });

  return supabase;
}

function selectedOptionValue(html: string, selectIdSuffix: string): string | null {
  const selectMatch = html.match(
    new RegExp(
      `<select[^>]*id="[^"]*-${selectIdSuffix}"[^>]*>([\\s\\S]*?)</select>`,
    ),
  );
  if (!selectMatch) {
    return null;
  }
  const selected = selectMatch[1]!.match(
    /<option[^>]*selected[^>]*value="([^"]*)"/,
  ) ?? selectMatch[1]!.match(/<option[^>]*value="([^"]*)"[^>]*selected/);
  return selected?.[1] ?? null;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding/actions/onboarding-actions", () => ({
  saveOnboardingDraftAction: vi.fn(),
  completeOnboardingAction: vi.fn(),
}));

describe("B1.3-R1-FIX Step 2 exact-value preservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Test A — draft action payload maps offering A and audience B without swap", async () => {
    const supabase = createSupabaseMock({});
    const result = await saveOnboardingDraft(supabase as never, {
      organizationId: ORG,
      primaryOffering: PAIR_A.offering,
      primaryAudience: PAIR_A.audience,
    });

    expect(result.ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.objectContaining({
        p_primary_offering: PAIR_A.offering,
        p_primary_audience: PAIR_A.audience,
      }),
    );
    if (result.ok) {
      expect(result.context.primaryOffering).toBe(PAIR_A.offering);
      expect(result.context.primaryAudience).toBe(PAIR_A.audience);
    }
  });

  it("Test A (pair B) — second distinct combination also maps without swap", async () => {
    const supabase = createSupabaseMock({});
    await saveOnboardingDraft(supabase as never, {
      organizationId: ORG,
      primaryOffering: PAIR_B.offering,
      primaryAudience: PAIR_B.audience,
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.objectContaining({
        p_primary_offering: PAIR_B.offering,
        p_primary_audience: PAIR_B.audience,
      }),
    );
  });

  it("Test B — server read model keeps offering and audience columns distinct", () => {
    const context = buildOnboardingContext({
      organizationId: ORG,
      organizationName: "Casey Coaching",
      displayName: "Casey",
      businessType: "course_seller",
      primaryOffering: PAIR_A.offering,
      primaryAudience: PAIR_A.audience,
      primaryGoal: "organize_leads",
      teamSizeBand: null,
      onboardingCompletedAt: null,
      firstRunChecklistDismissedAt: null,
      membershipRole: "owner",
    });

    expect(context.primaryOffering).toBe(PAIR_A.offering);
    expect(context.primaryAudience).toBe(PAIR_A.audience);
    expect(context.primaryOffering).not.toBe(context.primaryAudience);
  });

  it("Test C — wizard rehydration selects exact persisted machine values", () => {
    const html = renderToStaticMarkup(
      <OnboardingWizard
        context={ownerContext({
          primaryOffering: PAIR_A.offering,
          primaryAudience: PAIR_A.audience,
        })}
        initialStep={2}
      />,
    );

    expect(selectedOptionValue(html, "primaryOffering")).toBe(PAIR_A.offering);
    expect(selectedOptionValue(html, "primaryAudience")).toBe(PAIR_A.audience);
    expect(selectedOptionValue(html, "primaryOffering")).not.toBe(
      PAIR_A.audience,
    );
  });

  it("Test D — Step 3 review labels belong to the correct field maps", () => {
    const values = formValuesFromContext(
      ownerContext({
        primaryOffering: PAIR_A.offering,
        primaryAudience: PAIR_A.audience,
      }),
    );
    const review = reviewLabels(values);

    expect(review.primaryOffering).toBe(PAIR_A.offeringLabel);
    expect(review.primaryAudience).toBe(PAIR_A.audienceLabel);
    expect(review.primaryOffering).not.toBe(PAIR_A.audienceLabel);
    expect(review.primaryAudience).not.toBe(PAIR_A.offeringLabel);

    const html = renderToStaticMarkup(
      <OnboardingWizard
        context={ownerContext({
          primaryOffering: PAIR_A.offering,
          primaryAudience: PAIR_A.audience,
        })}
        initialStep={3}
      />,
    );
    expect(html).toContain(`Offer:</strong> ${PAIR_A.offeringLabel}`);
    expect(html).toContain(`Audience:</strong> ${PAIR_A.audienceLabel}`);
  });

  it("Test E — refresh-equivalent rehydrate from server draft preserves pair B", () => {
    const first = formValuesFromContext(
      ownerContext({
        primaryOffering: PAIR_B.offering,
        primaryAudience: PAIR_B.audience,
      }),
    );
    const afterRemount = formValuesFromContext(
      ownerContext({
        primaryOffering: PAIR_B.offering,
        primaryAudience: PAIR_B.audience,
      }),
    );

    expect(afterRemount.primaryOffering).toBe(first.primaryOffering);
    expect(afterRemount.primaryAudience).toBe(first.primaryAudience);
    expect(afterRemount.primaryOffering).toBe(PAIR_B.offering);
    expect(afterRemount.primaryAudience).toBe(PAIR_B.audience);
  });

  it("Test F — Back navigation keeps Step 2 controls on persisted values", () => {
    const values = formValuesFromContext(
      ownerContext({
        primaryOffering: PAIR_A.offering,
        primaryAudience: PAIR_A.audience,
        primaryGoal: "organize_leads",
      }),
    );
    expect(resolveInitialOnboardingStep(values)).toBe(3);

    const step2Html = renderToStaticMarkup(
      <OnboardingWizard
        context={ownerContext({
          primaryOffering: PAIR_A.offering,
          primaryAudience: PAIR_A.audience,
          primaryGoal: "organize_leads",
        })}
        initialStep={2}
      />,
    );
    expect(selectedOptionValue(step2Html, "primaryOffering")).toBe(
      PAIR_A.offering,
    );
    expect(selectedOptionValue(step2Html, "primaryAudience")).toBe(
      PAIR_A.audience,
    );
  });

  it("Test G — missing or unknown values do not fall back to the first option", () => {
    const missing = formValuesFromContext(ownerContext());
    expect(missing.primaryOffering).toBe("");
    expect(missing.primaryAudience).toBe("");
    expect(reviewLabels(missing).primaryOffering).toBe("—");
    expect(reviewLabels(missing).primaryAudience).toBe("—");
    expect(resolveInitialOnboardingStep(missing)).toBe(2);

    const unknown = baseValues({
      primaryOffering: "not_a_real_offering" as OnboardingFormValues["primaryOffering"],
      primaryAudience: "not_a_real_audience" as OnboardingFormValues["primaryAudience"],
    });
    expect(reviewLabels(unknown).primaryOffering).toBe("—");
    expect(reviewLabels(unknown).primaryAudience).toBe("—");
    expect(resolveInitialOnboardingStep(unknown)).toBe(2);

    const html = renderToStaticMarkup(
      <OnboardingWizard context={ownerContext()} initialStep={2} />,
    );
    expect(selectedOptionValue(html, "primaryOffering")).toBe("");
    expect(selectedOptionValue(html, "primaryAudience")).toBe("");
  });

  it("Test H — buildDraftPayload for Step 2 keeps two distinct pairs unswapped", () => {
    for (const pair of [PAIR_A, PAIR_B]) {
      const payload = buildDraftPayload(
        ORG,
        2,
        baseValues({
          primaryOffering: pair.offering,
          primaryAudience: pair.audience,
        }),
      );
      expect(payload).toEqual({
        organizationId: ORG,
        primaryOffering: pair.offering,
        primaryAudience: pair.audience,
      });
    }
  });

  it("resume-step resolver covers complete, partial, and unknown Step 2 states", () => {
    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: "",
          primaryAudience: "",
        }),
      ),
    ).toBe(2);

    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: PAIR_A.offering,
          primaryAudience: "",
        }),
      ),
    ).toBe(2);

    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: "",
          primaryAudience: PAIR_A.audience,
        }),
      ),
    ).toBe(2);

    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: PAIR_A.offering,
          primaryAudience: PAIR_A.audience,
        }),
      ),
    ).toBe(3);

    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: PAIR_A.offering,
          primaryAudience: PAIR_A.audience,
          primaryGoal: "organize_leads",
        }),
      ),
    ).toBe(3);

    expect(
      resolveInitialOnboardingStep(
        baseValues({
          primaryOffering: "garbage" as OnboardingFormValues["primaryOffering"],
          primaryAudience: PAIR_A.audience,
        }),
      ),
    ).toBe(2);
  });

  it("complete path also forwards offering/audience without swap", async () => {
    const supabase = createSupabaseMock({});
    await completeOnboarding(supabase as never, {
      organizationId: ORG,
      displayName: "Casey",
      organizationName: "Casey Coaching",
      businessType: "course_seller",
      primaryOffering: PAIR_B.offering,
      primaryAudience: PAIR_B.audience,
      primaryGoal: "organize_leads",
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.objectContaining({
        p_mode: "complete",
        p_primary_offering: PAIR_B.offering,
        p_primary_audience: PAIR_B.audience,
      }),
    );
  });

  it("onboarding page forces dynamic rendering and draft save refreshes router", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/onboarding/page.tsx"),
      "utf8",
    );
    expect(page).toContain('export const dynamic = "force-dynamic"');

    const wizard = readFileSync(
      join(process.cwd(), "src/features/onboarding/ui/onboarding-wizard.tsx"),
      "utf8",
    );
    expect(wizard).toContain("router.refresh()");
    const draftRefreshIndex = wizard.indexOf("router.refresh()");
    const completeRefreshIndex = wizard.lastIndexOf("router.refresh()");
    expect(draftRefreshIndex).toBeGreaterThan(-1);
    expect(completeRefreshIndex).toBeGreaterThan(draftRefreshIndex);
  });
});
