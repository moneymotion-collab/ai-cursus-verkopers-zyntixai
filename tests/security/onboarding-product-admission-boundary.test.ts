import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("P1-D product-admission security boundary", () => {
  it("keeps product admission on the authenticated lifecycle path", () => {
    const enforcement = read(
      "src/features/onboarding/server/enforce-product-onboarding.ts",
    );
    const readyUi = read("src/features/onboarding/ui/onboarding-ready.tsx");
    const readyPage = read("src/app/onboarding/ready/page.tsx");

    expect(enforcement).toContain("kind === \"v2_completed\"");
    expect(enforcement).toContain("RedirectType.push");
    expect(enforcement).toContain("resolveOrganizationOnboardingLifecycle");
    expect(enforcement).not.toContain("createServiceRole");
    expect(enforcement).not.toContain("createSupabaseServiceRoleClient");
    expect(enforcement).not.toContain("service_role");
    const loader = read(
      "src/features/product-access/server/load-product-module-access.ts",
    );
    expect(loader).toContain("resolveOrganizationContext");
    expect(loader).not.toContain("createSupabaseServiceRoleClient");
    expect(loader).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(loader).not.toContain("createControlPlaneReaders");
    expect(enforcement).not.toContain("organization_business_activities");
    expect(readyUi).toContain("buildProductDestination");
    expect(readyUi).not.toContain("completeV2OnboardingAction()");
    expect(readyPage).toContain("resolveOnboardingOrganizationId");
    expect(readyPage).not.toContain("createServiceRole");
  });

  it("does not mint completion from a client-supplied flag or organization", () => {
    const readyUi = read("src/features/onboarding/ui/onboarding-ready.tsx");
    const readyDomain = read(
      "src/features/onboarding/domain/onboarding-ready.ts",
    );
    expect(readyUi).not.toContain("localStorage");
    expect(readyUi).not.toContain("sessionStorage");
    expect(readyUi).not.toContain("document.cookie");
    expect(readyDomain).toContain("organizationCompletedAt === snapshot.runCompletedAt");
    expect(readyDomain).not.toContain("p_completed");
    expect(readyDomain).not.toContain("clientCompleted");
  });
});
