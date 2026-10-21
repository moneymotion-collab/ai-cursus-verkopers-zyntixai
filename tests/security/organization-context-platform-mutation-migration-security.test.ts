import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260825130000_add_organization_context_platform_mutations.sql";
const SCHEMA_1B =
  "20260825120000_create_organization_context_assignment_foundation.sql";
const RLS_1B =
  "20260825120010_enable_organization_context_assignment_rls.sql";
const GRANT_1B =
  "20260824210000_grant_control_plane_select_to_service_role.sql";

const FUNCTION =
  "public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb)";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const sql = readFileSync(join(migrationsDir, MIGRATION), "utf8");

function sha256(relativePath: string) {
  return createHash("sha256")
    .update(readFileSync(join(process.cwd(), relativePath)))
    .digest("hex")
    .toUpperCase();
}

describe("ORG-CONTEXT-1C mutation migration contract", () => {
  it("creates exactly one public mutation function", () => {
    expect(sql.match(/create or replace function public\./gi)).toHaveLength(1);
    expect(sql).toContain(
      "create or replace function public.apply_organization_context_platform_mutation(",
    );
    expect(sql).not.toMatch(/create or replace function private\./i);
  });

  it("locks the function as SECURITY DEFINER with empty search_path and fully qualified names", () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = ''/);
    expect(sql).toContain("auth.role()");
    expect(sql).toContain("public.organizations");
    expect(sql).toContain("public.organization_business_activities");
    expect(sql).toContain("public.organization_context_assignments");
    expect(sql).toContain("public.organization_context_assignment_events");
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(sql).not.toMatch(/\bfrom organizations\b/);
    expect(sql).not.toMatch(/\bupdate organizations\b/);
  });

  it("revokes EXECUTE from public/anon/authenticated and grants only to service_role", () => {
    expect(sql).toContain(`revoke all on function ${FUNCTION} from public`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from anon`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from authenticated`);
    expect(sql).toContain(`revoke all on function ${FUNCTION} from service_role`);
    expect(sql).toContain(`grant execute on function ${FUNCTION} to service_role`);
    expect(sql).not.toMatch(/grant execute on function .+ to authenticated/i);
    expect(sql).not.toMatch(/grant execute on function .+ to anon/i);
    expect(sql).not.toMatch(/grant execute on function .+ to public/i);
  });

  it("does not redesign tables, backfill, or DML organizations/catalog/Social", () => {
    expect(sql).not.toMatch(/create table /i);
    expect(sql).not.toMatch(/alter table /i);
    expect(sql).not.toMatch(/^\s*insert into public\.(organizations|taxonomy_|capabilities|context_pack)/im);
    expect(sql).not.toMatch(/^\s*update public\.(organizations|taxonomy_|capabilities|context_pack)/im);
    expect(sql).not.toContain("grant insert on table public.taxonomy_");
    expect(sql).not.toContain("grant update on table public.context_packs");
    expect(sql).not.toContain("grant delete");
    expect(sql).not.toContain("social_closed_beta_enrollments");
    expect(sql).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(sql).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(sql).not.toContain("apply_organization_onboarding");
    expect(sql).not.toContain("enabled_capabilities");
  });

  it("supersedes the old assignment before inserting a new active pin and writes the audit event in the same function", () => {
    const changeStart = sql.indexOf("if p_operation = 'change_context_version'");
    expect(changeStart).toBeGreaterThan(-1);
    const changeBody = sql.slice(changeStart);
    const supersedeAt = changeBody.indexOf("status = 'superseded'");
    const insertAt = changeBody.indexOf(
      "insert into public.organization_context_assignments",
    );
    expect(supersedeAt).toBeGreaterThan(-1);
    expect(insertAt).toBeGreaterThan(supersedeAt);
    expect(changeBody).toContain("'context_version_changed'");
    expect(changeBody).toContain("old_context_pack_version_id");
    expect(changeBody).toContain("event_type");
    expect(changeBody).toContain("actor_user_id");
    expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
  });

  it("does not mutate 1B foundation/RLS or CONTROL-PLANE grant files", () => {
    expect(sha256(`supabase/migrations/${SCHEMA_1B}`)).toBe(
      "0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0",
    );
    expect(sha256(`supabase/migrations/${RLS_1B}`)).toBe(
      "C80E9A15192971E679CA7BC17A41E0CCC83BB7A768E910F1F6E5F2564D60A6E0",
    );
    expect(sha256(`supabase/migrations/${GRANT_1B}`)).toBe(
      "578BB5028C4E8FA7EA7ABB182022AC0D0F99945744E1572EE28B6F0294C94017",
    );
    const orgContextSqlFiles = readdirSync(migrationsDir)
      .filter((name) => name.includes("organization_context"))
      .sort();
    expect(orgContextSqlFiles).toEqual([SCHEMA_1B, RLS_1B, MIGRATION].sort());
  });
});
