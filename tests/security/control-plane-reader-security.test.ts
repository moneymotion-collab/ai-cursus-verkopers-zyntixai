import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTROL_PLANE_TABLES } from "@/features/control-plane/server/control-plane-query";

const ROOT = process.cwd();
const GRANT_MIGRATION =
  "supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql";
const CLIENT =
  "src/features/control-plane/server/control-plane-client.ts";
const SERVER_DIR = join(ROOT, "src/features/control-plane/server");
const DOMAIN_DIR = join(ROOT, "src/features/control-plane/domain");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return [full];
  });
}

describe("CONTROL-PLANE-READ-1C server-only security", () => {
  it("keeps the frozen 1B SELECT grant migration unchanged", () => {
    const sql = readFileSync(join(ROOT, GRANT_MIGRATION), "utf8").replaceAll("\r\n", "\n");
    expect(sql).toContain("CONTROL-PLANE-READ-1B");
    expect(sql).not.toMatch(/^\s*grant\s+(insert|update|delete|all)\b/im);
    expect(
      sql.match(/^grant select on table public\.[a-z_]+ to service_role;$/gm),
    ).toHaveLength(15);
  });

  it("marks every control-plane server module as server-only", () => {
    const files = walk(SERVER_DIR).filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain('import "server-only"');
    }
  });

  it("reuses the existing service-role factory from the client boundary only", () => {
    const client = readFileSync(join(ROOT, CLIENT), "utf8");
    expect(client).toContain("createSupabaseServiceRoleClient");
    const otherServer = walk(SERVER_DIR)
      .filter((file) => file.endsWith(".ts") && !file.endsWith("control-plane-client.ts"))
      .map((file) => readFileSync(file, "utf8"));
    for (const source of otherServer) {
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
      expect(source).not.toContain("createSupabaseServiceRoleClient");
    }
  });

  it("keeps domain modules free of service-role and env imports", () => {
    for (const file of walk(DOMAIN_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|createSupabaseServiceRoleClient|process\.env/);
    }
  });

  it("does not create a public API, server action, or browser reader", () => {
    const appDir = join(ROOT, "src/app");
    const hits: string[] = [];
    for (const file of walk(appDir)) {
      if (!/\.(ts|tsx)$/.test(file)) {
        continue;
      }
      const source = readFileSync(file, "utf8");
      if (
        source.includes("features/control-plane") ||
        source.includes("createControlPlane") ||
        file.replaceAll("\\", "/").includes("api/control-plane")
      ) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
    const clientSource = readFileSync(join(ROOT, CLIENT), "utf8");
    expect(clientSource).not.toContain("createControlPlaneBrowserClient");
    expect(clientSource).not.toContain("createSupabaseBrowserClient");
  });

  it("does not use generic user-supplied table names or DML", () => {
    for (const file of walk(SERVER_DIR).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/\.from\(\s*userInput|\.from\(\s*tableName|\.from\(\s*name\s*\)/);
      expect(source).not.toMatch(/\.insert\(|\.update\(|\.delete\(/);
    }
    expect(CONTROL_PLANE_TABLES).toHaveLength(15);
  });
});
