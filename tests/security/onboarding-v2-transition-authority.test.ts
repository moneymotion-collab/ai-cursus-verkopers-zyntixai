import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = "20260907140829_onboarding_v2_transition_authority.sql";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);
const versioningSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260907120240_add_versioned_onboarding_state.sql",
  ),
  "utf8",
);
const generated = readFileSync(
  join(process.cwd(), "src/types/database.generated.ts"),
  "utf8",
);
const migrationFiles = readdirSync(
  join(process.cwd(), "supabase/migrations"),
);

function functionBody(name: string, nextMarker: string): string {
  const start = sql.indexOf(`create or replace function public.${name}`);
  const end = sql.indexOf(nextMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

const legacy = functionBody(
  "apply_organization_onboarding",
  "-- V2 Setup Ready transition",
);
const ready = functionBody(
  "mark_organization_onboarding_setup_ready",
  "-- V2 Complete transition",
);
const completeStart = sql.indexOf(
  "create or replace function public.complete_organization_v2_onboarding",
);
expect(completeStart).toBeGreaterThan(-1);
const complete = sql.slice(completeStart);

describe("ENG-ONB-1H-C migration scope", () => {
  it("ships exactly one transition-authority migration", () => {
    expect(
      migrationFiles.filter((file) =>
        file.includes("onboarding_v2_transition_authority"),
      ),
    ).toEqual([MIGRATION]);
    expect(sql).toMatch(/^-- ENG-ONB-1H-C/);
    expect(sql).not.toMatch(/create table public\./i);
    expect(sql).not.toContain("assign_organization_operating_model");
    expect(sql).not.toContain("complete_owner_self_registration");
  });
});

describe("ENG-ONB-1H-C version-aware completion constraints", () => {
  it("preserves V1 legacy integrity and NULL-version compatibility", () => {
    expect(sql).toContain(
      "drop constraint organizations_onboarding_complete_requires_fields",
    );
    expect(sql).toMatch(
      /onboarding_completed_at is null\s+or onboarding_flow_version is null/i,
    );
    expect(sql).toMatch(
      /onboarding_flow_version = 1[\s\S]*business_type is not null[\s\S]*primary_audience is not null[\s\S]*primary_offering is not null[\s\S]*primary_goal is not null/i,
    );
  });

  it("allows V2 Ready and Complete without legacy questionnaire fields", () => {
    expect(sql).toMatch(
      /onboarding_flow_version = 2\s+and onboarding_setup_ready_at is not null/i,
    );
    const v2ConstraintBranch = sql.slice(
      sql.indexOf("onboarding_flow_version = 2"),
      sql.indexOf(");", sql.indexOf("onboarding_flow_version = 2")),
    );
    expect(v2ConstraintBranch).not.toContain("business_type");
    expect(v2ConstraintBranch).not.toContain("primary_audience");
    expect(v2ConstraintBranch).not.toContain("primary_offering");
    expect(v2ConstraintBranch).not.toContain("primary_goal");
  });

  it("retains version and V2 completion-order constraints from 1H-A", () => {
    expect(versioningSql).toContain("onboarding_flow_version in (1, 2)");
    expect(versioningSql).toMatch(
      /onboarding_flow_version is distinct from 2\s+or onboarding_completed_at is null\s+or onboarding_setup_ready_at is not null/i,
    );
    expect(versioningSql).toMatch(
      /onboarding_setup_ready_at is null\s+or onboarding_flow_version = 2/i,
    );
  });
});

describe("ENG-ONB-1H-C direct lifecycle update protection", () => {
  it("removes authenticated table UPDATE and regrants only unrelated columns", () => {
    expect(sql).toContain(
      "revoke update on table public.organizations from authenticated",
    );
    expect(sql).toMatch(
      /revoke update \(\s*onboarding_flow_version,\s*onboarding_setup_ready_at,\s*onboarding_completed_at\s*\) on table public\.organizations from authenticated/i,
    );
    const grant = sql.slice(
      sql.indexOf("grant update ("),
      sql.indexOf(") on table public.organizations to authenticated"),
    );
    expect(grant).toContain("name");
    expect(grant).toContain("team_size_band");
    expect(grant).toContain("first_run_checklist_dismissed_at");
    expect(grant).not.toContain("onboarding_flow_version");
    expect(grant).not.toContain("onboarding_setup_ready_at");
    expect(grant).not.toContain("onboarding_completed_at");
  });
});

describe("ENG-ONB-1H-C legacy RPC isolation", () => {
  it("preserves V1 behavior but rejects V2 before completion mutation", () => {
    const guard = legacy.indexOf(
      "v_mode = 'complete' and v_org.onboarding_flow_version = 2",
    );
    const completion = legacy.indexOf(
      "v_completed_at := pg_catalog.now()",
    );
    expect(guard).toBeGreaterThan(legacy.indexOf("for update"));
    expect(completion).toBeGreaterThan(guard);
    expect(legacy).toContain(
      "legacy onboarding cannot complete V2 organizations",
    );
    expect(legacy).toContain("onboarding fields incomplete");
    expect(legacy).toContain(
      "v_completed_at := v_org.onboarding_completed_at",
    );
  });

  it("retains hardened authenticated execution", () => {
    expect(legacy).toMatch(/security definer\s+set search_path = ''/i);
    expect(legacy).toContain("v_user_id := auth.uid()");
    expect(legacy).toContain("om.role = 'owner'");
    expect(legacy).toContain("pg_advisory_xact_lock");
    expect(legacy).toMatch(
      /revoke all on function public\.apply_organization_onboarding[\s\S]*from anon/i,
    );
    expect(legacy).toMatch(
      /grant execute on function public\.apply_organization_onboarding[\s\S]*to authenticated/i,
    );
  });
});

describe("ENG-ONB-1H-C V2 Setup Ready authority", () => {
  it("derives identity and enforces an active Owner membership in-transaction", () => {
    expect(ready).toContain("v_user_id := auth.uid()");
    expect(ready).not.toMatch(/p_(actor|user)_/i);
    expect(ready).toContain("om.organization_id = p_organization_id");
    expect(ready).toContain("om.user_id = v_user_id");
    expect(ready).toContain("om.status = 'active'");
    expect(ready).toContain("om.role = 'owner'");
    expect(ready).not.toMatch(/om\.role\s+in/i);
  });

  it("locks organization authority before rereading and writing", () => {
    const advisory = ready.indexOf("pg_advisory_xact_lock");
    const membershipLock = ready.indexOf("for update", advisory);
    const organizationLock = ready.indexOf("for update", membershipLock + 1);
    const mutation = ready.indexOf(
      "set onboarding_setup_ready_at = v_ready_at",
    );
    expect(advisory).toBeGreaterThan(-1);
    expect(ready).toMatch(/pg_advisory_xact_lock\(\s*872002,/i);
    expect(membershipLock).toBeGreaterThan(advisory);
    expect(organizationLock).toBeGreaterThan(membershipLock);
    expect(mutation).toBeGreaterThan(organizationLock);
  });

  it("requires V2, core identity, team size, and governed configured context", () => {
    expect(ready).toContain(
      "v_org.onboarding_flow_version is distinct from 2",
    );
    expect(ready).toContain("DISPLAY_NAME_REQUIRED");
    expect(ready).toContain("ORGANIZATION_NAME_REQUIRED");
    expect(ready).toContain("TEAM_SIZE_REQUIRED");
    expect(ready).toMatch(
      /from public\.profiles as p\s+where p\.id = v_user_id\s+for share/i,
    );
    for (const band of ["solo", "2_5", "6_20", "21_plus"]) {
      expect(ready).toContain(`'${band}'`);
    }
    expect(ready).toContain("organization_business_activities");
    expect(ready).toContain("organization_context_assignments");
    expect(ready).toContain("context_pack_versions");
    expect(ready).toContain("context_pack_readiness");
    for (const pack of [
      "niche.online-course-business",
      "foundation.knowledge",
      "foundation.service",
      "foundation.field-operations",
      "foundation.product-operations",
    ]) {
      expect(ready).toContain(`'${pack}'`);
    }
    expect(ready).toContain("CONFIGURED_CONTEXT_REQUIRED");
  });

  it("writes Ready only once and never writes completion", () => {
    expect(ready).toContain("v_org.onboarding_setup_ready_at is not null");
    expect(ready).toContain("'idempotent', true");
    expect(ready).toContain(
      "set onboarding_setup_ready_at = v_ready_at",
    );
    expect(ready).not.toMatch(/set\s+onboarding_completed_at/i);
  });

  it("is exposed only as a hardened authenticated RPC", () => {
    expect(ready).toMatch(/security definer\s+set search_path = ''/i);
    expect(ready).toMatch(
      /revoke all on function public\.mark_organization_onboarding_setup_ready\(uuid\) from public/i,
    );
    expect(ready).toMatch(
      /revoke all on function public\.mark_organization_onboarding_setup_ready\(uuid\) from anon/i,
    );
    expect(ready).toMatch(
      /grant execute on function public\.mark_organization_onboarding_setup_ready\(uuid\) to authenticated/i,
    );
  });
});

describe("ENG-ONB-1H-C V2 Complete authority", () => {
  it("uses the same owner and organization lock boundary", () => {
    expect(complete).toContain("v_user_id := auth.uid()");
    expect(complete).not.toMatch(/p_(actor|user)_/i);
    expect(complete).toContain("om.organization_id = p_organization_id");
    expect(complete).toContain("om.user_id = v_user_id");
    expect(complete).toContain("om.status = 'active'");
    expect(complete).toContain("om.role = 'owner'");
    expect(complete).toContain("pg_advisory_xact_lock");
    expect(complete).toMatch(/pg_advisory_xact_lock\(\s*872002,/i);
    expect(complete.match(/for update/g)).toHaveLength(2);
  });

  it("requires V2 Ready and preserves both timestamps on replay", () => {
    expect(complete).toContain(
      "v_org.onboarding_flow_version is distinct from 2",
    );
    expect(complete).toContain(
      "v_org.onboarding_setup_ready_at is null",
    );
    expect(complete).toContain("SETUP_NOT_READY");
    expect(complete).toContain("v_org.onboarding_completed_at is not null");
    expect(complete).toContain("'idempotent', true");
    expect(complete).toContain(
      "'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at",
    );
    expect(complete).toContain(
      "set onboarding_completed_at = v_completed_at",
    );
    expect(complete).not.toMatch(/set\s+onboarding_setup_ready_at/i);
  });

  it("does not depend on any legacy questionnaire field", () => {
    expect(complete).not.toContain("business_type");
    expect(complete).not.toContain("primary_audience");
    expect(complete).not.toContain("primary_offering");
    expect(complete).not.toContain("primary_goal");
  });

  it("is exposed only as a hardened authenticated RPC", () => {
    expect(complete).toMatch(/security definer\s+set search_path = ''/i);
    expect(complete).toMatch(
      /revoke all on function public\.complete_organization_v2_onboarding\(uuid\) from public/i,
    );
    expect(complete).toMatch(
      /revoke all on function public\.complete_organization_v2_onboarding\(uuid\) from anon/i,
    );
    expect(complete).toMatch(
      /grant execute on function public\.complete_organization_v2_onboarding\(uuid\) to authenticated/i,
    );
  });
});

describe("ENG-ONB-1H-C V2 legacy-field independence", () => {
  it("allows the Ready-to-Complete chain without legacy questionnaire writes", () => {
    for (const field of [
      "business_type",
      "primary_audience",
      "primary_offering",
      "primary_goal",
    ]) {
      expect(ready).not.toContain(field);
      expect(complete).not.toContain(field);
    }
    expect(ready).toContain("set onboarding_setup_ready_at = v_ready_at");
    expect(complete).toContain(
      "set onboarding_completed_at = v_completed_at",
    );
  });
});

describe("ENG-ONB-1H-C generated RPC contract", () => {
  it("includes both governed transition functions", () => {
    expect(generated).toContain(
      "mark_organization_onboarding_setup_ready:",
    );
    expect(generated).toContain("complete_organization_v2_onboarding:");
    expect(generated).toContain("Args: { p_organization_id: string }");
  });
});
