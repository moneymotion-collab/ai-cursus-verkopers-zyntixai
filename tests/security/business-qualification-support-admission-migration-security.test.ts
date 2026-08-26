import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260826190000_add_business_qualification_support_admission_mutations.sql";
const FUNCTION =
  "public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb)";
const FROZEN_1D =
  "20260826180000_add_business_qualification_classification_mutations.sql";

const sql = readFileSync(join(process.cwd(), "supabase/migrations", MIGRATION), "utf8");
const frozen1d = readFileSync(join(process.cwd(), "supabase/migrations", FROZEN_1D), "utf8");

describe("BQA-1E support/admission mutation migration contract", () => {
  it("replaces the existing privileged mutation function additively", () => {
    expect(sql.match(/create or replace function public\./gi)).toHaveLength(1);
    expect(sql).toContain(
      "create or replace function public.apply_business_qualification_mutation(",
    );
    expect(sql).toContain("'record_support_assessment'");
    expect(sql).toContain("'record_admission_decision'");
    expect(sql).toContain("'join_demand_waitlist'");
    expect(sql).toContain("'withdraw_demand_waitlist'");
    expect(frozen1d).not.toContain("'record_support_assessment'");
  });

  it("keeps SECURITY DEFINER, empty search_path, and privileged execute only", () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/);
    expect(sql).toContain("auth.role()");
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(sql).toContain(`revoke all on function ${FUNCTION} from public`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from anon`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from authenticated`);
    expect(sql).toContain(`grant execute on function ${FUNCTION} to service_role`);
  });

  it("writes support, admission, demand, and events in the same function", () => {
    expect(sql).toContain("insert into public.business_activity_support_assessments");
    expect(sql).toContain("insert into public.business_activity_admission_decisions");
    expect(sql).toContain("insert into public.business_activity_demand_signals");
    expect(sql).toContain("'support_assessed'");
    expect(sql).toContain("'admission_decided'");
    expect(sql).toContain("'waitlist_joined'");
    expect(sql).toContain("'waitlist_withdrawn'");
    expect(sql).not.toContain("commit;");
  });

  it("does not DML Activity, Context assignment, TAX/CAP/CTX catalog, Path B, or Social", () => {
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_business_activities/im,
    );
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_context_assignments/im,
    );
    expect(sql).not.toContain("apply_organization_context_platform_mutation");
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.taxonomy_/im);
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.context_packs/im);
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.context_pack_/im);
    expect(sql).not.toMatch(/^\s*(insert into|update|delete from) public\.capabilities/im);
    expect(sql).not.toContain("organization_invitations");
    expect(sql).not.toContain("registration_intents");
    expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(sql).not.toContain("apply_organization_onboarding");
  });

  it("invalidates current support and admission on requalification", () => {
    const requalifyStart = sql.indexOf("if p_operation = 'begin_requalification'");
    expect(requalifyStart).toBeGreaterThan(-1);
    const body = sql.slice(requalifyStart, sql.indexOf("if p_operation = 'request_review'"));
    expect(body).toContain("current_support_assessment_id = null");
    expect(body).toContain("current_admission_decision_id = null");
    expect(body).toContain("superseded_at = v_now");
  });
});
