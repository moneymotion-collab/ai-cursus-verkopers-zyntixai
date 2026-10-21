import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PACKAGE_JSON = join(process.cwd(), "package.json");
const LEADS_ROOT = join(process.cwd(), "src/features/leads");
const LEADS_ROUTES = join(process.cwd(), "src/app/(authenticated)/leads");

function readTreeSource(root: string): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  };
  walk(root);
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

describe("leads scope boundary", () => {
  const leadsSource = `${readTreeSource(LEADS_ROOT)}\n${readTreeSource(LEADS_ROUTES)}`;
  const packageJson = readFileSync(PACKAGE_JSON, "utf8");

  it("does not add pipeline administration, bulk, import/export or delete flows", () => {
    expect(leadsSource).not.toMatch(/pipeline-stage-admin/i);
    expect(leadsSource).not.toMatch(/bulkArchive/i);
    expect(leadsSource).not.toMatch(/importLeads/i);
    expect(leadsSource).not.toMatch(/exportLeads/i);
    expect(leadsSource).not.toMatch(/deleteLead/i);
    expect(leadsSource).not.toMatch(/permanently delete/i);
  });

  it("does not add social, dashboard, programs, progress or AI surfaces", () => {
    expect(leadsSource).not.toMatch(/social media/i);
    expect(leadsSource).not.toMatch(/dashboard/i);
    expect(leadsSource).not.toMatch(/enrollment/i);
    expect(leadsSource).not.toMatch(/progress tracking/i);
    expect(leadsSource).not.toMatch(/openai/i);
  });

  it("keeps Next as the application runtime and does not pull Cursor SDK into app deps", () => {
    expect(packageJson).toContain('"next"');
    expect(packageJson).not.toMatch(/"@cursor\//);
    const parsed = JSON.parse(packageJson) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(parsed.dependencies?.["@playwright/test"]).toBeUndefined();
    // Authorized browser-QA harness only (B1-C1-R1).
    expect(parsed.devDependencies?.["@playwright/test"]).toBeTruthy();
  });
});
