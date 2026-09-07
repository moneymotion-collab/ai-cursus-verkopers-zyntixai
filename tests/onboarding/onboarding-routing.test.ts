import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const onboardingPage = readFileSync(
  join(process.cwd(), "src/app/onboarding/page.tsx"),
  "utf8",
);
const teamPage = readFileSync(
  join(process.cwd(), "src/app/onboarding/team/page.tsx"),
  "utf8",
);
const landing = readFileSync(
  join(process.cwd(), "src/features/auth/server/resolve-authenticated-landing.ts"),
  "utf8",
);
const safePath = readFileSync(
  join(process.cwd(), "src/features/auth/server/safe-return-path.ts"),
  "utf8",
);
const leadOrg = readFileSync(
  join(process.cwd(), "src/features/leads/server/resolve-lead-page-organization.ts"),
  "utf8",
);
const customerOrg = readFileSync(
  join(
    process.cwd(),
    "src/features/customers/server/resolve-customer-page-organization.ts",
  ),
  "utf8",
);
const taskOrg = readFileSync(
  join(process.cwd(), "src/features/tasks/ui/resolve-task-page-organization.ts"),
  "utf8",
);
const provision = readFileSync(
  join(process.cwd(), "src/features/auth/server/resolve-registration-destination.ts"),
  "utf8",
);
const middleware = readFileSync(
  join(process.cwd(), "src/lib/supabase/middleware.ts"),
  "utf8",
);
const enforcement = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/server/enforce-product-onboarding.ts",
  ),
  "utf8",
);
const lifecycleResolver = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/server/resolve-onboarding-lifecycle.ts",
  ),
  "utf8",
);

describe("B1.3 onboarding routing contract", () => {
  it("adds a protected /onboarding route with completed-owner redirect", () => {
    expect(onboardingPage).toContain("readOnboardingContext");
    expect(onboardingPage).toContain("OnboardingWizard");
    expect(onboardingPage).toContain('redirect(`/login?next=');
    expect(onboardingPage).toContain("buildProductDestination");
    expect(onboardingPage).toContain("isComplete");
    expect(onboardingPage).toContain("isOwner");
    expect(onboardingPage).toContain("organization_ambiguous");
  });

  it("allowlists and protects /onboarding for authenticated session gates", () => {
    expect(safePath).toContain('pathname === "/onboarding"');
    expect(safePath).toMatch(/pathname === "\/onboarding"/);
  });

  it("routes incomplete owners into onboarding from landing and product resolvers", () => {
    expect(landing).toContain("buildOnboardingPath");
    expect(landing).toContain('membershipRole === "owner"');
    expect(leadOrg).toContain("redirectIfOrganizationOnboardingIncomplete");
    expect(customerOrg).toContain("redirectIfOrganizationOnboardingIncomplete");
    expect(taskOrg).toContain("redirectIfOrganizationOnboardingIncomplete");
  });

  it("sends newly provisioned owners to onboarding before CRM", () => {
    expect(provision).toContain("buildOperatingModelOnboardingPath");
  });

  it("keeps recovery routes outside onboarding middleware interference", () => {
    expect(middleware).toContain("isPasswordRecoveryPath");
    expect(middleware).toContain("isProtectedApplicationPath");
    expect(middleware).not.toContain("onboarding_completed_at");
  });

  it("uses one lifecycle authority for landing, onboarding entry, and product access", () => {
    expect(landing).toContain("resolveOrganizationOnboardingLifecycle");
    expect(onboardingPage).toContain(
      "resolveOrganizationOnboardingLifecycle",
    );
    expect(enforcement).toContain(
      "resolveOrganizationOnboardingLifecycle",
    );
    expect(lifecycleResolver).toContain(
      "resolveOnboardingLifecycle",
    );
  });

  it("adds only the governed Team foundation and does not invent deferred workspace or ready routes", () => {
    expect(teamPage).toContain("TeamFoundation");
    expect(teamPage).toContain('lifecycle.state.kind !== "v2_configured"');
    expect(teamPage).not.toContain("markV2OnboardingSetupReadyAction");
    expect(teamPage).not.toContain("completeV2OnboardingAction");
    for (const source of [landing, onboardingPage, enforcement]) {
      expect(source).not.toMatch(/["'`]\/onboarding\/workspace/);
      expect(source).not.toMatch(/["'`]\/onboarding\/ready/);
    }
  });
});
