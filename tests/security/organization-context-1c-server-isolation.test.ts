import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SERVER_DIR = join(ROOT, "src/features/org-context/server");
const DOMAIN_DIR = join(ROOT, "src/features/org-context/domain");
const CLIENT =
  "src/features/org-context/server/org-context-client.ts";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return [full];
  });
}

describe("ORG-CONTEXT-1C server-only isolation", () => {
  it("marks every privileged server module as server-only", () => {
    const files = walk(SERVER_DIR).filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain('import "server-only"');
    }
  });

  it("reuses the existing factory from the client boundary only", () => {
    const client = readFileSync(join(ROOT, CLIENT), "utf8");
    expect(client).toContain("createSupabaseServiceRoleClient");
    expect(client).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    const otherServer = walk(SERVER_DIR)
      .filter((file) => file.endsWith(".ts") && !file.endsWith("org-context-client.ts"))
      .map((file) => readFileSync(file, "utf8"));
    for (const source of otherServer) {
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
      expect(source).not.toContain("createSupabaseServiceRoleClient");
    }
  });

  it("does not create a public API, client hook, or browser module", () => {
    const appDir = join(ROOT, "src/app");
    const hits: string[] = [];
    for (const file of walk(appDir)) {
      if (!/\.(ts|tsx)$/.test(file)) {
        continue;
      }
      const source = readFileSync(file, "utf8");
      if (
        source.includes("features/org-context") ||
        file.replaceAll("\\", "/").includes("api/org-context") ||
        file.replaceAll("\\", "/").includes("api/business-activities")
      ) {
        hits.push(relative(ROOT, file).replaceAll("\\", "/"));
      }
    }
    expect(hits).toEqual([]);
    expect(existsSync(join(ROOT, "src/features/org-context/index.ts"))).toBe(false);
    for (const file of walk(join(ROOT, "src/features/org-context"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("use client");
      expect(source).not.toMatch(/\buse[A-Z]\w+\(/);
      expect(source).not.toContain("createSupabaseBrowserClient");
    }
  });

  it("does not wire onboarding, BQA, Social, AppShell, or entitlement", () => {
    for (const file of walk(join(ROOT, "src/features/org-context"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("apply_organization_onboarding");
      expect(source).not.toMatch(/\bbqa\b/);
      expect(source).not.toContain("features/social-media");
      expect(source).not.toContain("app-shell");
      expect(source).not.toContain("enabled_capabilities");
      expect(source).not.toContain("effectiveCapabilities");
    }
  });

  it("does not use generic table names or arbitrary RPC names", () => {
    for (const file of walk(SERVER_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/\.from\(\s*userInput|\.from\(\s*tableName|\.from\(\s*name\s*\)/);
      expect(source).not.toMatch(/\.rpc\(\s*[a-z][a-zA-Z0-9_]*\s*,/);
    }
    expect(
      readFileSync(
        join(ROOT, "src/features/org-context/server/organization-context-rpc.ts"),
        "utf8",
      ),
    ).toContain("ORG_CONTEXT_PLATFORM_MUTATION_RPC");
    expect(
      readFileSync(
        join(ROOT, "src/features/org-context/server/organization-context-rpc.ts"),
        "utf8",
      ),
    ).toContain("apply_organization_context_platform_mutation");
  });

  it("keeps domain modules free of privileged factory and env reads", () => {
    for (const file of walk(DOMAIN_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|createSupabaseServiceRoleClient|process\.env/);
    }
  });
});
