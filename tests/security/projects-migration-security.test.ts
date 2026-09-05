import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = "20260905123943_shared_projects_foundation.sql";
const sql = readFileSync(join(process.cwd(), "supabase/migrations", MIGRATION), "utf8");

function functionBody(name: string): string {
  const match = sql.match(
    new RegExp(
      `create or replace function (?:public|private)\\.${name}\\([\\s\\S]*?\\n\\$\\$;`,
      "i",
    ),
  );
  expect(match, `missing ${name} function`).not.toBeNull();
  return match?.[0] ?? "";
}

const projectsTable =
  sql.match(/create table public\.projects \([\s\S]*?\n\);/)?.[0] ?? "";

describe("shared Projects migration domain contract", () => {
  it("defines the organization-scoped Project fields and exact statuses", () => {
    expect(projectsTable).toMatch(/\bid uuid primary key/);
    expect(projectsTable).toMatch(/\borganization_id uuid not null/);
    expect(projectsTable).toMatch(/\bcustomer_id uuid not null/);
    expect(projectsTable).toMatch(/\bname text not null/);
    expect(projectsTable).toMatch(/\bsummary text/);
    expect(projectsTable).toMatch(/\bstatus text not null default 'planned'/);
    expect(projectsTable).toMatch(/\bowner_member_id uuid/);
    expect(projectsTable).toMatch(/\bplanned_start date/);
    expect(projectsTable).toMatch(/\bplanned_end date/);
    expect(projectsTable).toMatch(/\bcreated_by_member_id uuid not null/);
    expect(projectsTable).toMatch(/\barchived_at timestamptz/);
    expect(projectsTable).toContain(
      "status in ('planned', 'active', 'on_hold', 'completed', 'cancelled')",
    );
    expect(projectsTable).toMatch(/planned_end >= planned_start/);
  });

  it("uses composite organization foreign keys for customer and members", () => {
    expect(projectsTable).toMatch(
      /foreign key \(organization_id, customer_id\)\s+references public\.customers \(organization_id, id\)/,
    );
    expect(projectsTable).toMatch(
      /foreign key \(organization_id, owner_member_id\)\s+references public\.organization_members \(organization_id, id\)/,
    );
    expect(projectsTable).toMatch(
      /foreign key \(organization_id, created_by_member_id\)\s+references public\.organization_members \(organization_id, id\)/,
    );
    expect(sql).toMatch(
      /foreign key \(organization_id, project_id\)\s+references public\.projects \(organization_id, id\)/,
    );
  });

  it("keeps the shared Project shape free of target-specific state", () => {
    expect(projectsTable).not.toMatch(
      /\b(program_id|enrollment_id|course_id|lead_id|technician_id|social_\w+|bqa_\w+|readiness_\w+)\b/i,
    );
    expect(sql).not.toMatch(
      /(insert into|update|delete from)\s+public\.(context_pack_readiness|business_activity_admission_decisions|business_activity_support_assessments|social_\w+)/i,
    );
  });
});

describe("shared Projects migration security contract", () => {
  it("enables RLS and grants authenticated callers read-only table access", () => {
    expect(sql).toContain("alter table public.projects enable row level security");
    expect(sql).toContain(
      "alter table public.project_status_history enable row level security",
    );
    expect(sql).toContain(
      "revoke all on table public.projects from public, anon, authenticated",
    );
    expect(sql).toContain("grant select on table public.projects to authenticated");
    expect(sql).not.toMatch(
      /grant\s+(insert|update|delete|all)[^;]*on table public\.projects to authenticated/i,
    );
    expect(sql).not.toMatch(
      /create policy [\s\S]*?on public\.projects\s+for (insert|update|delete|all)/i,
    );
  });

  it("limits reads by organization membership and hides archives from ordinary members", () => {
    expect(sql).toMatch(
      /create policy projects_select_admin[\s\S]*?private\.has_org_role\(organization_id, array\['owner', 'admin'\]\)/,
    );
    expect(sql).toMatch(
      /create policy projects_select_member[\s\S]*?private\.is_org_member\(organization_id\)[\s\S]*?archived_at is null/,
    );
    expect(sql).toMatch(
      /create policy project_status_history_select_member[\s\S]*?private\.is_org_member\(organization_id\)/,
    );
  });

  it("makes authenticated security-definer RPCs the only write surface", () => {
    for (const signature of [
      "public.create_project(uuid, uuid, text, text, uuid, date, date)",
      "public.update_project(uuid, uuid, uuid, text, text, uuid, date, date)",
      "public.transition_project_status(uuid, uuid, text, text)",
      "public.archive_project(uuid, uuid)",
      "public.restore_project(uuid, uuid)",
    ]) {
      expect(sql).toContain(
        `revoke all on function ${signature} from public, anon, authenticated, service_role`,
      );
      expect(sql).toContain(`grant execute on function ${signature} to authenticated`);
    }
    for (const name of [
      "create_project",
      "update_project",
      "transition_project_status",
      "archive_project",
      "restore_project",
    ]) {
      expect(functionBody(name)).toContain("security definer");
      expect(functionBody(name)).toContain("set search_path = ''");
    }
  });

  it("requires active users in active organizations and operation-specific roles", () => {
    const guard = functionBody("require_project_actor");
    expect(guard).toContain("auth.uid() is null");
    expect(guard).toMatch(/om\.user_id = auth\.uid\(\)/);
    expect(guard).toMatch(/om\.status = 'active'/);
    expect(guard).toMatch(/o\.status = 'active'/);
    expect(guard).toMatch(/v_member_role = any\(p_allowed_roles\)/);

    for (const name of ["create_project", "update_project", "transition_project_status"]) {
      expect(functionBody(name)).toContain(
        "array['owner', 'admin', 'staff']::text[]",
      );
    }
    for (const name of ["archive_project", "restore_project"]) {
      expect(functionBody(name)).toContain("array['owner', 'admin']::text[]");
    }
  });

  it("validates active customer and owner membership in the requested organization", () => {
    const validation = functionBody("validate_project_relations");
    expect(validation).toMatch(
      /c\.organization_id = p_organization_id[\s\S]*?c\.id = p_customer_id[\s\S]*?c\.archived_at is null/,
    );
    expect(validation).toMatch(
      /om\.organization_id = p_organization_id[\s\S]*?om\.id = p_owner_member_id[\s\S]*?om\.status = 'active'/,
    );
    expect(functionBody("create_project")).toContain(
      "perform private.validate_project_relations",
    );
    expect(functionBody("update_project")).toContain(
      "perform private.validate_project_relations",
    );
    expect(functionBody("restore_project")).toContain(
      "perform private.validate_project_relations",
    );
  });

  it("enforces the allowed status graph and records transitions", () => {
    const transitions = functionBody("is_allowed_project_status_transition");
    expect(transitions).toContain(
      "when p_from_status = 'planned' and p_to_status in ('active', 'cancelled')",
    );
    expect(transitions).toContain(
      "when p_from_status = 'active' and p_to_status in ('on_hold', 'completed', 'cancelled')",
    );
    expect(transitions).toContain(
      "when p_from_status = 'on_hold' and p_to_status in ('active', 'completed', 'cancelled')",
    );
    expect(transitions).toContain(
      "when p_from_status = 'completed' and p_to_status = 'active'",
    );
    expect(transitions).toContain(
      "when p_from_status = 'cancelled' and p_to_status = 'planned'",
    );
    expect(transitions).toContain(
      "when p_from_status is not distinct from p_to_status then false",
    );

    const transitionRpc = functionBody("transition_project_status");
    expect(transitionRpc).toContain(
      "private.is_allowed_project_status_transition(v_project.status, p_to_status)",
    );
    expect(transitionRpc).toContain("perform private.insert_project_status_history");
  });

  it("archives organization-scoped rows and restores only after relation revalidation", () => {
    const archive = functionBody("archive_project");
    expect(archive).toMatch(/set archived_at = pg_catalog\.now\(\)/);
    expect(archive).toMatch(/p\.organization_id = p_organization_id/);
    expect(archive).toMatch(/p\.id = p_project_id/);
    expect(archive).toMatch(/p\.archived_at is null/);

    const restore = functionBody("restore_project");
    expect(restore).toContain("v_project.archived_at is null");
    expect(restore).toContain("perform private.validate_project_relations");
    expect(restore).toMatch(/set archived_at = null/);
  });

  it("creates Project tasks only for an active same-organization Project", () => {
    const createTask = functionBody("create_project_task");
    expect(createTask).toMatch(
      /from public\.projects as p[\s\S]*?p\.organization_id = p_organization_id[\s\S]*?p\.id = p_project_id[\s\S]*?p\.archived_at is null/,
    );
    expect(createTask).toMatch(
      /insert into public\.tasks[\s\S]*?organization_id[\s\S]*?project_id/,
    );
    expect(createTask).toContain(
      "array['owner', 'admin', 'staff']::text[]",
    );
    expect(sql).toMatch(
      /grant execute on function public\.create_project_task\([\s\S]*?\) to authenticated/,
    );
  });
});
