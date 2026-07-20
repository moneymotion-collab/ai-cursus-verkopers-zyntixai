import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260720140000_add_organization_first_run_onboarding.sql",
  ),
  "utf8",
);

describe("B1.2 onboarding migration security contract", () => {
  it("adds additive nullable onboarding columns on organizations", () => {
    expect(migration).toContain("alter table public.organizations");
    expect(migration).toContain("add column business_type text");
    expect(migration).toContain("add column primary_audience text");
    expect(migration).toContain("add column primary_offering text");
    expect(migration).toContain("add column primary_goal text");
    expect(migration).toContain("add column team_size_band text");
    expect(migration).toContain("add column onboarding_completed_at timestamptz");
    expect(migration).toContain(
      "add column first_run_checklist_dismissed_at timestamptz",
    );
  });

  it("constrains stable values with text CHECK constraints", () => {
    expect(migration).toContain("organizations_business_type_check");
    expect(migration).toContain("'course_seller'");
    expect(migration).toContain("'organize_leads'");
    expect(migration).toContain("'2_5'");
    expect(migration).toContain("organizations_onboarding_complete_requires_fields");
    expect(migration).not.toMatch(/create type\s+/i);
  });

  it("exposes owner-only SECURITY DEFINER apply RPC with empty search_path", () => {
    expect(migration).toContain("apply_organization_onboarding");
    expect(migration).toMatch(
      /create or replace function public\.apply_organization_onboarding[\s\S]*security definer[\s\S]*set search_path = ''/i,
    );
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("om.role = 'owner'");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("p_mode text");
    expect(migration).toContain("'draft'");
    expect(migration).toContain("'complete'");
    expect(migration).toMatch(
      /grant execute on function public\.apply_organization_onboarding[\s\S]*to authenticated/i,
    );
    expect(migration).toMatch(
      /revoke all on function public\.apply_organization_onboarding[\s\S]*from anon/i,
    );
  });

  it("preserves first completion timestamp on repeated complete", () => {
    expect(migration).toContain("v_completed_at := v_org.onboarding_completed_at");
    expect(migration).toContain(
      "if v_mode = 'complete' and v_completed_at is null then",
    );
  });

  it("does not auto-complete existing organizations", () => {
    expect(migration).not.toMatch(
      /update\s+public\.organizations[\s\S]*onboarding_completed_at\s*=\s*now\(\)/i,
    );
    expect(migration).not.toContain("set onboarding_completed_at = now()");
  });
});
