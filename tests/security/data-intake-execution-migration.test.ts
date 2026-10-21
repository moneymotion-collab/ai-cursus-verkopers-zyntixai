import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const EXECUTION_MIGRATION = "20260830400000_add_data_intake_customer_import_execution.sql";

describe("DATA-1J customer import execution migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, EXECUTION_MIGRATION), "utf8");

  it("reuses row results and the private Customer writer without a ninth table", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(EXECUTION_MIGRATION);
    expect(sql).toContain("apply_data_intake_execution_mutation");
    expect(sql).toContain("execute_import_plan");
    expect(sql).toContain("private.create_customer_record");
    expect(sql).toContain("'import'");
    expect(sql).toContain("insert into public.data_import_row_results");
    expect(sql).toContain("import_started");
    expect(sql).toContain("import_batch_completed");
    expect(sql).toContain("import_completed");
    expect(sql).toContain("872020");
    expect(sql).not.toContain("create table public.");
    const executionSql = sql.slice(sql.indexOf("create or replace function public.apply_data_intake_execution_mutation"));
    expect(executionSql).not.toContain("insert into public.customers");
    expect(sql).not.toContain("update public.customers");
    expect(sql).not.toContain("delete from public.customers");
    expect(sql).not.toContain("insert into public.data_external_record_links");
    expect(sql).not.toContain("public.create_customer(");
  });

  it("keeps the RPC service_role-only with hardened search_path and no client write authority", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain("grant execute on function public.apply_data_intake_execution_mutation");
    expect(sql).toContain("Client execution targets and Customer fields are not accepted");
    expect(sql).not.toContain("EXECUTE format");
    expect(sql).not.toContain("update_customer");
    expect(sql).not.toContain("archive_customer");
  });

  it("creates and records a row result in the same function before returning", () => {
    const createAt = sql.indexOf("v_customer_id := private.create_customer_record(");
    const resultAt = sql.indexOf("insert into public.data_import_row_results", createAt);
    const returnAt = sql.lastIndexOf("return jsonb_build_object(");
    expect(createAt).toBeGreaterThan(0);
    expect(resultAt).toBeGreaterThan(createAt);
    expect(returnAt).toBeGreaterThan(resultAt);
    expect(sql).not.toContain("COMMIT");
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("2e08f7ec93f066e85096b587be80ee95ae0499ad29c7f444963c6c36415649be");
  });
});
