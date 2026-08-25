import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src");

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf(".")))) {
      files.push(fullPath);
    }
  }

  return files;
}

function readAllSource(): string {
  return collectSourceFiles(ROOT)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

describe("security boundaries", () => {
  const source = readAllSource();

  it("does not perform direct tasks table writes", () => {
    expect(source).not.toMatch(/\.from\(["']tasks["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']task_status_history["']\)\.(insert|update|delete)/);
  });

  it("does not reference service-role secrets outside server-only modules", () => {
    const allowed = new Set([
      join(ROOT, "lib", "supabase", "service-role.ts").replace(/\\/g, "/"),
      join(
        ROOT,
        "features",
        "social-media",
        "server",
        "platform-operator-session.ts",
      ).replace(/\\/g, "/"),
      join(
        ROOT,
        "features",
        "social-media",
        "server",
        "scheduler-service-client.ts",
      ).replace(/\\/g, "/"),
      join(
        ROOT,
        "features",
        "control-plane",
        "server",
        "control-plane-client.ts",
      ).replace(/\\/g, "/"),
      join(
        ROOT,
        "features",
        "org-context",
        "server",
        "org-context-client.ts",
      ).replace(/\\/g, "/"),
    ]);

    const offenders = collectSourceFiles(ROOT).filter((file) => {
      const normalized = file.replace(/\\/g, "/");
      if (allowed.has(normalized)) {
        return false;
      }
      const content = readFileSync(file, "utf8");
      return (
        /SERVICE_ROLE/i.test(content) ||
        /service_role/.test(content) ||
        /createClient\([^)]*service/i.test(content)
      );
    });

    expect(offenders).toEqual([]);
  });

  it("uses only public Supabase env vars in browser client", () => {
    const browserClient = readFileSync(join(ROOT, "lib/supabase/client.ts"), "utf8");
    expect(browserClient).toContain("getBrowserSupabaseEnv");
    expect(browserClient).not.toMatch(/process\.env\.(?!NEXT_PUBLIC_)/);
  });
});
