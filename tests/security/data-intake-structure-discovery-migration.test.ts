import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STRUCTURE_MIGRATION =
  "20260827160000_add_data_intake_source_structure_discovery.sql";
const OBJECT_MIGRATION =
  "20260827150000_add_data_intake_source_object_verification.sql";

describe("DATA-1E structure discovery migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, STRUCTURE_MIGRATION), "utf8");

  it("is additive, uses existing source columns, and does not create a ninth table", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(STRUCTURE_MIGRATION);
    expect(names).toContain(OBJECT_MIGRATION);
    expect(sql).toContain("apply_data_intake_source_structure_mutation");
    expect(sql).toContain("confirm_source_structure");
    expect(sql).toContain("source_parsed");
    expect(sql).toContain("data-parser-v1");
    expect(sql).toContain("discovered source structure is immutable");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("data_import_jobs");
    expect(sql).not.toContain("private.create_customer_record");
    expect(sql).not.toContain("insert into public.data_intake_mappings");
    expect(sql).not.toContain("insert into public.data_intake_staging_rows");
  });

  it("keeps the RPC service_role-only with hardened search_path and no row/path authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_source_structure_mutation");
    expect(sql).toContain("Client storage path and source rows are not accepted");
    expect(sql).toContain("SOURCE_NOT_VERIFIED");
    expect(sql).not.toContain("EXECUTE format");
  });
});
