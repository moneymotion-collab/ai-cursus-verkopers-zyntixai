import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CANCEL_MIGRATION =
  "20260827161658_allow_parsed_data_intake_session_cancellation.sql";
const FOUNDATION_RPC_MIGRATION = "20260827140010_enable_data_intake_rls.sql";
const GRAPH_MIGRATION = "20260827140000_create_data_intake_foundation.sql";

describe("DATA-1E-R1 parsed session cancellation migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, CANCEL_MIGRATION), "utf8");
  const graph = readFileSync(join(dir, GRAPH_MIGRATION), "utf8");
  const priorRpc = readFileSync(join(dir, FOUNDATION_RPC_MIGRATION), "utf8");

  it("is additive, replaces only cancel_session allowlist, and does not create tables", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(CANCEL_MIGRATION);
    expect(sql).toContain("apply_data_intake_foundation_mutation");
    expect(sql).toContain("'created', 'source_ready', 'parsed'");
    expect(sql).toContain("DATA can cancel only created, source_ready, or parsed sessions");
    expect(sql).toContain("p_operation not in ('create_session', 'register_source', 'cancel_session')");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("private.create_customer_record");
    expect(sql).not.toContain("insert into public.data_intake_mappings");
    expect(sql).not.toContain("insert into public.data_intake_staging_rows");
    expect(sql).not.toContain("storage.objects");
    expect(graph).toContain("when p_from = 'parsed' and p_to in ('mapping_required', 'cancelled') then true");
    expect(priorRpc).toContain("DATA-1C can cancel only pre-import created or source_ready sessions");
  });

  it("keeps the foundation RPC service_role-only with hardened search_path and Owner/Admin actors", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toContain("v_member_role not in ('owner', 'admin')");
    expect(sql).toContain(
      "revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) to service_role",
    );
    expect(sql).not.toContain("EXECUTE format");
  });
});
