import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as authenticatedLayoutMetadataExport } from "@/app/(authenticated)/layout";
import {
  AUTHENTICATED_DOCUMENT_TITLE_BRAND,
  AUTHENTICATED_DOCUMENT_TITLE_DEFAULT,
  AUTHENTICATED_DOCUMENT_TITLE_DEFAULT_SEGMENT,
  AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE,
  AUTHENTICATED_IN_SCOPE_ROUTE_TITLES,
  AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES,
  applyAuthenticatedTitleTemplate,
  authenticatedLayoutMetadata,
  authenticatedPageMetadata,
  isAuthenticatedOutOfScopeSocialRoute,
  resolveAuthenticatedPageDocumentTitle,
  type AuthenticatedInScopeRoute,
} from "@/features/workspace/authenticated-document-titles";

const REPO_ROOT = path.resolve(__dirname, "../..");
const AUTHENTICATED_APP_ROOT = path.join(REPO_ROOT, "src/app/(authenticated)");
const APP_ROOT = path.join(REPO_ROOT, "src/app");
const TITLES_MODULE = path.join(
  REPO_ROOT,
  "src/features/workspace/authenticated-document-titles.ts",
);

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

function toAuthenticatedRoute(file: string): string {
  const rel = path.relative(AUTHENTICATED_APP_ROOT, file).replaceAll("\\", "/");
  return `/${rel.replace(/\/page\.tsx$/, "")}`;
}

function countBrandSuffix(title: string): number {
  return title.split(AUTHENTICATED_DOCUMENT_TITLE_BRAND).length - 1;
}

const REPRESENTATIVE_TITLES: Array<[AuthenticatedInScopeRoute, string]> = [
  ["/home", "Home | ZyntixAI"],
  ["/attention", "Attention | ZyntixAI"],
  ["/tasks", "Tasks | ZyntixAI"],
  ["/leads", "Leads | ZyntixAI"],
  ["/customers", "Customers | ZyntixAI"],
  ["/customers/new", "New customer | ZyntixAI"],
  ["/customers/[customerId]", "Customer | ZyntixAI"],
  ["/customers/[customerId]/edit", "Edit customer | ZyntixAI"],
  ["/customers/[customerId]/archive", "Archive customer record | ZyntixAI"],
  ["/customers/[customerId]/restore", "Restore customer record | ZyntixAI"],
  ["/customers/[customerId]/status", "Change customer status | ZyntixAI"],
  ["/projects", "Projects | ZyntixAI"],
  ["/projects/new", "New project | ZyntixAI"],
  ["/projects/[projectId]", "Project | ZyntixAI"],
  ["/projects/[projectId]/edit", "Edit project | ZyntixAI"],
  ["/sites", "Sites | ZyntixAI"],
  ["/sites/new", "New site | ZyntixAI"],
  ["/sites/[siteId]", "Site | ZyntixAI"],
  ["/work-orders", "Work orders | ZyntixAI"],
  ["/dispatch", "Dispatch | ZyntixAI"],
  ["/products", "Products | ZyntixAI"],
  ["/products/new", "New product | ZyntixAI"],
  ["/products/[productId]", "Product | ZyntixAI"],
  ["/products/[productId]/edit", "Edit product | ZyntixAI"],
  ["/orders", "Orders | ZyntixAI"],
  ["/orders/new", "New order | ZyntixAI"],
  ["/orders/[orderId]", "Order | ZyntixAI"],
  ["/inventory", "Inventory | ZyntixAI"],
  ["/fulfillment", "Fulfillment | ZyntixAI"],
];

const DYNAMIC_GENERIC_TITLES: Array<[AuthenticatedInScopeRoute, string]> = [
  ["/customers/[customerId]", "Customer"],
  ["/projects/[projectId]", "Project"],
  ["/sites/[siteId]", "Site"],
  ["/products/[productId]", "Product"],
  ["/orders/[orderId]", "Order"],
  ["/work-orders/[workOrderId]", "Work order"],
  ["/leads/[leadId]", "Lead"],
  ["/tasks/[taskId]", "Task"],
  ["/attention/[attentionItemId]", "Attention item"],
  ["/programs/[programId]", "Program"],
  ["/enrollments/[enrollmentId]", "Enrollment"],
  ["/progress/[factId]", "Progress record"],
  ["/inventory/[productId]/adjust", "Adjust inventory"],
];

describe("authenticated document titles (CB-VIS-1-R4-A)", () => {
  const authenticatedPages = walkFiles(AUTHENTICATED_APP_ROOT, (file) =>
    file.endsWith(`${path.sep}page.tsx`),
  );
  const authenticatedRoutes = authenticatedPages.map(toAuthenticatedRoute);

  it("exports an authenticated-only title template and meaningful default", () => {
    expect(AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE).toBe("%s | ZyntixAI");
    expect(AUTHENTICATED_DOCUMENT_TITLE_DEFAULT_SEGMENT).toBe("Workspace");
    expect(AUTHENTICATED_DOCUMENT_TITLE_DEFAULT).toBe("Workspace | ZyntixAI");
    expect(authenticatedLayoutMetadata()).toEqual({
      title: {
        default: "Workspace | ZyntixAI",
        template: "%s | ZyntixAI",
      },
    });
    expect(authenticatedLayoutMetadataExport).toEqual(authenticatedLayoutMetadata());
  });

  it("does not stack the brand suffix on the layout default or page segments", () => {
    expect(countBrandSuffix(AUTHENTICATED_DOCUMENT_TITLE_DEFAULT)).toBe(1);
    expect(countBrandSuffix(AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE)).toBe(1);

    for (const [route, segment] of Object.entries(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES)) {
      const resolved = resolveAuthenticatedPageDocumentTitle(
        route as AuthenticatedInScopeRoute,
      );
      expect(countBrandSuffix(resolved), route).toBe(1);
      expect(resolved.endsWith(" | ZyntixAI"), route).toBe(true);
      expect(resolved).not.toContain("ZyntixAI | ZyntixAI");
      expect(segment).not.toContain("ZyntixAI");
      expect(segment.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers every authenticated page through a deliberate title contract", () => {
    const inScope = Object.keys(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES).sort();
    const social = [...AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES].sort();
    const fromTree = [...authenticatedRoutes].sort();
    const contracted = [...inScope, ...social].sort();

    expect(fromTree).toEqual(contracted);

    for (const route of fromTree) {
      const socialRoute = isAuthenticatedOutOfScopeSocialRoute(route);
      const inScopeRoute = route in AUTHENTICATED_IN_SCOPE_ROUTE_TITLES;
      expect(socialRoute || inScopeRoute, route).toBe(true);
      expect(socialRoute && inScopeRoute, route).toBe(false);
    }
  });

  it("wires in-scope pages to static metadata and leaves Social on the workspace default", () => {
    for (const file of authenticatedPages) {
      const route = toAuthenticatedRoute(file);
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/generateMetadata/);
      expect(source).not.toMatch(/document\.title/);

      if (isAuthenticatedOutOfScopeSocialRoute(route)) {
        expect(source).not.toMatch(/export const metadata/);
        expect(source).not.toMatch(/authenticatedPageMetadata/);
        continue;
      }

      expect(source).toContain(
        `export const metadata = authenticatedPageMetadata("${route}");`,
      );
      expect(authenticatedPageMetadata(route as AuthenticatedInScopeRoute)).toEqual({
        title: AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route as AuthenticatedInScopeRoute],
      });
    }
  });

  it("resolves representative list, create, detail, edit, and lifecycle titles", () => {
    for (const [route, expected] of REPRESENTATIVE_TITLES) {
      expect(resolveAuthenticatedPageDocumentTitle(route)).toBe(expected);
    }
  });

  it("keeps dynamic titles generic and privacy-safe", () => {
    for (const [route, segment] of DYNAMIC_GENERIC_TITLES) {
      expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route]).toBe(segment);
      expect(resolveAuthenticatedPageDocumentTitle(route)).toBe(`${segment} | ZyntixAI`);
      expect(segment).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
      expect(segment).not.toContain("@");
      expect(segment).not.toMatch(/\{/);
      expect(segment).not.toContain("[");
    }

    expect(AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES).toContain(
      "/operator/social-beta/[organizationId]",
    );
    expect(AUTHENTICATED_DOCUMENT_TITLE_DEFAULT).toBe("Workspace | ZyntixAI");

    for (const segment of Object.values(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES)) {
      expect(segment).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
      expect(segment).not.toContain("@");
      expect(segment).not.toContain("[");
      expect(segment).not.toContain("?");
    }
  });

  it("does not fetch data to build titles and does not assign document.title", () => {
    const titlesSource = readFileSync(TITLES_MODULE, "utf8");
    expect(titlesSource).not.toMatch(/supabase/i);
    expect(titlesSource).not.toMatch(/\bfetch\s*\(/);
    expect(titlesSource).not.toMatch(/createSupabase/);
    expect(titlesSource).not.toMatch(/cookies\s*\(/);
    expect(titlesSource).not.toMatch(/headers\s*\(/);
    expect(titlesSource).not.toMatch(/generateMetadata/);
    expect(titlesSource).not.toMatch(/document\.title/);
    expect(titlesSource).not.toMatch(/useEffect/);

    const appSources = walkFiles(APP_ROOT, (file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    for (const file of appSources) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/document\.title\s*=/);
    }
  });

  it("leaves root, login, invite, and onboarding title behaviour unchanged", () => {
    const rootLayout = readFileSync(path.join(APP_ROOT, "layout.tsx"), "utf8");
    expect(rootLayout).toContain('title: "ZyntixAI"');
    expect(rootLayout).not.toContain("AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE");
    expect(rootLayout).not.toContain("title.template");
    expect(rootLayout).not.toMatch(/template:\s*"%s \| ZyntixAI"/);

    const login = readFileSync(path.join(APP_ROOT, "login/page.tsx"), "utf8");
    expect(login).not.toMatch(/export const metadata/);
    expect(login).not.toMatch(/generateMetadata/);

    const invite = readFileSync(path.join(APP_ROOT, "invite/accept/page.tsx"), "utf8");
    expect(invite).toContain('title: "Invitation | ZyntixAI"');
    expect(invite).not.toContain("authenticatedPageMetadata");
    expect(invite).not.toContain("authenticatedLayoutMetadata");

    const onboardingPages = walkFiles(path.join(APP_ROOT, "onboarding"), (file) =>
      file.endsWith(`${path.sep}page.tsx`),
    );
    expect(onboardingPages.length).toBeGreaterThan(0);
    for (const file of onboardingPages) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/export const metadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/generateMetadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/authenticatedPageMetadata/);
    }
  });

  it("rejects blank or already-suffixed title segments", () => {
    expect(() => applyAuthenticatedTitleTemplate("")).toThrow(/blank/);
    expect(() => applyAuthenticatedTitleTemplate("Home | ZyntixAI")).toThrow(/delimiter/);
    expect(() => applyAuthenticatedTitleTemplate("Home | Acme")).toThrow(/delimiter/);
    expect(() => applyAuthenticatedTitleTemplate("ZyntixAI")).toThrow(/brand suffix/);
  });
});
