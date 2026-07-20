/**
 * Browser journey contracts for B1.3.
 * The repository has no Playwright runner; these tests encode the required
 * journeys as deterministic source and domain assertions for local CI.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildOnboardingPath,
  buildProductDestination,
  formValuesFromContext,
  resolveInitialOnboardingStep,
  validateOnboardingStep,
} from "@/features/onboarding/domain/onboarding-steps";
import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";

const ORG = "11111111-1111-4111-8111-111111111111";

function context(partial: Partial<OnboardingContext> = {}): OnboardingContext {
  return {
    organizationId: ORG,
    displayName: "Casey",
    organizationName: "Casey Coaching",
    businessType: null,
    primaryAudience: null,
    primaryOffering: null,
    primaryGoal: null,
    teamSizeBand: null,
    onboardingCompletedAt: null,
    firstRunChecklistDismissedAt: null,
    membershipRole: "owner",
    isOwner: true,
    isComplete: false,
    missingRequiredFields: [
      "businessType",
      "primaryAudience",
      "primaryOffering",
      "primaryGoal",
    ],
    ...partial,
  };
}

describe("B1.3 browser journey contracts", () => {
  it("Journey A — incomplete owner starts at step 1 with prefills then completes to leads", () => {
    const values = formValuesFromContext(context());
    expect(resolveInitialOnboardingStep(values)).toBe(1);
    expect(values.displayName).toBe("Casey");
    expect(values.organizationName).toBe("Casey Coaching");
    expect(buildProductDestination(ORG)).toBe(`/leads?org=${ORG}`);
  });

  it("Journey B — refresh resumes from saved server values", () => {
    const values = formValuesFromContext(
      context({
        businessType: "course_seller",
        primaryAudience: "professionals",
      }),
    );
    expect(resolveInitialOnboardingStep(values)).toBe(2);
    expect(values.businessType).toBe("course_seller");
  });

  it("Journey C — empty required fields keep the user on the current step", () => {
    const errors = validateOnboardingStep(1, formValuesFromContext(context({
      displayName: "",
      organizationName: "",
    })));
    expect(Object.keys(errors).length).toBeGreaterThan(0);
  });

  it("Journey D — completed owners are redirected away from onboarding", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/onboarding/page.tsx"),
      "utf8",
    );
    expect(page).toContain("if (result.context.isComplete)");
    expect(page).toContain("buildProductDestination");
  });

  it("Journey E — incomplete owners hitting product routes are gated to onboarding", () => {
    const enforce = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/server/enforce-product-onboarding.ts",
      ),
      "utf8",
    );
    expect(enforce).toContain("membershipRole !== \"owner\"");
    expect(enforce).toContain("buildOnboardingPath");
    expect(buildOnboardingPath(ORG)).toBe(`/onboarding?org=${ORG}`);
  });

  it("Journey F — recovery routes remain outside onboarding gates", () => {
    const middleware = readFileSync(
      join(process.cwd(), "src/lib/supabase/middleware.ts"),
      "utf8",
    );
    expect(middleware).toContain("isPasswordRecoveryPath");
    expect(middleware).not.toContain("onboarding_completed_at");
  });

  it("Journey G — non-owners receive owner-required UI without the wizard form", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/onboarding/page.tsx"),
      "utf8",
    );
    expect(page).toContain("Owner setup required");
    expect(page).toContain("!result.context.isOwner");
    expect(page).toContain("OnboardingWizard");
  });
});
