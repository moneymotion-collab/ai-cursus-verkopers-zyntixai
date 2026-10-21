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
  AUTHENTICATED_SOCIAL_ROUTES,
  applyAuthenticatedTitleTemplate,
  authenticatedLayoutMetadata,
  authenticatedPageMetadata,
  isAuthenticatedSocialRoute,
  resolveAuthenticatedPageDocumentTitle,
  type AuthenticatedInScopeRoute,
  type AuthenticatedSocialRoute,
} from "@/features/workspace/authenticated-document-titles";

const REPO_ROOT = path.resolve(__dirname, "../..");
const AUTHENTICATED_APP_ROOT = path.join(REPO_ROOT, "src/app/(authenticated)");
const APP_ROOT = path.join(REPO_ROOT, "src/app");
const TITLES_MODULE = path.join(
  REPO_ROOT,
  "src/features/workspace/authenticated-document-titles.ts",
);
const SOCIAL_FEATURE_ROOT = path.join(REPO_ROOT, "src/features/social-media");

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

const R4A_REPRESENTATIVE_TITLES: Array<[AuthenticatedInScopeRoute, string]> = [
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

const SOCIAL_SEMANTIC_TITLES: Array<[AuthenticatedSocialRoute, string]> = [
  ["/social", "Social | ZyntixAI"],
  ["/social/lifecycle", "Social activity | ZyntixAI"],
  ["/social/b18-instagram-publish", "Social publish | ZyntixAI"],
  ["/social/r1-instagram-connect", "Social accounts | ZyntixAI"],
  ["/operator/social-beta", "Social closed beta | ZyntixAI"],
  ["/operator/social-beta/[organizationId]", "Social closed beta organization | ZyntixAI"],
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
  ["/operator/social-beta/[organizationId]", "Social closed beta organization"],
];

describe("authenticated document titles (CB-VIS-1-R4-A / R4-B)", () => {
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

  it("classifies every authenticated page with a route-specific title", () => {
    const contracted = Object.keys(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES).sort();
    const fromTree = [...authenticatedRoutes].sort();
    const uniqueContracted = new Set(contracted);

    expect(fromTree).toHaveLength(78);
    expect(contracted).toHaveLength(78);
    expect(uniqueContracted.size).toBe(78);
    expect(fromTree).toEqual(contracted);

    const titlesSource = readFileSync(TITLES_MODULE, "utf8");
    expect(titlesSource).not.toContain("AUTHENTICATED_OUT_OF_SCOPE_SOCIAL_ROUTES");
    expect(titlesSource).not.toContain("isAuthenticatedOutOfScopeSocialRoute");
  });

  it("wires every authenticated page to static metadata so none rely on the Workspace default", () => {
    for (const file of authenticatedPages) {
      const route = toAuthenticatedRoute(file);
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/generateMetadata/);
      expect(source).not.toMatch(/document\.title/);
      expect(source).toContain(
        `export const metadata = authenticatedPageMetadata("${route}");`,
      );
      expect(authenticatedPageMetadata(route as AuthenticatedInScopeRoute)).toEqual({
        title: AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route as AuthenticatedInScopeRoute],
      });
      expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route as AuthenticatedInScopeRoute]).not.toBe(
        AUTHENTICATED_DOCUMENT_TITLE_DEFAULT_SEGMENT,
      );
    }
  });

  it("gives the six Social routes semantic titles through the authenticated template", () => {
    expect(AUTHENTICATED_SOCIAL_ROUTES).toHaveLength(6);
    expect([...AUTHENTICATED_SOCIAL_ROUTES].sort()).toEqual(
      authenticatedRoutes.filter((route) => isAuthenticatedSocialRoute(route)).sort(),
    );

    for (const [route, expected] of SOCIAL_SEMANTIC_TITLES) {
      expect(isAuthenticatedSocialRoute(route)).toBe(true);
      expect(resolveAuthenticatedPageDocumentTitle(route)).toBe(expected);
      expect(countBrandSuffix(expected)).toBe(1);
      expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route]).not.toContain("ZyntixAI");
      expect(AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route]).not.toContain("|");
    }
  });

  it("keeps Social titles generic and leaves Social rendering files free of title metadata", () => {
    for (const route of AUTHENTICATED_SOCIAL_ROUTES) {
      const segment = AUTHENTICATED_IN_SCOPE_ROUTE_TITLES[route];
      expect(segment).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
      expect(segment).not.toContain("@");
      expect(segment).not.toContain("[");
      expect(segment).not.toContain("?");
      expect(segment.toLowerCase()).not.toContain("instagram.com");
    }

    const socialAppFiles = [
      ...walkFiles(path.join(AUTHENTICATED_APP_ROOT, "social"), () => true),
      ...walkFiles(path.join(AUTHENTICATED_APP_ROOT, "operator"), () => true),
    ];
    for (const file of socialAppFiles) {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(REPO_ROOT, file);
      if (file.endsWith(`${path.sep}page.tsx`)) {
        const remainder = source
          .replace(
            /import \{ authenticatedPageMetadata \} from "@\/features\/workspace\/authenticated-document-titles";\r?\n/,
            "",
          )
          .replace(/export const metadata = authenticatedPageMetadata\("[^"]+"\);\r?\n/, "");
        expect(remainder, relative).not.toMatch(/generateMetadata/);
        expect(remainder, relative).not.toMatch(/document\.title/);
        expect(remainder, relative).not.toMatch(/authenticatedPageMetadata/);
        expect(remainder, relative).not.toMatch(/export const metadata/);
        continue;
      }
      expect(source, relative).not.toMatch(/authenticatedPageMetadata/);
      expect(source, relative).not.toMatch(/generateMetadata/);
      expect(source, relative).not.toMatch(/document\.title/);
    }

    const socialFeatureFiles = walkFiles(
      SOCIAL_FEATURE_ROOT,
      (file) => file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".css"),
    );
    for (const file of socialFeatureFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/authenticatedPageMetadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/generateMetadata/);
      expect(source, path.relative(REPO_ROOT, file)).not.toMatch(/document\.title\s*=/);
    }
  });

  it("preserves R4-A representative list, create, detail, edit, and lifecycle titles", () => {
    for (const [route, expected] of R4A_REPRESENTATIVE_TITLES) {
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

  it("leaves root, login, and invite title behaviour unchanged", () => {
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
  });

  it("rejects blank or already-suffixed title segments", () => {
    expect(() => applyAuthenticatedTitleTemplate("")).toThrow(/blank/);
    expect(() => applyAuthenticatedTitleTemplate("Home | ZyntixAI")).toThrow(/delimiter/);
    expect(() => applyAuthenticatedTitleTemplate("Home | Acme")).toThrow(/delimiter/);
    expect(() => applyAuthenticatedTitleTemplate("ZyntixAI")).toThrow(/brand suffix/);
  });
});
