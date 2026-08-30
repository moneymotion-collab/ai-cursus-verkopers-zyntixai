import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PLANNING_MIGRATION = "20260830300000_add_data_intake_import_planning_approval.sql";

describe("DATA-1I import planning approval migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, PLANNING_MIGRATION), "utf8");

  it("reuses data_import_plans and does not add a ninth DATA table or Customer writer", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(PLANNING_MIGRATION);
    expect(sql).toContain("apply_data_intake_planning_mutation");
    expect(sql).toContain("create_import_plan");
    expect(sql).toContain("approve_import_plan");
    expect(sql).toContain("insert into public.data_import_plans");
    expect(sql).toContain("plan_created");
    expect(sql).toContain("plan_approved");
    expect(sql).toContain("matching_completed");
    expect(sql).toContain("'approved') then");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("insert into public.customers");
    expect(sql).not.toContain("update public.customers");
    expect(sql).not.toContain("delete from public.customers");
    expect(sql).not.toContain("insert into public.data_import_row_results");
    expect(sql).not.toContain("insert into public.data_external_record_links");
    expect(sql).not.toContain("private.create_customer_record");
  });

  it("keeps the RPC service_role-only with hardened search_path and no target authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_planning_mutation");
    expect(sql).toContain("Client plan targets and source rows are not accepted");
    expect(sql).toContain("872019");
    expect(sql).not.toContain("EXECUTE format");
    expect(sql).not.toContain("create_customer");
    expect(sql).not.toContain("update_customer");
    expect(sql).not.toContain("archive_customer");
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("efd34811e36e46b0e6abeb3dd87047fc4dcbc1fb49145f9ac93b5d39d7b1d0a2");
  });
});
