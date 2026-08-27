import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = "20260827120000_add_business_qualification_assignment_handoff.sql";
const FUNCTION =
  "public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text)";
const FROZEN = [
  "20260826170000_create_business_qualification_admission_foundation.sql",
  "20260826180000_add_business_qualification_classification_mutations.sql",
  "20260826190000_add_business_qualification_support_admission_mutations.sql",
  "20260826200000_extend_org_context_bqa_governed_authority.sql",
] as const;

const migrationsDir = join(process.cwd(), "supabase/migrations");
const sql = readFileSync(join(migrationsDir, MIGRATION), "utf8");

function sha256(name: string) {
  return createHash("sha256")
    .update(readFileSync(join(migrationsDir, name)))
    .digest("hex")
    .toUpperCase();
}

describe("BQA-1F-R assignment handoff migration contract", () => {
  it("is additive and does not edit frozen BQA or ORG-CONTEXT migrations", () => {
    expect(sql).toContain(
      "create or replace function public.apply_business_qualification_assignment_handoff(",
    );
    expect(sql.match(/create or replace function /gi)).toHaveLength(1);
    expect(sql).not.toContain("create table");
    expect(sql).not.toContain("create or replace function public.apply_business_qualification_mutation(");
    expect(FROZEN.every((name) => !sql.includes(name))).toBe(true);
    expect(sha256("20260826200000_extend_org_context_bqa_governed_authority.sql")).toBe(
      "D26D8EF97400DDE6F33A127D01B94A8A13B650E0AA3D894D777062895C9E320A",
    );
    expect(sha256(MIGRATION)).toBe(
      "11EBE1AAAA07F6EE4AE6763AA1EF6C63A1F3F667C2DF5893788DBBF8C9057406",
    );
  });

  it("locks SECURITY DEFINER, empty search_path, and service_role EXECUTE only", () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/);
    expect(sql).toContain("auth.role()");
    expect(sql).toContain("service_role");
    expect(sql).toContain(`revoke all on function ${FUNCTION} from public`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from anon`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from authenticated`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from service_role`);
    expect(sql).toContain(`grant execute on function ${FUNCTION} to service_role`);
  });

  it("acquires ORG-CONTEXT lock 872011 before BQA lock 872012", () => {
    const first = sql.indexOf("872011");
    const second = sql.indexOf("872012");
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
  });

  it("delegates Activity and Context mutation to the BQA ORG-CONTEXT wrapper and RAISES on nested ok=false", () => {
    expect(sql).toContain("public.apply_organization_context_bqa_mutation(");
    expect(sql).toContain("'classify_activity'");
    expect(sql).toContain("'activate_activity'");
    expect(sql).toContain("'assign_context_version'");
    expect(sql).toContain("raise exception");
    expect(sql).toContain("HANDOFF_NESTED:");
    expect(sql).toContain("(v_classify->>'ok') is distinct from 'true'");
    expect(sql).toContain("(v_activate->>'ok') is distinct from 'true'");
    expect(sql).toContain("(v_assign->>'ok') is distinct from 'true'");
    expect(sql).not.toContain("apply_organization_context_platform_mutation");
    expect(sql).not.toContain("change_context_version");
    expect(sql).not.toContain("platform_operator");
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_business_activities/im,
    );
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_context_assignments/im,
    );
    expect(sql).not.toContain("commit;");
    expect(sql).not.toContain("rollback;");
  });

  it("does not DML entitlement, Path B, Social, Context readiness, or TAX/CAP catalog", () => {
    expect(sql).not.toContain("enabled_capabilities");
    expect(sql).not.toContain("organization_invitations");
    expect(sql).not.toContain("registration_intents");
    expect(sql).not.toContain("apply_organization_onboarding");
    expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.context_pack_readiness/im);
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.taxonomy_/im);
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.capabilities/im);
    expect(sql).toContain("'assignment_handoff_requested'");
    expect(sql).toContain("'assignment_handoff_completed'");
    expect(sql).toContain("handoff-completed:");
    expect(sql).toContain("bqa_confirmed");
  });
});
