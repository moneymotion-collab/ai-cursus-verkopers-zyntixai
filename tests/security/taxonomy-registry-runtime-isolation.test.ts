import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const TAXONOMY_TOKEN =
  /\btaxonomy_(?:releases|foundations|industries|niches|specializations|deep_specializations|aliases)\b/;

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
    if (TAXONOMY_TOKEN.test(contents)) {
      hits.push(relative(process.cwd(), filePath).replaceAll("\\", "/"));
    }
  }
  return hits.sort();
}

describe("TAX-1B taxonomy runtime isolation", () => {
  it("does not introduce taxonomy table consumers under src/ outside the control-plane reader", () => {
    const srcRoot = join(process.cwd(), "src");
    const hits = collectHits(walkFiles(srcRoot)).filter(
      (path) => !isAuthorizedConsumer(path),
    );
    expect(hits).toEqual([]);
  });

  it("leaves protected Closed Beta surfaces free of taxonomy identifiers", () => {
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

  it("does not add taxonomy FKs onto organizations in any migration", () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    const hits: string[] = [];
    for (const name of readdirSync(migrationsDir)) {
      if (!name.includes("taxonomy")) {
        continue;
      }
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      if (/\borganization_id\b/.test(sql) || /alter table public\.organizations/i.test(sql)) {
        hits.push(name);
      }
    }
    expect(hits).toEqual([]);
  });
});
