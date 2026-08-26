import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260826180000_add_business_qualification_classification_mutations.sql";
const FUNCTION =
  "public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb)";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);

describe("BQA-1D mutation migration contract", () => {
  it("creates exactly one public mutation function", () => {
    expect(sql.match(/create or replace function public\./gi)).toHaveLength(1);
    expect(sql).toContain(
      "create or replace function public.apply_business_qualification_mutation(",
    );
    expect(sql).not.toMatch(/create or replace function private\./i);
  });

  it("locks the function as SECURITY DEFINER with empty search_path", () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/);
    expect(sql).toContain("auth.role()");
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(sql).toContain("public.business_activity_qualifications");
    expect(sql).toContain("public.business_activity_qualification_answers");
    expect(sql).toContain("public.business_activity_classification_decisions");
    expect(sql).toContain("public.business_activity_qualification_events");
  });

  it("revokes EXECUTE from public/anon/authenticated and grants only to the privileged role", () => {
    expect(sql).toContain(`revoke all on function ${FUNCTION} from public`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from anon`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from authenticated`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from service_role`);
    expect(sql).toContain(`grant execute on function ${FUNCTION} to service_role`);
    expect(sql).not.toMatch(/grant execute on function .+ to authenticated/i);
    expect(sql).not.toMatch(/grant execute on function .+ to anon/i);
    expect(sql).not.toMatch(/grant execute on function .+ to public/i);
  });

  it("does not DML ORG-CONTEXT, support, admission, demand, Path B, or Social", () => {
    expect(sql).not.toMatch(/create table /i);
    expect(sql).not.toMatch(/alter table /i);
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_business_activities/im,
    );
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.organization_context_assignments/im,
    );
    expect(sql).not.toContain("apply_organization_context_platform_mutation");
    expect(sql).not.toContain("classify_activity");
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.business_activity_support_assessments/im,
    );
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.business_activity_admission_decisions/im,
    );
    expect(sql).not.toMatch(
      /^\s*(insert into|update|delete from) public\.business_activity_demand_signals/im,
    );
    expect(sql).not.toContain("organization_invitations");
    expect(sql).not.toContain("registration_intents");
    expect(sql).not.toContain("social_closed_beta_enrollments");
    expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(sql).not.toContain("apply_organization_onboarding");
  });

  it("keeps qualification, decision, pointer, and event writes in the same function", () => {
    const confirmStart = sql.indexOf("if p_operation = 'confirm_classification'");
    expect(confirmStart).toBeGreaterThan(-1);
    const confirmBody = sql.slice(confirmStart);
    expect(confirmBody).toContain("decision_status = 'superseded'");
    expect(confirmBody).toContain("current_classification_decision_id");
    expect(confirmBody).toContain("'classification_confirmed'");
    expect(confirmBody).not.toContain("commit;");
  });
});
