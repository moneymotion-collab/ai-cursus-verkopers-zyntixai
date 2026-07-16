import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTE_ROOT = join(process.cwd(), "src/app/(authenticated)/leads");

const EXPECTED_ROUTES = [
  "page.tsx",
  "new/page.tsx",
  "[leadId]/page.tsx",
  "[leadId]/edit/page.tsx",
  "[leadId]/stage/page.tsx",
  "[leadId]/status/page.tsx",
  "[leadId]/convert/page.tsx",
  "[leadId]/archive/page.tsx",
  "[leadId]/restore/page.tsx",
];

const FORBIDDEN_ROUTES = [
  "[leadId]/delete/page.tsx",
  "[leadId]/import/page.tsx",
  "[leadId]/export/page.tsx",
  "pipeline-stages/page.tsx",
];

describe("leads route integrity", () => {
  for (const route of EXPECTED_ROUTES) {
    it(`includes ${route}`, () => {
      expect(existsSync(join(ROUTE_ROOT, route))).toBe(true);
    });
  }

  for (const route of FORBIDDEN_ROUTES) {
    it(`does not include ${route}`, () => {
      expect(existsSync(join(ROUTE_ROOT, route))).toBe(false);
    });
  }

  it("keeps activeNav=leads on workflow pages", () => {
    for (const route of EXPECTED_ROUTES.filter((path) => path.endsWith("page.tsx"))) {
      const source = readFileSync(join(ROUTE_ROOT, route), "utf8");
      expect(source).toContain('activeNav="leads"');
    }
  });
});
