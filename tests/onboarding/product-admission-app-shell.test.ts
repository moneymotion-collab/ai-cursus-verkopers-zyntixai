import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const ENFORCEMENT_CALL_SITES = [
  "src/features/attention/server/resolve-attention-page-organization.ts",
  "src/features/tasks/ui/resolve-task-page-organization.ts",
  "src/features/customers/server/resolve-customer-page-organization.ts",
  "src/features/invitations/server/load-member-administration-page.ts",
  "src/features/leads/server/resolve-lead-page-organization.ts",
  "src/features/product-operations/server/resolve-product-operations-context.ts",
  "src/features/field-operations/server/resolve-field-page-context.ts",
  "src/features/projects/server/resolve-project-page-context.ts",
  "src/features/progress/server/resolve-progress-page-organization.ts",
  "src/features/enrollments/server/resolve-enrollment-page-organization.ts",
  "src/features/programs/server/resolve-program-page-organization.ts",
  "src/features/social-media/server/load-social-workspace-page.ts",
  "src/features/social-media/server/load-b18-instagram-publish-page.ts",
  "src/features/social-media/server/load-b19-lifecycle-page.ts",
  "src/features/social-media/server/load-r1-instagram-connect-page.ts",
] as const;

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("P1-D app-shell product admission boundary", () => {
  it("keeps exactly one enforcement helper across the committed product resolvers", () => {
    expect(ENFORCEMENT_CALL_SITES).toHaveLength(15);
    for (const relativePath of ENFORCEMENT_CALL_SITES) {
      const source = read(relativePath);
      expect(source).toContain("redirectIfOrganizationOnboardingIncomplete");
      expect(source).not.toContain("createServiceRoleClient");
      expect(source).not.toContain("createSupabaseServiceRoleClient");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("protects /home through the existing task organization resolver", () => {
    const home = read("src/app/(authenticated)/home/page.tsx");
    const daily = read(
      "src/features/daily-operating/server/load-daily-operating-page.ts",
    );
    const tasks = read(
      "src/features/tasks/ui/resolve-task-page-organization.ts",
    );
    expect(home).toContain("loadDailyOperatingPage");
    expect(daily).toContain("resolveTaskPageOrganization");
    expect(tasks).toContain("redirectIfOrganizationOnboardingIncomplete");
    expect(tasks).toMatch(
      /loadProductModuleAccess\(\s*selection\.organizationId,\s*supabase,?/,
    );
    expect(tasks).not.toContain("createSupabaseServiceRoleClient");
    const loader = read(
      "src/features/product-access/server/load-product-module-access.ts",
    );
    expect(loader).toContain("createSupabaseServerClient");
    expect(loader).toContain("OrganizationContextRepository");
    expect(loader).not.toContain("createSupabaseServiceRoleClient");
    expect(loader).not.toContain("createControlPlaneReaders");
  });

  it("does not introduce a second admission system in middleware or the authenticated layout", () => {
    const middleware = read("src/lib/supabase/middleware.ts");
    const layout = read("src/app/(authenticated)/layout.tsx");
    expect(middleware).not.toContain("onboarding_completed_at");
    expect(layout).not.toContain("redirectIfOrganizationOnboardingIncomplete");
    expect(layout.trim()).toContain("return children");
  });

  it("keeps Ready as the explicit cutover surface rather than a silent product redirect", () => {
    const readyPage = read("src/app/onboarding/ready/page.tsx");
    const creatingPage = read("src/app/onboarding/creating/page.tsx");
    const onboardingPage = read("src/app/onboarding/page.tsx");
    const readyUi = read("src/features/onboarding/ui/onboarding-ready.tsx");
    expect(readyPage).toContain('lifecycle.state.kind === "v2_completed"');
    expect(readyPage).toContain("OnboardingReady");
    expect(readyUi).toContain("Open ZyntixAI");
    expect(readyUi).toContain("buildProductDestination");
    expect(readyUi).not.toContain("useEffect");
    expect(readyUi).not.toContain("setTimeout");
    expect(readyUi).not.toContain("setInterval");
    expect(creatingPage).toContain(
      'lifecycle.state.kind === "v2_completed"',
    );
    expect(creatingPage).toContain("buildProductDestination");
    expect(onboardingPage).toContain('lifecycle.state.kind === "v2_completed"');
    expect(onboardingPage).toContain("buildProductDestination");
  });

  it("renders a safe onboarding error boundary without leaking exception details", () => {
    const errorPage = read("src/app/onboarding/error.tsx");
    const fallback = read(
      "src/features/onboarding/ui/onboarding-error-fallback.tsx",
    );
    expect(errorPage).toContain("OnboardingErrorFallback");
    expect(fallback).toContain("Setup needs attention");
    expect(fallback).toContain("Try again");
    expect(fallback).not.toContain("error.message");
    expect(fallback).not.toContain("stack");
    expect(fallback).not.toContain("schema_migrations");
  });
});
