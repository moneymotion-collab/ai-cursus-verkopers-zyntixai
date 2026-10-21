import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SERVER_DIR = join(ROOT, "src/features/context-resolver/server");
const DOMAIN_DIR = join(ROOT, "src/features/context-resolver/domain");

function walk(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return [full];
  });
}

describe("context-resolver server isolation", () => {
  it("marks every server module as server-only", () => {
    const files = walk(SERVER_DIR).filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain('import "server-only"');
    }
  });

  it("keeps the pure domain free of server-only, Supabase, and env access", () => {
    for (const file of walk(DOMAIN_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain('import "server-only"');
      expect(source).not.toContain("@supabase/");
      expect(source).not.toContain("process.env");
      expect(source).not.toContain("createSupabase");
    }
  });

  it("does not create a public API, browser hook, or product consumer", () => {
    const hits: string[] = [];
    for (const file of walk(join(ROOT, "src/app"))) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const source = readFileSync(file, "utf8");
      if (source.includes("features/context-resolver")) {
        hits.push(relative(ROOT, file).replaceAll("\\", "/"));
      }
    }
    expect(hits).toEqual([]);
    expect(existsSync(join(ROOT, "src/features/context-resolver/index.ts"))).toBe(false);
    const protectedPaths = [
      "src/components/app-shell.tsx",
      "src/features/onboarding",
      "src/features/social-media",
      "src/features/customers",
      "src/features/leads",
      "src/features/programs",
      "src/features/tasks",
      "src/features/attention",
    ];
    for (const relativePath of protectedPaths) {
      const absolute = join(ROOT, relativePath);
      const files = statSync(absolute).isDirectory() ? walk(absolute) : [absolute];
      for (const file of files) {
        if (!/\.(ts|tsx)$/.test(file)) continue;
        expect(readFileSync(file, "utf8")).not.toContain("features/context-resolver");
      }
    }
  });

  it("does not import platform-operator mutation authority or Social execution", () => {
    for (const file of walk(SERVER_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("ORG_CONTEXT_PLATFORM_OPERATOR");
      expect(source).not.toContain("platform-operator-authorization");
      expect(source).not.toContain("apply_organization_context_platform_mutation");
      expect(source).not.toContain("features/social-media");
      expect(source).not.toContain("createSupabaseServiceRoleClient");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(source).not.toContain("enabledCapabilities");
      expect(source).not.toContain("use client");
    }
  });

  it("proves service_role Control Plane construction is not used as caller auth", () => {
    const resolver = readFileSync(join(SERVER_DIR, "context-resolver.ts"), "utf8");
    const fn = resolver.slice(
      resolver.indexOf("export async function resolveBusinessActivityContext"),
    );
    expect(fn.indexOf("loadTenantResolutionContext")).toBeGreaterThan(-1);
    expect(fn.indexOf("runtime.getControlPlaneReaders()")).toBeGreaterThan(
      fn.indexOf("loadTenantResolutionContext"),
    );
  });
});
