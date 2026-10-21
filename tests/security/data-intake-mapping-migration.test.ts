import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MAPPING_MIGRATION = "20260829180000_add_data_intake_semantic_mapping.sql";

describe("DATA-1F mapping migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, MAPPING_MIGRATION), "utf8");

  it("is additive on the existing mappings table and does not add a ninth DATA table", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(MAPPING_MIGRATION);
    expect(sql).toContain("apply_data_intake_mapping_mutation");
    expect(sql).toContain("data_intake_mappings_one_target_per_source_idx");
    expect(sql).toContain("mapping_confirmed");
    expect(sql).toContain("mapping_proposed");
    expect(sql).toContain("display_name");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("insert into public.data_intake_staging_rows");
    expect(sql).not.toContain("insert into public.data_import_plans");
    expect(sql).not.toContain("insert into public.customers");
    expect(sql).not.toContain("private.create_customer_record");
  });

  it("keeps the RPC service_role-only with hardened search_path and no row authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_mapping_mutation");
    expect(sql).toContain("Client storage path and source rows are not accepted");
    expect(sql).not.toContain("EXECUTE format");
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("736e11d712209115922e5a2b77bc2aa546f090629c1c10d059f9cc7fb8c65594");
  });
});
