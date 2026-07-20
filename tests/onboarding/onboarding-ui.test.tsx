import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";

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

const ORG = "11111111-1111-4111-8111-111111111111";

function ownerContext(
  overrides: Partial<OnboardingContext> = {},
): OnboardingContext {
  return {
    organizationId: ORG,
    displayName: "Ada Lovelace",
    organizationName: "Analytical Engines",
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
    ...overrides,
  };
}

describe("onboarding UI", () => {
  it("renders step 1 with prefilled identity fields and progress", () => {
    const html = renderToStaticMarkup(
      <OnboardingWizard context={ownerContext()} initialStep={1} />,
    );

    expect(html).toContain("Step 1 of 3");
    expect(html).toContain("Tell us about your business");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Analytical Engines");
    expect(html).toContain("Course seller");
    expect(html).toContain("Save and continue");
    expect(html).toContain('value="course_seller"');
  });

  it("renders step 2 canonical option labels", () => {
    const html = renderToStaticMarkup(
      <OnboardingWizard
        context={ownerContext({
          businessType: "course_seller",
        })}
        initialStep={2}
      />,
    );

    expect(html).toContain("Step 2 of 3");
    expect(html).toContain("Online course");
    expect(html).toContain("Beginners");
    expect(html).toContain("Back");
  });

  it("renders step 3 review and complete CTA", () => {
    const html = renderToStaticMarkup(
      <OnboardingWizard
        context={ownerContext({
          businessType: "course_seller",
          primaryAudience: "beginners",
          primaryOffering: "online_course",
        })}
        initialStep={3}
      />,
    );

    expect(html).toContain("Step 3 of 3");
    expect(html).toContain("Complete setup");
    expect(html).toContain("Organize leads and follow-ups");
    expect(html).toContain("Just me");
    expect(html).toContain("Setup summary");
  });

  it("renders owner-required and ambiguous status panels without editable fields", () => {
    const ownerRequired = renderToStaticMarkup(
      <OnboardingStatusPanel
        title="Owner setup required"
        message="Your organization setup still needs to be completed by an owner."
        primaryHref="/leads"
        primaryLabel="Continue to workspace"
      />,
    );
    expect(ownerRequired).toContain("Owner setup required");
    expect(ownerRequired).not.toContain("<form");

    const ambiguous = renderToStaticMarkup(
      <OnboardingStatusPanel
        title="Choose an organization"
        message="Select an organization to continue setup."
        primaryHref="/leads"
        primaryLabel="Open organization list"
      />,
    );
    expect(ambiguous).toContain("Choose an organization");
  });
});
