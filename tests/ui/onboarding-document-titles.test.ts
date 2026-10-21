import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as onboardingLayoutMetadataExport } from "@/app/onboarding/layout";
import {
  ONBOARDING_DOCUMENT_TITLE_BRAND,
  ONBOARDING_DOCUMENT_TITLE_DEFAULT,
  ONBOARDING_DOCUMENT_TITLE_DEFAULT_SEGMENT,
  ONBOARDING_DOCUMENT_TITLE_TEMPLATE,
  ONBOARDING_ROUTE_TITLES,
  onboardingLayoutMetadata,
  onboardingPageMetadata,
  resolveOnboardingPageDocumentTitle,
  type OnboardingRoute,
} from "@/features/onboarding/onboarding-document-titles";
import {
  AUTHENTICATED_DOCUMENT_TITLE_DEFAULT,
  AUTHENTICATED_IN_SCOPE_ROUTE_TITLES,
  applyAuthenticatedTitleTemplate,
} from "@/features/workspace/authenticated-document-titles";

const REPO_ROOT = path.resolve(__dirname, "../..");
const APP_ROOT = path.join(REPO_ROOT, "src/app");
const ONBOARDING_APP_ROOT = path.join(APP_ROOT, "onboarding");
const ONBOARDING_TITLES_MODULE = path.join(
  REPO_ROOT,
  "src/features/onboarding/onboarding-document-titles.ts",
);
const ONBOARDING_FEATURE_ROOT = path.join(REPO_ROOT, "src/features/onboarding");

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

function toOnboardingRoute(file: string): string {
  const rel = path.relative(APP_ROOT, file).replaceAll("\\", "/");
  const withoutPage = rel.replace(/\/page\.tsx$/, "");
  return `/${withoutPage}`;
}

function countBrandSuffix(title: string): number {
  return title.split(ONBOARDING_DOCUMENT_TITLE_BRAND).length - 1;
}

const STAGE_TITLES: Array<[OnboardingRoute, string]> = [
  ["/onboarding", "Set up workspace | ZyntixAI"],
  ["/onboarding/operating-model", "Choose operating model | ZyntixAI"],
  ["/onboarding/team", "Invite your team | ZyntixAI"],
  ["/onboarding/workspace-confirmation", "Confirm workspace | ZyntixAI"],
  ["/onboarding/creating", "Creating workspace | ZyntixAI"],
  ["/onboarding/ready", "Workspace ready | ZyntixAI"],
];

describe("onboarding document titles (CB-VIS-1-R4-B)", () => {
  const onboardingPages = walkFiles(ONBOARDING_APP_ROOT, (file) =>
    file.endsWith(`${path.sep}page.tsx`),
  );
  const onboardingRoutes = onboardingPages.map(toOnboardingRoute);

  it("exports an onboarding-only title template and setup default", () => {
    expect(ONBOARDING_DOCUMENT_TITLE_TEMPLATE).toBe("%s | ZyntixAI");
    expect(ONBOARDING_DOCUMENT_TITLE_DEFAULT_SEGMENT).toBe("Set up workspace");
    expect(ONBOARDING_DOCUMENT_TITLE_DEFAULT).toBe("Set up workspace | ZyntixAI");
    expect(onboardingLayoutMetadata()).toEqual({
      title: {
        default: "Set up workspace | ZyntixAI",
        template: "%s | ZyntixAI",
      },
    });
    expect(onboardingLayoutMetadataExport).toEqual(onboardingLayoutMetadata());
  });

  it("discovers every onboarding page and assigns a deliberate semantic title", () => {
    const contracted = Object.keys(ONBOARDING_ROUTE_TITLES).sort();
    const fromTree = [...onboardingRoutes].sort();
    const uniqueContracted = new Set(contracted);

    expect(fromTree.length).toBeGreaterThan(0);
    expect(fromTree).toEqual(contracted);
    expect(uniqueContracted.size).toBe(contracted.length);

    const layout = readFileSync(path.join(ONBOARDING_APP_ROOT, "layout.tsx"), "utf8");
    expect(layout).toContain("export const metadata = onboardingLayoutMetadata();");
    expect(layout).toContain("return children;");
    expect(layout).not.toMatch(/generateMetadata/);
    expect(layout).not.toMatch(/redirect\(/);
    expect(layout).not.toMatch(/createSupabase/);
  });

  it("wires every onboarding page to a static stage title with a single brand suffix", () => {
    expect(countBrandSuffix(ONBOARDING_DOCUMENT_TITLE_DEFAULT)).toBe(1);
    expect(countBrandSuffix(ONBOARDING_DOCUMENT_TITLE_TEMPLATE)).toBe(1);

    for (const file of onboardingPages) {
      const route = toOnboardingRoute(file) as OnboardingRoute;
      const source = readFileSync(file, "utf8");
      expect(source).toContain(
        `export const metadata = onboardingPageMetadata("${route}");`,
      );
      expect(source).not.toMatch(/generateMetadata/);
      expect(source).not.toMatch(/document\.title/);
      expect(onboardingPageMetadata(route)).toEqual({
        title: ONBOARDING_ROUTE_TITLES[route],
      });

      const resolved = resolveOnboardingPageDocumentTitle(route);
      expect(countBrandSuffix(resolved)).toBe(1);
      expect(resolved.endsWith(" | ZyntixAI")).toBe(true);
      expect(resolved).not.toContain("ZyntixAI | ZyntixAI");
      expect(ONBOARDING_ROUTE_TITLES[route]).not.toContain("ZyntixAI");
    }

    for (const [route, expected] of STAGE_TITLES) {
      expect(resolveOnboardingPageDocumentTitle(route)).toBe(expected);
    }
  });

  it("keeps onboarding stage titles privacy-safe", () => {
    for (const segment of Object.values(ONBOARDING_ROUTE_TITLES)) {
      expect(segment).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
      expect(segment).not.toContain("@");
      expect(segment).not.toContain("[");
      expect(segment).not.toContain("?");
      expect(segment.toLowerCase()).not.toContain("email");
    }
  });

  it("does not fetch data or assign document.title to build onboarding titles", () => {
    const titlesSource = readFileSync(ONBOARDING_TITLES_MODULE, "utf8");
    expect(titlesSource).not.toMatch(/supabase/i);
    expect(titlesSource).not.toMatch(/\bfetch\s*\(/);
    expect(titlesSource).not.toMatch(/createSupabase/);
    expect(titlesSource).not.toMatch(/cookies\s*\(/);
    expect(titlesSource).not.toMatch(/headers\s*\(/);
    expect(titlesSource).not.toMatch(/generateMetadata/);
    expect(titlesSource).not.toMatch(/document\.title/);
    expect(titlesSource).not.toMatch(/useEffect/);

    const onboardingAppFiles = walkFiles(
      ONBOARDING_APP_ROOT,
      (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
    );
    for (const file of onboardingAppFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/document\.title\s*=/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/generateMetadata/);
    }
  });

  it("does not change onboarding lifecycle, redirects, or visible copy for titles", () => {
    for (const file of onboardingPages) {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(REPO_ROOT, file);
      expect(source, relative).toMatch(
        /readOnboardingContext|resolveOnboardingOrganizationId|resolveOrganizationOnboardingLifecycle/,
      );
      expect(source, relative).toMatch(/redirect\(/);
      expect(source, relative).toContain('export const dynamic = "force-dynamic"');

      const remainder = source
        .replace(
          /import \{ onboardingPageMetadata \} from "@\/features\/onboarding\/onboarding-document-titles";\r?\n/,
          "",
        )
        .replace(/export const metadata = onboardingPageMetadata\("[^"]+"\);\r?\n/, "");
      expect(remainder, relative).not.toMatch(/onboardingPageMetadata/);
      expect(remainder, relative).not.toMatch(/export const metadata/);
    }

    const featureFiles = walkFiles(
      ONBOARDING_FEATURE_ROOT,
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(`${path.sep}onboarding-document-titles.ts`),
    );
    for (const file of featureFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/onboardingPageMetadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/onboardingLayoutMetadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/document\.title\s*=/);
    }
  });

  it("leaves public, login, invite, and R4-A authenticated titles unchanged", () => {
    const rootLayout = readFileSync(path.join(APP_ROOT, "layout.tsx"), "utf8");
    expect(rootLayout).toContain('title: "ZyntixAI"');
    expect(rootLayout).not.toContain("ONBOARDING_DOCUMENT_TITLE_TEMPLATE");

    const login = readFileSync(path.join(APP_ROOT, "login/page.tsx"), "utf8");
    expect(login).not.toMatch(/export const metadata/);

    const invite = readFileSync(path.join(APP_ROOT, "invite/accept/page.tsx"), "utf8");
    expect(invite).toContain('title: "Invitation | ZyntixAI"');

    expect(AUTHENTICATED_DOCUMENT_TITLE_DEFAULT).toBe("Workspace | ZyntixAI");
    expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES["/customers"]).toBe("Customers");
    expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES["/projects"]).toBe("Projects");
    expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES["/home"]).toBe("Home");
    expect(() => applyAuthenticatedTitleTemplate("Set up workspace | ZyntixAI")).toThrow(
      /delimiter/,
    );
  });
});
