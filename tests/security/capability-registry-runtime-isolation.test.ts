import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const CAPABILITY_TOKEN =
  /\bpublic\.capabilities\b|\bcapability_dependencies\b|\bcapability_readiness\b|\bcapability_key\b/;

const PROTECTED_PATHS = [
  "src/features/auth",
  "src/features/organizations/server/resolve-organization-context.ts",
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
    normalized.startsWith("src/features/control-plane/")
  );
}

function collectHits(paths: string[]): string[] {
  const hits: string[] = [];
  for (const filePath of paths) {
    const contents = readFileSync(filePath, "utf8");
    if (CAPABILITY_TOKEN.test(contents)) {
      hits.push(relative(process.cwd(), filePath).replaceAll("\\", "/"));
    }
  }
  return hits.sort();
}

describe("CAP-1B capability runtime isolation", () => {
  it("does not introduce capability table consumers under src/ outside the control-plane reader", () => {
    const srcRoot = join(process.cwd(), "src");
    const hits = collectHits(walkFiles(srcRoot)).filter(
      (path) => !isAuthorizedConsumer(path),
    );
    expect(hits).toEqual([]);
  });

  it("leaves protected Closed Beta surfaces free of capability identifiers", () => {
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

  it("does not add capability FKs onto organizations in capability migrations", () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    const hits: string[] = [];
    for (const name of readdirSync(migrationsDir)) {
      if (!name.includes("capability")) {
        continue;
      }
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      if (/\borganization_id\b/.test(sql) || /alter table public\.organizations/i.test(sql)) {
        hits.push(name);
      }
    }
    expect(hits).toEqual([]);
  });

  it("does not change TAX-1, Social entitlement, or execution-gate identifiers", () => {
    const schema = readFileSync(
      join(process.cwd(), "supabase/migrations/20260824180000_create_capability_registry.sql"),
      "utf8",
    );
    const seed = readFileSync(
      join(process.cwd(), "supabase/migrations/20260824180010_seed_capability_registry_cap1.sql"),
      "utf8",
    );
    const combined = `${schema}\n${seed}`;
    expect(combined).not.toContain("insert into public.taxonomy_");
    expect(combined).not.toContain("update public.taxonomy_");
    expect(combined).not.toContain("social_closed_beta_enrollments");
    expect(combined).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(combined).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(combined).not.toContain("INVITATIONS_ENABLED");
    expect(combined).not.toContain("PUBLIC_REGISTRATION_ENABLED");
  });
});
