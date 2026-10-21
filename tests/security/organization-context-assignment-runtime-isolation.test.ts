import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ORG_CONTEXT_TOKEN =
  /\borganization_business_activities\b|\borganization_context_assignments\b|\borganization_context_assignment_events\b/;

const PROTECTED_PATHS = [
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
  "src/components/app-shell.tsx",
  "src/features/onboarding",
  "src/features/social-media",
  "src/features/support",
  "src/features/control-plane",
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

function isAuthorizedConsumer(relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/");
  return (
    normalized === "src/types/database.generated.ts" ||
    normalized.startsWith("src/features/org-context/")
  );
}

function collectHits(paths: string[]): string[] {
  const hits: string[] = [];
  for (const filePath of paths) {
    const contents = readFileSync(filePath, "utf8");
    if (ORG_CONTEXT_TOKEN.test(contents)) {
      hits.push(relative(process.cwd(), filePath).replaceAll("\\", "/"));
    }
  }
  return hits.sort();
}

describe("ORG-CONTEXT runtime isolation", () => {
  it("authorizes only generated types and the org-context feature as table consumers", () => {
    expect(existsSync(join(process.cwd(), "src/features/org-context"))).toBe(
      true,
    );
    const generated = readFileSync(
      join(process.cwd(), "src/types/database.generated.ts"),
      "utf8",
    );
    expect(generated).toMatch(ORG_CONTEXT_TOKEN);
    const srcRoot = join(process.cwd(), "src");
    expect(
      collectHits(walkFiles(srcRoot)).filter((path) => !isAuthorizedConsumer(path)),
    ).toEqual([]);
  });

  it("leaves Closed Beta product surfaces free of ORG-CONTEXT identifiers", () => {
    const files: string[] = [];
    for (const relativePath of PROTECTED_PATHS) {
      const absolute = join(process.cwd(), relativePath);
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        files.push(...walkFiles(absolute));
      } else {
        files.push(absolute);
      }
    }
    expect(collectHits(files)).toEqual([]);
  });

  it("fails if the Ready loader reintroduces a direct organization-context table read", () => {
    const readyPath = join(
      process.cwd(),
      "src/features/onboarding/server/onboarding-ready.ts",
    );
    const ready = readFileSync(readyPath, "utf8");
    expect(ORG_CONTEXT_TOKEN.test(ready)).toBe(false);
    expect(ready).not.toMatch(
      /\.from\(["']organization_business_activities["']\)/,
    );
    expect(ready).not.toContain("createSupabaseServiceRoleClient");
    expect(ready).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    const mutated = `${ready}\nvoid client.from("organization_business_activities");\n`;
    expect(ORG_CONTEXT_TOKEN.test(mutated)).toBe(true);
    expect(
      isAuthorizedConsumer("src/features/onboarding/server/onboarding-ready.ts"),
    ).toBe(false);
    expect(
      collectHits([readyPath]).filter((path) => !isAuthorizedConsumer(path)),
    ).toEqual([]);
  });

  it("does not skip, focus, or exclude this isolation authority", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "tests/security/organization-context-assignment-runtime-isolation.test.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/\bit\.skip\(/);
    expect(source).not.toMatch(/\bdescribe\.skip\(/);
    expect(source).not.toMatch(/\bit\.only\(/);
    expect(source).not.toMatch(/\bdescribe\.only\(/);
    expect(PROTECTED_PATHS).toContain("src/features/onboarding");
  });

  it("does not alter Social, onboarding RPCs, or organizations in ORG-CONTEXT migrations", () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    for (const name of readdirSync(migrationsDir)) {
      if (!name.includes("organization_context_assignment")) {
        continue;
      }
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      expect(sql).not.toContain("social_closed_beta_enrollments");
      expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
      expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
      expect(sql).not.toContain("apply_organization_onboarding");
      expect(sql).not.toMatch(/alter table public\.organizations/i);
      expect(sql).not.toMatch(/update public\.organizations/i);
      expect(sql).not.toMatch(/insert into public\.organizations/i);
    }
  });
});
