import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SERVER_DIR = join(ROOT, "src/features/data-intake/server");
const CLIENT = "src/features/data-intake/server/data-intake-client.ts";

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

describe("DATA-1C server-only isolation", () => {
  it("marks every privileged server module as server-only", () => {
    const files = walk(SERVER_DIR).filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain('import "server-only"');
    }
  });

  it("reuses the privileged factory from the client boundary only", () => {
    const client = readFileSync(join(ROOT, CLIENT), "utf8");
    expect(client).toContain("createSupabaseServiceRoleClient");
    expect(client).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    const otherServer = walk(SERVER_DIR)
      .filter((file) => file.endsWith(".ts") && !file.endsWith("data-intake-client.ts"))
      .map((file) => readFileSync(file, "utf8"));
    for (const source of otherServer) {
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
      expect(source).not.toContain("createSupabaseServiceRoleClient");
    }
  });

  it("does not create a public API, client hook, or import executor", () => {
    expect(existsSync(join(ROOT, "src/features/data-intake/index.ts"))).toBe(false);
    for (const file of walk(join(ROOT, "src/features/data-intake"))) {
      const source = readFileSync(file, "utf8");
      const relativePath = relative(ROOT, file).replaceAll("\\", "/");
      expect(source).not.toContain("use client");
      expect(source).not.toContain("createSupabaseBrowserClient");
      expect(source).not.toContain('"use server"');
      expect(source).not.toContain("csv-parse");
      expect(source).not.toContain("papaparse");
      expect(source).not.toMatch(/from ["']xlsx["']/);
      expect(source).not.toContain("SheetJS");
      expect(source).not.toContain("private.create_customer_record");
      expect(source).not.toContain("customer-mutations");
      expect(source).not.toContain("customer-writer");
      expect(source).not.toContain("apply_business_qualification_mutation");
      expect(source).not.toContain("apply_organization_context");
      if (source.includes('from "exceljs"') || source.includes("from 'exceljs'")) {
        expect(relativePath).toBe("src/features/data-intake/domain/xlsx-structure.ts");
      }
    }
    const appDir = join(ROOT, "src/app");
    const hits: string[] = [];
    for (const file of walk(appDir)) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const source = readFileSync(file, "utf8");
      if (source.includes("features/data-intake") || file.replaceAll("\\", "/").includes("api/data-intake")) {
        hits.push(relative(ROOT, file).replaceAll("\\", "/"));
      }
    }
    expect(hits).toEqual([]);
  });

  it("binds the RPC name to the generated Database function key", () => {
    const rpc = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-rpc.ts"),
      "utf8",
    );
    expect(rpc).toContain(
      'apply_data_intake_foundation_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    expect(rpc).toContain('keyof Database["public"]["Functions"]');
    expect(rpc).toContain('@/types/database');
    expect(rpc).not.toContain("database.generated");
    const structure = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-structure-rpc.ts"),
      "utf8",
    );
    expect(structure).toContain(
      'apply_data_intake_source_structure_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    const mapping = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-mapping-rpc.ts"),
      "utf8",
    );
    expect(mapping).toContain(
      'apply_data_intake_mapping_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    const staging = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-staging-rpc.ts"),
      "utf8",
    );
    expect(staging).toContain(
      'apply_data_intake_staging_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    const matching = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-matching-rpc.ts"),
      "utf8",
    );
    expect(matching).toContain(
      'apply_data_intake_matching_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    const planning = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-planning-rpc.ts"),
      "utf8",
    );
    expect(planning).toContain(
      'apply_data_intake_planning_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
    const execution = readFileSync(
      join(ROOT, "src/features/data-intake/server/data-intake-execution-rpc.ts"),
      "utf8",
    );
    expect(execution).toContain(
      'apply_data_intake_execution_mutation" as const satisfies keyof Database["public"]["Functions"]',
    );
  });
});
