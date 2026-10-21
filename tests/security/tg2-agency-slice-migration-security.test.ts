import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260905140000_tg2_agency_slice.sql"),
  "utf8",
);

/** SQL comment lines (e.g. scope-exclusion notes) are documentation, not executable DDL. */
const migrationCodeOnly = migration
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

describe("TG2-AGENCY-SLICE migration security contract", () => {
  it("is additive only: no drop table, no destructive DDL, no historical migration edits", () => {
    expect(migration).not.toMatch(/drop table/i);
    expect(migration).not.toMatch(/drop function.*cascade/i);
    expect(migration).not.toMatch(/truncate/i);
    expect(migration).not.toMatch(/delete from/i);
  });

  it("widens attention_items source_type/shape checks to include project without removing existing sources", () => {
    expect(migration).toContain("attention_items_source_type_chk");
    expect(migration).toMatch(/'enrollment',\s*\n\s*'social_publication',\s*\n\s*'social_connection',\s*\n\s*'project'/);
    expect(migration).toContain("source_type = 'project'");
    expect(migration).toContain("and source_entity_id = project_id");
  });

  it("scopes attention_items project/task foreign keys to the organization", () => {
    expect(migration).toMatch(
      /attention_items_project_fk[\s\S]*foreign key \(organization_id, project_id\)\s*\n\s*references public\.projects \(organization_id, id\)/,
    );
    expect(migration).toMatch(
      /attention_items_task_fk[\s\S]*foreign key \(organization_id, task_id\)\s*\n\s*references public\.tasks \(organization_id, id\)/,
    );
  });

  it("widens rule_key allow-lists to include exactly the three new project rules", () => {
    for (const ruleKey of [
      "project_overdue_active",
      "project_task_overdue",
      "project_no_owner",
    ]) {
      expect(migration).toContain(`'${ruleKey}'`);
    }
    expect(migration).toContain("attention_signals_rule_key_check");
    expect(migration).toContain("attention_signals_origin_rule_consistency_check");
  });

  it("keeps append_attention_signal a full replace validating the widened rule_key set", () => {
    expect(migration).toContain(
      "create or replace function private.append_attention_signal(",
    );
    expect(migration).toContain("p_rule_key is distinct from 'project_overdue_active'");
    expect(migration).toContain("p_rule_key is distinct from 'project_task_overdue'");
    expect(migration).toContain("p_rule_key is distinct from 'project_no_owner'");
  });

  it("exposes evaluate_project_attention_rules restricted to owner/admin, security definer, empty search_path", () => {
    expect(migration).toMatch(
      /create or replace function public\.evaluate_project_attention_rules[\s\S]*array\['owner', 'admin'\]/,
    );
    expect(migration).toContain("security definer");
    expect(migration).toMatch(/set search_path = ''/);
  });

  it("locks down EXECUTE grants: no public/anon, authenticated only", () => {
    expect(migration).toContain(
      "revoke all on function public.evaluate_project_attention_rules(uuid, uuid) from public;",
    );
    expect(migration).toContain(
      "revoke all on function public.evaluate_project_attention_rules(uuid, uuid) from anon;",
    );
    expect(migration).toContain(
      "grant execute on function public.evaluate_project_attention_rules(uuid, uuid) to authenticated;",
    );
    expect(migration).toContain(
      "revoke all on function private.upsert_project_rule_attention_item(",
    );
    expect(migration).toContain(
      "revoke all on function private.expire_project_rule_attention_item_if_present(",
    );
  });

  it("does not introduce Agency-specific tables, Client Portal, billing, or files scope", () => {
    expect(migrationCodeOnly).not.toMatch(/create table/i);
    expect(migrationCodeOnly).not.toContain("agency_clients");
    expect(migrationCodeOnly).not.toMatch(
      /invoice|billing|retainer|proposal|statement_of_work|timesheet/i,
    );
  });

  it("does not create a second dedupe/expiry mechanism; reuses existing private helpers", () => {
    expect(migration).toContain("private.build_attention_source_dedupe_key(");
    expect(migration).toContain("private.expire_attention_item(");
    expect(migration).toContain("private.insert_attention_item_event(");
    expect(migration).toContain("private.require_attention_actor(");
  });

  it("cleans up stale project Attention when the project leaves active scope", () => {
    expect(migration).toMatch(
      /pr\.status <> 'active' or pr\.archived_at is not null/,
    );
  });
});
