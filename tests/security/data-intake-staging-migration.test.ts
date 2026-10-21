import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STAGING_MIGRATION = "20260830100000_add_data_intake_value_validation_staging.sql";
const CANCEL_R1_MIGRATION =
  "20260829190000_allow_mapping_states_data_intake_session_cancellation.sql";

describe("DATA-1G validation and staging migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, STAGING_MIGRATION), "utf8");
  const r1 = readFileSync(join(dir, CANCEL_R1_MIGRATION), "utf8");

  it("reuses the frozen staging table and does not add a ninth DATA table", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(STAGING_MIGRATION);
    expect(sql).toContain("apply_data_intake_staging_mutation");
    expect(sql).toContain("confirm_source_validation");
    expect(sql).toContain("insert into public.data_intake_staging_rows");
    expect(sql).toContain("validation_completed");
    expect(sql).toContain("review_required");
    expect(sql).toContain("ready_for_approval");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("insert into public.data_import_plans");
    expect(sql).not.toContain("insert into public.data_import_row_results");
    expect(sql).not.toContain("insert into public.data_external_record_links");
    expect(sql).not.toContain("insert into public.customers");
    expect(sql).not.toContain("private.create_customer_record");
  });

  it("keeps the RPC service_role-only with hardened search_path and no row or path authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_staging_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_staging_mutation");
    expect(sql).toContain("Client storage path and source rows are not accepted");
    expect(sql).toContain("p_payload->'staging_rows'");
    expect(sql).not.toContain("EXECUTE format");
  });

  it("aligns cancel_session with frozen DATA-1G states without editing the R1 hash", () => {
    expect(sql).toContain(
      "'created', 'source_ready', 'parsed', 'mapping_required', 'mapped', 'validating', 'review_required', 'ready_for_approval'",
    );
    expect(createHash("sha256").update(r1).digest("hex")).toBe(
      "3293c94fe1550868017a752f0c7b5d4c88993f0ef222fd8b834fca0c59f7a4fe",
    );
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("62fc56887cacdfabe8230e98f78a8dbbef1d85a3f69eea5dd4b779b83738338c");
  });
});
