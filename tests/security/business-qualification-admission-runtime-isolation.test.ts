import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const BQA_TOKEN =
  /\bbusiness_activity_qualifications\b|\bbusiness_activity_qualification_answers\b|\bbusiness_activity_classification_decisions\b|\bbusiness_activity_support_assessments\b|\bbusiness_activity_admission_decisions\b|\bbusiness_activity_qualification_events\b|\bbusiness_activity_demand_signals\b/;

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
] as const;

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        if (entry === "node_modules" || entry === ".next") {
          continue;
        }
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
    if (BQA_TOKEN.test(contents)) {
      hits.push(relative(process.cwd(), filePath).replaceAll("\\", "/"));
    }
  }
  return hits.sort();
}

describe("BQA-1C runtime isolation", () => {
  it("does not introduce a product or generated-type BQA consumer", () => {
    expect(existsSync(join(process.cwd(), "src/features/bqa"))).toBe(false);
    const generated = readFileSync(
      join(process.cwd(), "src/types/database.generated.ts"),
      "utf8",
    );
    expect(generated).not.toMatch(BQA_TOKEN);
    const srcRoot = join(process.cwd(), "src");
    expect(collectHits(walkFiles(srcRoot))).toEqual([]);
  });

  it("leaves Home, AppShell, onboarding, CRM, Knowledge, Social, Tasks, and Attention free of BQA identifiers", () => {
    const files: string[] = [];
    for (const relativePath of PROTECTED_PATHS) {
      const absolute = join(process.cwd(), relativePath);
      if (!existsSync(absolute)) {
        continue;
      }
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        files.push(...walkFiles(absolute));
      } else {
        files.push(absolute);
      }
    }
    expect(collectHits(files)).toEqual([]);
  });

  it("does not alter Social, onboarding RPCs, invitations, or organizations in BQA migrations", () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    for (const name of readdirSync(migrationsDir)) {
      if (!name.includes("business_qualification_admission")) {
        continue;
      }
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      expect(sql).not.toContain("social_closed_beta_enrollments");
      expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
      expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
      expect(sql).not.toContain("apply_organization_onboarding");
      expect(sql).not.toContain("organization_invitations");
      expect(sql).not.toMatch(/alter table public\.organizations/i);
      expect(sql).not.toMatch(/^\s*update public\.organizations/im);
      expect(sql).not.toMatch(/^\s*insert into public\.organizations/im);
      expect(sql).not.toMatch(
        /^\s*insert into public\.organization_context_assignments/im,
      );
      expect(sql).not.toMatch(
        /^\s*update public\.organization_business_activities/im,
      );
    }
  });
});
