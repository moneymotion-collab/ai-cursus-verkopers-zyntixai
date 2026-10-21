import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CANCEL_MIGRATION =
  "20260829190000_allow_mapping_states_data_intake_session_cancellation.sql";
const GRAPH_MIGRATION = "20260827140000_create_data_intake_foundation.sql";
const PRIOR_CANCEL_MIGRATION =
  "20260827161658_allow_parsed_data_intake_session_cancellation.sql";

describe("DATA-1F-R1 mapping-state cancellation migration", () => {
  const dir = join(process.cwd(), "supabase/migrations");
  const sql = readFileSync(join(dir, CANCEL_MIGRATION), "utf8");
  const graph = readFileSync(join(dir, GRAPH_MIGRATION), "utf8");
  const prior = readFileSync(join(dir, PRIOR_CANCEL_MIGRATION), "utf8");

  it("is additive, expands only the cancel allowlist, and does not create tables", () => {
    const names = readdirSync(dir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names).toContain(CANCEL_MIGRATION);
    expect(sql).toContain("apply_data_intake_foundation_mutation");
    expect(sql).toContain("'created', 'source_ready', 'parsed', 'mapping_required', 'mapped'");
    expect(sql).toContain(
      "DATA can cancel only created, source_ready, parsed, mapping_required, or mapped sessions",
    );
    expect(sql).toContain("p_operation not in ('create_session', 'register_source', 'cancel_session')");
    expect(sql).not.toContain("create table public.");
    expect(sql).not.toContain("private.create_customer_record");
    expect(sql).not.toContain("insert into public.data_intake_mappings");
    expect(sql).not.toContain("insert into public.data_intake_staging_rows");
    expect(sql).not.toContain("insert into public.data_import_plans");
    expect(sql).not.toContain("storage.objects");
    expect(sql).not.toContain("EXECUTE format");
    expect(graph).toContain(
      "when p_from = 'mapping_required' and p_to in ('mapped', 'cancelled') then true",
    );
    expect(graph).toContain(
      "when p_from = 'mapped' and p_to in ('validating', 'mapping_required', 'cancelled') then true",
    );
    expect(prior).toContain("'created', 'source_ready', 'parsed'");
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
  });

  it("has a frozen SHA-256", () => {
    const hash = createHash("sha256").update(sql).digest("hex");
    expect(hash).toBe("3293c94fe1550868017a752f0c7b5d4c88993f0ef222fd8b834fca0c59f7a4fe");
  });
});
