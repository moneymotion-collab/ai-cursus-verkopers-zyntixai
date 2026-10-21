import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = "20260826200000_extend_org_context_bqa_governed_authority.sql";
const PLATFORM_1C = "20260825130000_add_organization_context_platform_mutations.sql";
const SCHEMA_1B = "20260825120000_create_organization_context_assignment_foundation.sql";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const sql = readFileSync(join(migrationsDir, MIGRATION), "utf8");
const platform1c = readFileSync(join(migrationsDir, PLATFORM_1C), "utf8");

function sha256(relativePath: string) {
  return createHash("sha256")
    .update(readFileSync(join(process.cwd(), relativePath)))
    .digest("hex")
    .toUpperCase();
}

function wrapperBody(name: string) {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  expect(start).toBeGreaterThan(-1);
  const next = sql.indexOf("create or replace function", start + 10);
  return next === -1 ? sql.slice(start) : sql.slice(start, next);
}

describe("ORG-CONTEXT-1X-B governed authority migration contract", () => {
  it("does not edit previously applied ORG-CONTEXT migrations", () => {
    expect(sha256(`supabase/migrations/${PLATFORM_1C}`)).toBe(
      "A2F35C87BD84DE5D887271DCA76DAC36299418F400FECF00A73F85251329F205",
    );
    expect(sha256(`supabase/migrations/${SCHEMA_1B}`)).toBe(
      "0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0",
    );
    expect(platform1c).toContain("'platform_operator'");
    expect(platform1c).not.toContain("private.apply_organization_context_mutation");
  });

  it("creates one canonical private writer and two public wrappers", () => {
    expect(sql).toContain(
      "create or replace function private.apply_organization_context_mutation(",
    );
    expect(sql).toContain(
      "create or replace function public.apply_organization_context_platform_mutation(",
    );
    expect(sql).toContain(
      "create or replace function public.apply_organization_context_bqa_mutation(",
    );
    expect(sql.match(/create or replace function /gi)).toHaveLength(3);
  });

  it("keeps wrappers thin: they delegate instead of duplicating classify/assign SQL", () => {
    const platform = wrapperBody("apply_organization_context_platform_mutation");
    const confirmed = wrapperBody("apply_organization_context_bqa_mutation");
    for (const body of [platform, confirmed]) {
      expect(body).toContain("private.apply_organization_context_mutation(");
      expect(body).not.toContain("insert into public.organization_business_activities");
      expect(body).not.toContain("insert into public.organization_context_assignments");
      expect(body).not.toContain("update public.organization_business_activities");
    }
    expect(platform).toContain("'platform_operator'");
    expect(platform).not.toContain("'bqa_confirmed'");
    expect(confirmed).toContain("'bqa_confirmed'");
    expect(confirmed).not.toMatch(/'platform_operator'/);
    expect(sql).not.toMatch(/p_payload->>'source'/);
    expect(sql).not.toMatch(/p_payload->"source"/);
  });

  it("locks SECURITY DEFINER, empty search_path, and exact EXECUTE grants", () => {
    expect(sql.match(/security definer/gi)).toHaveLength(3);
    expect(sql.match(/set search_path = ''/g)).toHaveLength(3);
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(sql).toContain("872011");
    expect(sql).toContain("872012");
    expect(sql).toContain("auth.role()");
    const privateFn =
      "private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb)";
    const platformFn =
      "public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb)";
    const confirmedFn =
      "public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb)";
    for (const fn of [privateFn, platformFn, confirmedFn]) {
      expect(sql).toContain(`revoke all on function ${fn} from public`);
      expect(sql).toContain(`revoke all on function ${fn} from anon`);
      expect(sql).toContain(`revoke all on function ${fn} from authenticated`);
      expect(sql).toContain(`revoke all on function ${fn} from service_role`);
    }
    expect(sql).toContain(`grant execute on function ${platformFn} to service_role`);
    expect(sql).toContain(`grant execute on function ${confirmedFn} to service_role`);
    expect(sql).not.toContain(`grant execute on function ${privateFn} to service_role`);
    expect(sql).not.toMatch(/grant execute on function .+ to authenticated/i);
  });

  it("enforces Owner/Admin and the confirmed allowlist in the wrapper and canonical writer", () => {
    const confirmed = wrapperBody("apply_organization_context_bqa_mutation");
    expect(confirmed).toContain("om.role in ('owner', 'admin')");
    expect(confirmed).toContain("om.status = 'active'");
    expect(confirmed).toContain("'classify_activity'");
    expect(confirmed).toContain("'activate_activity'");
    expect(confirmed).toContain("'assign_context_version'");
    expect(confirmed).toContain("FORBIDDEN_OPERATION");
    expect(confirmed).toContain("ACTOR_NOT_AUTHORIZED");
    expect(sql).toContain("ACTIVITY_CLASSIFICATION_MISMATCH");
    expect(sql).toContain("CONTEXT_REPIN_REQUIRED");
    expect(sql).toContain("ACTIVITY_NOT_CLASSIFIED");
    expect(sql).toContain("ACTIVITY_ARCHIVED");
    expect(sql).toContain("'business_activity_activated'");
    expect(sql).toContain("p_source");
  });

  it("does not embed BQA admission, readiness policy, or Social/onboarding DML", () => {
    expect(sql).not.toContain("business_activity_support_assessments");
    expect(sql).not.toContain("business_activity_admission_decisions");
    expect(sql).not.toContain("closed_beta");
    expect(sql).not.toContain("internal_qa");
    expect(sql).not.toContain("production_verified");
    expect(sql).not.toContain("beta_supported");
    expect(sql).not.toContain("social_closed_beta_enrollments");
    expect(sql).not.toContain("apply_organization_onboarding");
    expect(sql).not.toContain("apply_business_qualification_mutation");
    expect(sql).not.toMatch(/^\s*insert into public\.organizations/im);
    expect(sql).not.toMatch(/alter table public\.organizations/i);
    expect(sql).not.toContain("COMMIT");
    expect(sql).not.toContain("ROLLBACK");
  });

  it("uses p_source for assignment and event provenance instead of hardcoded platform_operator in transition SQL", () => {
    const canonicalStart = sql.indexOf(
      "create or replace function private.apply_organization_context_mutation(",
    );
    const canonicalEnd = sql.indexOf(
      "create or replace function public.apply_organization_context_platform_mutation(",
      canonicalStart + 10,
    );
    const canonical = sql.slice(canonicalStart, canonicalEnd);
    const inserts = canonical.match(/insert into public\.organization_context_assignments[\s\S]*?;/g) ?? [];
    expect(inserts.length).toBeGreaterThan(0);
    for (const insert of inserts) {
      expect(insert).toContain("p_source");
      expect(insert).not.toMatch(/'platform_operator'/);
    }
    const events = canonical.match(/insert into public\.organization_context_assignment_events[\s\S]*?;/g) ?? [];
    expect(events.length).toBeGreaterThan(0);
    for (const insert of events) {
      expect(insert).toContain("p_source");
      expect(insert).not.toMatch(/'platform_operator'/);
    }
  });
});
