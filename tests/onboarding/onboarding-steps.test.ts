import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPE_LABELS,
  PRIMARY_GOAL_LABELS,
} from "@/features/onboarding/domain/onboarding-options";
import {
  ONBOARDING_STEPS,
  buildCompletePayload,
  buildDraftPayload,
  buildOnboardingPath,
  buildProductDestination,
  firstInvalidField,
  formValuesFromContext,
  parseOnboardingStep,
  resolveInitialOnboardingStep,
  validateOnboardingStep,
  type OnboardingFormValues,
} from "@/features/onboarding/domain/onboarding-steps";
import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";

const ORG = "11111111-1111-4111-8111-111111111111";

function baseValues(
  overrides: Partial<OnboardingFormValues> = {},
): OnboardingFormValues {
  return {
    displayName: "",
    organizationName: "",
    businessType: "",
    primaryAudience: "",
    primaryOffering: "",
    primaryGoal: "",
    teamSizeBand: "",
    ...overrides,
  };
}

function baseContext(
  overrides: Partial<OnboardingContext> = {},
): OnboardingContext {
  return {
    organizationId: ORG,
    displayName: "Ada",
    organizationName: "Ada Coaching",
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
    missingRequiredFields: ["businessType", "primaryAudience", "primaryOffering", "primaryGoal"],
    ...overrides,
  };
}

describe("onboarding steps domain", () => {
  it("defines three steps with progress labels", () => {
    expect(ONBOARDING_STEPS).toHaveLength(3);
    expect(ONBOARDING_STEPS[0]?.progressLabel).toBe("Step 1 of 3");
    expect(ONBOARDING_STEPS[2]?.progressLabel).toBe("Step 3 of 3");
  });

  it("parses step query values with a safe fallback to step one", () => {
    expect(parseOnboardingStep("2")).toBe(2);
    expect(parseOnboardingStep(3)).toBe(3);
    expect(parseOnboardingStep("9")).toBe(1);
    expect(parseOnboardingStep(undefined)).toBe(1);
  });

  it("prefills form values from server context without inventing enums", () => {
    const values = formValuesFromContext(baseContext());
    expect(values.displayName).toBe("Ada");
    expect(values.organizationName).toBe("Ada Coaching");
    expect(values.businessType).toBe("");
  });

  it("resumes at the first incomplete step", () => {
    expect(resolveInitialOnboardingStep(baseValues())).toBe(1);
    expect(
      resolveInitialOnboardingStep(
        baseValues({
          displayName: "Ada",
          organizationName: "Ada Coaching",
          businessType: "course_seller",
        }),
      ),
    ).toBe(2);
    expect(
      resolveInitialOnboardingStep(
        baseValues({
          displayName: "Ada",
          organizationName: "Ada Coaching",
          businessType: "course_seller",
          primaryAudience: "beginners",
          primaryOffering: "online_course",
        }),
      ),
    ).toBe(3);
  });

  it("validates required fields per step with professional messages", () => {
    const step1 = validateOnboardingStep(1, baseValues());
    expect(step1.displayName?.[0]).toMatch(/name/i);
    expect(step1.organizationName?.[0]).toMatch(/company/i);
    expect(step1.businessType?.[0]).toMatch(/business/i);

    const step2 = validateOnboardingStep(
      2,
      baseValues({
        displayName: "Ada",
        organizationName: "Ada Coaching",
        businessType: "course_seller",
      }),
    );
    expect(step2.primaryAudience?.[0]).toMatch(/audience/i);
    expect(step2.primaryOffering?.[0]).toMatch(/offer/i);
  });

  it("builds draft and complete payloads without client timestamps", () => {
    const values = baseValues({
      displayName: "Ada",
      organizationName: "Ada Coaching",
      businessType: "course_seller",
      primaryAudience: "beginners",
      primaryOffering: "online_course",
      primaryGoal: "organize_leads",
      teamSizeBand: "solo",
    });

    expect(buildDraftPayload(ORG, 1, values)).toEqual({
      organizationId: ORG,
      displayName: "Ada",
      organizationName: "Ada Coaching",
      businessType: "course_seller",
    });

    const complete = buildCompletePayload(ORG, values);
    expect(complete).not.toHaveProperty("onboardingCompletedAt");
    expect(complete).toMatchObject({
      organizationId: ORG,
      primaryGoal: "organize_leads",
      teamSizeBand: "solo",
    });
  });

  it("preserves organization context in destination builders", () => {
    expect(buildProductDestination(ORG)).toBe(`/leads?org=${ORG}`);
    expect(buildOnboardingPath(ORG)).toBe(`/onboarding?org=${ORG}`);
    expect(buildOnboardingPath()).toBe("/onboarding");
  });

  it("uses label maps rather than machine values in the UI contract", () => {
    expect(BUSINESS_TYPE_LABELS.course_seller).toBe("Course seller");
    expect(PRIMARY_GOAL_LABELS.organize_leads).toMatch(/leads/i);
    expect(firstInvalidField({ businessType: ["Choose the type of business you run."] })).toBe(
      "businessType",
    );
  });
});
