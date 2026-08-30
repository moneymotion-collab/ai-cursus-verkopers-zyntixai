import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MATCHING_MIGRATION =
  "20260830200000_add_data_intake_customer_identity_resolution.sql";

describe("DATA-1H customer identity resolution migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, MATCHING_MIGRATION), "utf8");

  it("reuses staging rows and does not add a ninth DATA table or Customer uniqueness", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(MATCHING_MIGRATION);
    expect(sql).toContain("apply_data_intake_matching_mutation");
    expect(sql).toContain("confirm_source_matching");
    expect(sql).toContain("matching_completed");
    expect(sql).toContain("update public.data_intake_staging_rows");
    expect(sql).toContain("from public.customers");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("insert into public.customers");
    expect(sql).not.toContain("update public.customers");
    expect(sql).not.toContain("delete from public.customers");
    expect(sql).not.toContain("insert into public.data_import_plans");
    expect(sql).not.toContain("insert into public.data_import_row_results");
    expect(sql).not.toContain("insert into public.data_external_record_links");
    expect(sql).not.toContain("private.create_customer_record");
    expect(sql).not.toContain("create unique index");
    expect(sql).not.toContain("customers_org_email_unique_idx");
  });

  it("keeps the RPC service_role-only with hardened search_path and no target authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_matching_mutation");
    expect(sql).toContain("Client matching targets and source rows are not accepted");
    expect(sql).toContain("872018");
    expect(sql).not.toContain("EXECUTE format");
    expect(sql).not.toContain("create_customer");
    expect(sql).not.toContain("update_customer");
    expect(sql).not.toContain("archive_customer");
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("e745e566918b76c436d92c5333fa49d0ad32fad1c06534a2f6ebbd3bce412b1d");
  });
});
