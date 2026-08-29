import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const OBJECT_MIGRATION =
  "20260827150000_add_data_intake_source_object_verification.sql";
const STRUCTURE_MIGRATION =
  "20260827160000_add_data_intake_source_structure_discovery.sql";
const PARSED_CANCEL_MIGRATION =
  "20260827161658_allow_parsed_data_intake_session_cancellation.sql";
const MAPPING_MIGRATION = "20260829180000_add_data_intake_semantic_mapping.sql";
const MAPPING_CANCEL_MIGRATION =
  "20260829190000_allow_mapping_states_data_intake_session_cancellation.sql";
const STORAGE_MIGRATION = "20260827140020_add_data_intake_storage_bucket.sql";
const SCHEMA_MIGRATION = "20260827140000_create_data_intake_foundation.sql";
const RLS_MIGRATION = "20260827140010_enable_data_intake_rls.sql";

describe("DATA-1D object verification migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, OBJECT_MIGRATION), "utf8");
  const storage = readFileSync(join(dir, STORAGE_MIGRATION), "utf8");

  it("is additive after the frozen DATA-1C ledger and does not create a ninth table", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toEqual([
      SCHEMA_MIGRATION,
      RLS_MIGRATION,
      STORAGE_MIGRATION,
      OBJECT_MIGRATION,
      STRUCTURE_MIGRATION,
      PARSED_CANCEL_MIGRATION,
      MAPPING_MIGRATION,
      MAPPING_CANCEL_MIGRATION,
    ]);
    expect(sql).toContain("object_verified_at");
    expect(sql).toContain("apply_data_intake_source_object_mutation");
    expect(sql).toContain("confirm_source_object");
    expect(sql).toContain("source_object_verified");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("data_import_jobs");
    expect(sql).not.toContain("csv-parse");
    expect(sql).not.toContain("papaparse");
    expect(sql).not.toContain("private.create_customer_record");
  });

  it("keeps the RPC service_role-only with hardened search_path and no client path authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain("grant execute on function public.apply_data_intake_source_object_mutation");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("Client storage path is not accepted");
    expect(sql).toContain("'FORBIDDEN_ROLE'");
    expect(sql).toContain("DATA: verified source object identity is immutable");
  });

  it("does not broaden Storage policies for authenticated or anon", () => {
    expect(sql).not.toContain("storage.objects");
    expect(sql).not.toContain("bucket_id = 'data-intake'");
    expect(storage).toContain("as restrictive");
    expect(storage).toContain("to authenticated");
    expect(storage).toContain("bucket_id is distinct from 'data-intake'");
  });
});
