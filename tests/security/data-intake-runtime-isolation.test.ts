import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const DATA_TOKEN =
  /\bdata_intake_sessions\b|\bdata_intake_sources\b|\bdata_intake_mappings\b|\bdata_intake_staging_rows\b|\bdata_import_plans\b|\bdata_intake_events\b|\bdata_external_record_links\b|\bdata_import_row_results\b/;

const PROTECTED_PATHS = [
  "src/app/(authenticated)/home",
  "src/components/app-shell.tsx",
  "src/features/auth",
  "src/features/organizations",
  "src/features/invitations",
  "src/features/customers",
  "src/features/leads",
  "src/features/programs",
  "src/features/enrollments",
  "src/features/progress",
  "src/features/tasks",
  "src/features/attention",
  "src/features/nba",
  "src/features/onboarding",
  "src/features/social-media",
  "src/features/support",
  "src/features/control-plane",
  "src/features/org-context",
  "src/features/context-resolver",
  "src/features/business-qualification",
] as const;

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        if (entry === "node_modules" || entry === ".next") continue;
        stack.push(join(current, entry));
      }
      continue;
    }
    if (/\.(ts|tsx|js|jsx|sql|css)$/.test(current)) {
      out.push(current);
    }
  }
  return out;
}

function collectHits(paths: string[]): string[] {
  const hits: string[] = [];
  for (const filePath of paths) {
    const contents = readFileSync(filePath, "utf8");
    if (DATA_TOKEN.test(contents)) {
      hits.push(relative(process.cwd(), filePath).replaceAll("\\", "/"));
    }
  }
  return hits.sort();
}

function isAuthorizedConsumer(relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/");
  return (
    normalized === "src/types/database.generated.ts" ||
    normalized.startsWith("src/features/data-intake/") ||
    normalized.startsWith("supabase/migrations/202608271400") ||
    normalized.startsWith("supabase/migrations/202608271500") ||
    normalized.startsWith("supabase/migrations/2026082716") ||
    normalized.startsWith("supabase/migrations/202608291") ||
    normalized.startsWith("tests/security/data-intake-") ||
    normalized.startsWith("tests/features/data-intake/") ||
    normalized.startsWith("docs/phases/DATA-1")
  );
}

describe("DATA-1C runtime isolation", () => {
  it("authorizes generated Production types and the data-intake server as DATA table consumers", () => {
    const generated = readFileSync(
      join(process.cwd(), "src/types/database.generated.ts"),
      "utf8",
    );
    expect(generated).toMatch(DATA_TOKEN);
    expect(generated).toContain("apply_data_intake_foundation_mutation");
    const srcHits = collectHits(walkFiles(join(process.cwd(), "src"))).filter(
      (path) => !isAuthorizedConsumer(path),
    );
    expect(srcHits).toEqual([]);
  });

  it("does not leak DATA tables into product, BQA, or Context surfaces", () => {
    const hits = collectHits(PROTECTED_PATHS.flatMap((path) => {
      const full = join(process.cwd(), path);
      return existsSync(full) ? walkFiles(full) : [];
    }));
    expect(hits).toEqual([]);
  });

  it("treats generated Production types as typegen output, not a product DATA surface", () => {
    expect(isAuthorizedConsumer("src/types/database.generated.ts")).toBe(true);
    expect(isAuthorizedConsumer("src/features/customers/server/customer-writer.ts")).toBe(
      false,
    );
  });
});
