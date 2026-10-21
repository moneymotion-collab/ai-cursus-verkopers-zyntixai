import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import { operatingModelFromTenantActivity } from "@/features/onboarding/domain/operating-model";
import {
  buildOperatingModelProductModuleAccess,
  operatingModelNavVisibility,
} from "@/features/product-access/domain/operating-model-module-access";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import {
  FIELD_MODULE_NAV_VISIBILITY,
  KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
  SERVICE_MODULE_NAV_VISIBILITY,
} from "../features/product-access/module-access-fixtures";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const guard = require("./product-shell-elevated-env-guard.cjs") as {
  inspectApplicationEnv: (env: Record<string, string | undefined>) => {
    ok: boolean;
    reason?: string;
  };
  installApplicationEnvGuard: (
    env: Record<string, string | undefined>,
    options?: { onReject?: (result: { ok: false; reason: string }) => void },
  ) => { ok: boolean; reason?: string };
};

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const HOME_GRAPH = [
  "src/app/(authenticated)/home/page.tsx",
  "src/features/daily-operating/server/load-daily-operating-page.ts",
  "src/features/tasks/ui/resolve-task-page-organization.ts",
  "src/features/onboarding/server/enforce-product-onboarding.ts",
  "src/features/product-access/server/load-product-module-access.ts",
] as const;

const PRODUCT_RESOLVERS = [
  "src/features/tasks/ui/resolve-task-page-organization.ts",
  "src/features/attention/server/resolve-attention-page-organization.ts",
  "src/features/customers/server/resolve-customer-page-organization.ts",
  "src/features/leads/server/resolve-lead-page-organization.ts",
  "src/features/invitations/server/load-member-administration-page.ts",
  "src/features/projects/server/resolve-project-page-context.ts",
  "src/features/field-operations/server/resolve-field-page-context.ts",
  "src/features/product-operations/server/resolve-product-operations-context.ts",
  "src/features/programs/server/resolve-program-page-organization.ts",
  "src/features/enrollments/server/resolve-enrollment-page-organization.ts",
  "src/features/progress/server/resolve-progress-page-organization.ts",
] as const;

describe("authenticated product-shell authority", () => {
  it("loads module access through the membership-scoped authenticated client", () => {
    const loader = read(
      "src/features/product-access/server/load-product-module-access.ts",
    );
    const tasks = read(
      "src/features/tasks/ui/resolve-task-page-organization.ts",
    );
    const home = read("src/app/(authenticated)/home/page.tsx");

    expect(loader).toContain("createSupabaseServerClient");
    expect(loader).toContain("resolveOrganizationContext");
    expect(loader).toContain("OrganizationContextRepository");
    expect(loader).toContain("operatingModelFromTenantActivity");
    expect(loader).toContain("authenticatedClient");
    expect(loader).not.toContain("createSupabaseServiceRoleClient");
    expect(loader).not.toContain("createControlPlaneReaders");
    expect(loader).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(loader).not.toContain("resolvePrimaryBusinessActivityContext");
    expect(tasks).toContain("loadProductModuleAccess(");
    expect(tasks).toContain("supabase");
    expect(tasks).toMatch(
      /loadProductModuleAccess\(\s*selection\.organizationId,\s*supabase,?/,
    );
    const harness = join(
      process.env.TEMP || "",
      "p1d-r1-product",
      "run.mjs",
    );
    if (existsSync(harness)) {
      const harnessSource = readFileSync(harness, "utf8");
      expect(harnessSource).not.toContain(
        "childEnv.SUPABASE_SERVICE_ROLE_KEY = serviceKey",
      );
      expect(harnessSource).toContain('childEnv.SUPABASE_SERVICE_ROLE_KEY = ""');
      expect(harnessSource).toContain("preload.cjs");
      expect(harnessSource).toContain("P1D_R1_ENV_GUARD");
      const preload = join(
        process.env.TEMP || "",
        "p1d-r1-product",
        "preload.cjs",
      );
      if (existsSync(preload)) {
        expect(readFileSync(preload, "utf8")).toContain("env-guard.cjs");
        expect(readFileSync(preload, "utf8")).toContain("guard.cjs");
      }
    }
    expect(home).toContain("createSupabaseServerClient");
    expect(home).toContain("loadDailyOperatingPage");
    expect(home).not.toContain("createSupabaseServiceRoleClient");
  });

  it("does not read organization authority from the query string in the home graph", () => {
    for (const relativePath of HOME_GRAPH) {
      const source = read(relativePath);
      expect(source).not.toContain("createSupabaseServiceRoleClient");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
    const selection = read(
      "src/features/tasks/ui/resolve-task-organization-selection.ts",
    );
    expect(selection).toContain("resolveSelectedOrganization");
    expect(selection).not.toContain("createSupabaseServiceRoleClient");
  });

  it("passes the canonical session client into product resolvers", () => {
    for (const relativePath of PRODUCT_RESOLVERS) {
      const source = read(relativePath);
      expect(source).not.toContain("createSupabaseServiceRoleClient");
      if (relativePath.endsWith("load-member-administration-page.ts")) {
        expect(source).toMatch(
          /loadProductModuleAccess\(\s*organizationId\s*\)/,
        );
        continue;
      }
      expect(source).toMatch(/loadProductModuleAccess\([\s\S]*supabase/);
    }
  });

  it("fail-closes unknown tenant activities and keeps four-target gating", () => {
    expect(
      operatingModelFromTenantActivity({
        displayName: "Courses & Coaching",
        classificationKind: "niche",
      }),
    ).toBe("course_seller");
    expect(
      operatingModelFromTenantActivity({
        displayName: "Agency & Business Services",
        classificationKind: "foundation",
      }),
    ).toBe("service");
    expect(
      operatingModelFromTenantActivity({
        displayName: "Construction & Field Service",
        classificationKind: "foundation",
      }),
    ).toBe("field_operations");
    expect(
      operatingModelFromTenantActivity({
        displayName: "E-commerce & Product Operations",
        classificationKind: "foundation",
      }),
    ).toBe("product_operations");
    expect(
      operatingModelFromTenantActivity({
        displayName: "Foreign Org Pack",
        classificationKind: "foundation",
      }),
    ).toBeNull();

    expect(operatingModelNavVisibility("course_seller")).toEqual(
      KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
    );
    expect(operatingModelNavVisibility("service")).toEqual(
      SERVICE_MODULE_NAV_VISIBILITY,
    );
    expect(operatingModelNavVisibility("field_operations")).toEqual(
      FIELD_MODULE_NAV_VISIBILITY,
    );

    const product = buildOperatingModelProductModuleAccess("product_operations");
    expect(product.resolution).toBe("resolved");
    expect(product.navVisibility.products).toBe(true);
    expect(product.navVisibility.programs).toBe(false);
    expect(product.navVisibility.projects).toBe(false);
    expect(product.navVisibility.tasks).toBe(true);
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "programs",
        access: product,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "products",
        access: product,
      }).allowed,
    ).toBe(true);

    const service = buildOperatingModelProductModuleAccess("service");
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "programs",
        access: service,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "projects",
        access: service,
      }).allowed,
    ).toBe(true);
  });
});

describe("product-shell elevated credential guard", () => {
  it("rejects service-role credentials without echoing them", () => {
    const secret = "super-secret-service-role-value";
    const result = guard.inspectApplicationEnv({
      SUPABASE_SERVICE_ROLE_KEY: secret,
    });
    expect(result).toEqual({
      ok: false,
      reason: "elevated_credential_rejected",
    });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rejects a signed service-role JWT substituted for the session", () => {
    const payload = Buffer.from(
      JSON.stringify({ role: "service_role", sub: "anon" }),
    ).toString("base64url");
    const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.sig`;
    const result = guard.inspectApplicationEnv({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt,
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(jwt);
  });

  it("allows an authenticated user session environment", () => {
    const payload = Buffer.from(
      JSON.stringify({ role: "authenticated", sub: "user-1" }),
    ).toString("base64url");
    const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.sig`;
    expect(
      guard.inspectApplicationEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54441",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt,
      }).ok,
    ).toBe(true);
  });

  it("is mutation-sensitive when a service-role key is assigned later", () => {
    const env: Record<string, string | undefined> = {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54441",
    };
    const onReject = vi.fn();
    const installed = guard.installApplicationEnvGuard(env, { onReject });
    expect(installed.ok).toBe(true);
    env.SUPABASE_SERVICE_ROLE_KEY = "assigned-after-start";
    expect(onReject).toHaveBeenCalledWith({
      ok: false,
      reason: "elevated_credential_rejected",
    });
  });
});

describe("unresolved access remains fail-closed", () => {
  it("does not fall back to Course Seller modules", () => {
    expect(FAIL_CLOSED_MODULE_NAV_VISIBILITY.programs).toBe(false);
    expect(FAIL_CLOSED_MODULE_NAV_VISIBILITY.leads).toBe(false);
    expect(FAIL_CLOSED_MODULE_NAV_VISIBILITY.home).toBe(true);
  });
});
