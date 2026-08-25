import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION =
  "20260825120000_create_organization_context_assignment_foundation.sql";
const RLS_MIGRATION =
  "20260825120010_enable_organization_context_assignment_rls.sql";

const CONTROL_PLANE_GRANT =
  "20260824210000_grant_control_plane_select_to_service_role.sql";

const TABLES = [
  "organization_business_activities",
  "organization_context_assignments",
  "organization_context_assignment_events",
] as const;

const CONTROL_PLANE_TABLES = [
  "taxonomy_releases",
  "taxonomy_foundations",
  "taxonomy_industries",
  "taxonomy_niches",
  "taxonomy_specializations",
  "taxonomy_deep_specializations",
  "taxonomy_aliases",
  "capabilities",
  "capability_dependencies",
  "capability_readiness",
  "context_packs",
  "context_pack_versions",
  "context_capability_mappings",
  "context_terminology",
  "context_pack_readiness",
] as const;

const INTEGRITY_FUNCTIONS = [
  "private.guard_organization_context_assignment_event_immutable()",
  "private.enforce_organization_business_activity_identity()",
  "private.enforce_organization_context_assignment_integrity()",
] as const;

const migrationsDir = join(process.cwd(), "supabase/migrations");

const schemaMigration = readFileSync(join(migrationsDir, SCHEMA_MIGRATION), "utf8");
const rlsMigration = readFileSync(join(migrationsDir, RLS_MIGRATION), "utf8");
const allOrgContextMigrations = `${schemaMigration}\n${rlsMigration}`;

function activityTableSql(): string {
  const start = schemaMigration.indexOf(
    "create table public.organization_business_activities",
  );
  const end = schemaMigration.indexOf(
    "create table public.organization_context_assignments",
  );
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return schemaMigration.slice(start, end);
}

function assignmentTableSql(): string {
  const start = schemaMigration.indexOf(
    "create table public.organization_context_assignments",
  );
  const end = schemaMigration.indexOf(
    "create table public.organization_context_assignment_events",
  );
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return schemaMigration.slice(start, end);
}

function eventTableSql(): string {
  const start = schemaMigration.indexOf(
    "create table public.organization_context_assignment_events",
  );
  expect(start).toBeGreaterThan(-1);
  return schemaMigration.slice(start);
}

describe("ORG-CONTEXT-1B migration inventory", () => {
  it("registers exactly two ordered additive ORG-CONTEXT migrations after CONTROL-PLANE-READ", () => {
    const names = readdirSync(migrationsDir)
      .filter(
        (name) =>
          name.includes("organization_context_assignment") ||
          name.includes("organization_business_activit"),
      )
      .sort();
    expect(names).toEqual([SCHEMA_MIGRATION, RLS_MIGRATION]);
    expect(SCHEMA_MIGRATION > CONTROL_PLANE_GRANT).toBe(true);
    expect(RLS_MIGRATION > SCHEMA_MIGRATION).toBe(true);
  });

  it("does not edit historical TAX/CAP/CTX or CONTROL-PLANE-READ migrations", () => {
    expect(readdirSync(migrationsDir)).toContain(CONTROL_PLANE_GRANT);
    expect(allOrgContextMigrations).not.toContain(
      "grant_control_plane_select_to_service_role",
    );
  });
});

describe("ORG-CONTEXT-1B table model", () => {
  it("creates exactly the three contracted public tables", () => {
    for (const table of TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("organization_context_overrides");
    expect(schemaMigration).not.toContain("organization_context_state");
    expect(schemaMigration).not.toContain("resolved_context");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
    expect(schemaMigration).not.toMatch(/create\s+type\s+\w+\s+as\s+enum/i);
  });

  it("does not add Context or TAX shortcuts onto organizations", () => {
    expect(allOrgContextMigrations).not.toMatch(/alter table public\.organizations/i);
    expect(allOrgContextMigrations).not.toContain("organizations.context_pack_id");
    expect(allOrgContextMigrations).not.toContain("organizations.context_version_id");
    expect(allOrgContextMigrations).not.toContain("organizations.foundation_id");
    expect(allOrgContextMigrations).not.toContain("organizations.niche_id");
    expect(activityTableSql()).toContain("id uuid primary key default gen_random_uuid()");
  });
});

describe("ORG-CONTEXT-1B activity identity and lifecycle", () => {
  it("keeps activity_key unique per Organization and not globally unique by TAX", () => {
    const activity = activityTableSql();
    expect(activity).toContain(
      "constraint organization_business_activities_org_activity_key_unique unique",
    );
    expect(activity).toMatch(
      /organization_business_activities_org_activity_key_unique unique \(\s*organization_id,\s*activity_key\s*\)/,
    );
    expect(activity).toContain("activity_key = lower(btrim(activity_key))");
    expect(activity).not.toContain("organization_id, niche_id");
    expect(activity).not.toMatch(
      /unique\s*\(\s*organization_id\s*,\s*niche_id\s*\)/i,
    );
    expect(activity).not.toMatch(
      /unique\s*\(\s*organization_id\s*,\s*foundation_id\s*\)/i,
    );
  });

  it("requires a trimmed non-empty display_name distinct from TAX identity", () => {
    expect(activityTableSql()).toContain(
      "char_length(btrim(display_name)) between 2 and 100",
    );
    expect(schemaMigration).toContain(
      "Tenant activity label. Taxonomy labels are not identity.",
    );
  });

  it("locks v1 activity statuses to draft, active, archived", () => {
    expect(activityTableSql()).toContain(
      "status in ('draft', 'active', 'archived')",
    );
    expect(activityTableSql()).not.toContain("'deleted'");
    expect(activityTableSql()).not.toContain("'superseded'");
    expect(activityTableSql()).not.toContain("'pending_review'");
    expect(activityTableSql()).not.toContain("'scheduled'");
  });
});

describe("ORG-CONTEXT-1B classification XOR matrix", () => {
  it("never allows more than one TAX target", () => {
    expect(activityTableSql()).toContain(
      "organization_business_activities_target_cardinality_check",
    );
    expect(activityTableSql()).toContain(") <= 1");
  });

  it("matches classification_kind to the populated typed FK", () => {
    const activity = activityTableSql();
    expect(activity).toContain("organization_business_activities_kind_target_check");
    expect(activity).toContain("classification_kind = 'foundation'");
    expect(activity).toContain("classification_kind = 'industry'");
    expect(activity).toContain("classification_kind = 'niche'");
    expect(activity).toContain("classification_kind = 'specialization'");
    expect(activity).toContain("classification_kind = 'deep_specialization'");
    expect(activity).not.toContain("taxonomy_type");
    expect(activity).not.toContain("taxonomy_id uuid");
  });

  it("encodes draft/archived zero-or-one and active exactly-one", () => {
    const activity = activityTableSql();
    expect(activity).toContain(
      "organization_business_activities_active_classified_check",
    );
    expect(activity).toMatch(
      /status <> 'active'\s+or classification_kind is not null/,
    );
    expect(activity).toMatch(
      /classification_kind is null\s+and foundation_id is null/,
    );
  });

  it("uses typed TAX FKs with ON DELETE RESTRICT", () => {
    const activity = activityTableSql();
    expect(activity).toMatch(
      /organization_business_activities_foundation_fk[\s\S]*taxonomy_foundations \(id\)[\s\S]*on delete restrict/,
    );
    expect(activity).toMatch(
      /organization_business_activities_industry_fk[\s\S]*taxonomy_industries \(id\)[\s\S]*on delete restrict/,
    );
    expect(activity).toMatch(
      /organization_business_activities_niche_fk[\s\S]*taxonomy_niches \(id\)[\s\S]*on delete restrict/,
    );
    expect(activity).toMatch(
      /organization_business_activities_specialization_fk[\s\S]*taxonomy_specializations \(id\)[\s\S]*on delete restrict/,
    );
    expect(activity).toMatch(
      /organization_business_activities_deep_specialization_fk[\s\S]*taxonomy_deep_specializations \(id\)[\s\S]*on delete restrict/,
    );
  });
});

describe("ORG-CONTEXT-1B primary activity constraints", () => {
  it("requires is_primary to be active and at most one active primary per Organization", () => {
    const activity = activityTableSql();
    expect(activity).toContain(
      "organization_business_activities_primary_active_check",
    );
    expect(activity).toMatch(/is_primary = false\s+or status = 'active'/);
    expect(schemaMigration).toContain(
      "organization_business_activities_one_active_primary_uidx",
    );
    expect(schemaMigration).toMatch(
      /unique index organization_business_activities_one_active_primary_uidx[\s\S]*\(organization_id\)[\s\S]*where status = 'active' and is_primary = true/,
    );
    expect(schemaMigration).not.toMatch(
      /unique index[\s\S]*is_primary = true[\s\S]*status <> 'archived'/,
    );
  });
});

describe("ORG-CONTEXT-1B tenant ownership", () => {
  it("anchors activities to organizations with RESTRICT and composite uniqueness", () => {
    const activity = activityTableSql();
    expect(activity).toContain("organization_business_activities_org_id_unique");
    expect(activity).toMatch(
      /organization_business_activities_organization_fk[\s\S]*references public\.organizations \(id\)[\s\S]*on delete restrict/,
    );
    expect(activity).not.toMatch(
      /organization_business_activities_organization_fk[\s\S]*on delete cascade/,
    );
  });

  it("uses a tenant-honest composite FK from assignments to activities", () => {
    const assignment = assignmentTableSql();
    expect(assignment).toMatch(
      /organization_context_assignments_activity_fk[\s\S]*foreign key \(\s*organization_id,\s*business_activity_id\s*\)[\s\S]*references public\.organization_business_activities \(organization_id, id\)[\s\S]*on delete restrict/,
    );
    expect(assignment).toContain("organization_context_assignments_org_id_unique");
  });
});

describe("ORG-CONTEXT-1B exact Context version pin", () => {
  it("stores context_pack_version_id only and RESTRICT-deletes", () => {
    const assignment = assignmentTableSql();
    expect(assignment).toContain("context_pack_version_id uuid not null");
    expect(assignment).toMatch(
      /organization_context_assignments_version_fk[\s\S]*context_pack_versions \(id\)[\s\S]*on delete restrict/,
    );
    expect(assignment).not.toMatch(/^\s*context_pack_id\b/m);
    expect(assignment).not.toContain("latest_version");
    expect(assignment).not.toContain("auto_upgrade");
    expect(assignment).not.toContain("resolved_version");
    expect(assignment).toContain("status in ('active', 'superseded')");
    expect(assignment).not.toContain("'draft'");
    expect(assignment).not.toContain("'scheduled'");
  });

  it("enforces at most one active assignment per Business Activity", () => {
    expect(schemaMigration).toContain(
      "organization_context_assignments_one_active_uidx",
    );
    expect(schemaMigration).toMatch(
      /unique index organization_context_assignments_one_active_uidx[\s\S]*\(organization_id, business_activity_id\)[\s\S]*where status = 'active'/,
    );
  });
});

describe("ORG-CONTEXT-1B structural assignment compatibility", () => {
  it("installs a BEFORE INSERT/UPDATE integrity trigger with fail-closed messages", () => {
    expect(schemaMigration).toContain(
      "private.enforce_organization_context_assignment_integrity()",
    );
    expect(schemaMigration).toContain(
      "create trigger organization_context_assignments_enforce_integrity",
    );
    expect(schemaMigration).toMatch(
      /before insert or update on public\.organization_context_assignments/,
    );
    expect(schemaMigration).toContain(
      "ORG-CONTEXT: business activity not found for organization",
    );
    expect(schemaMigration).toContain(
      "ORG-CONTEXT: unclassified activity cannot be assigned a Context version",
    );
    expect(schemaMigration).toContain(
      "ORG-CONTEXT: Context pack kind is incompatible with activity classification",
    );
    expect(schemaMigration).toContain(
      "ORG-CONTEXT: Context pack TAX target does not match activity classification",
    );
    expect(schemaMigration).toContain(
      "ORG-CONTEXT: new assignment requires a published Context version",
    );
    expect(schemaMigration).toContain("v_activity_target is distinct from v_pack_target");
  });

  it("does not encode readiness admission or ancestor fallback", () => {
    expect(schemaMigration).not.toContain("context_ready");
    expect(schemaMigration).not.toContain("beta_supported");
    expect(schemaMigration).not.toContain("production_verified");
    expect(schemaMigration).not.toContain("ancestor");
    expect(schemaMigration).not.toContain("parent_version_id");
    expect(allOrgContextMigrations).not.toContain("course_seller");
    expect(allOrgContextMigrations).not.toContain("online-course-business");
  });

  it("re-validates publication only for new pins, not historical UPDATE-to-superseded", () => {
    const fnStart = schemaMigration.indexOf(
      "create or replace function private.enforce_organization_context_assignment_integrity()",
    );
    const fnEnd = schemaMigration.indexOf(
      "comment on function private.enforce_organization_context_assignment_integrity()",
    );
    const fn = schemaMigration.slice(fnStart, fnEnd);
    const updateReturn = fn.search(/return new;\s+end if;/);
    const publicationCheck = fn.indexOf(
      "ORG-CONTEXT: new assignment requires a published Context version",
    );
    expect(updateReturn).toBeGreaterThan(-1);
    expect(publicationCheck).toBeGreaterThan(updateReturn);
    expect(fn).toContain("assignment status may only move active to superseded");
    expect(fn).toContain("new assignments must be status active");
  });
});

describe("ORG-CONTEXT-1B source and actor", () => {
  it("uses text CHECK provenance including platform_operator without Postgres ENUM", () => {
    const assignment = assignmentTableSql();
    expect(assignment).toContain("'platform_operator'");
    expect(assignment).toContain("'manual_owner'");
    expect(assignment).toContain("'manual_admin'");
    expect(assignment).toContain("'onboarding'");
    expect(assignment).toContain("'bqa_confirmed'");
    expect(assignment).toContain("'migration'");
  });

  it("preserves actor_user with SET NULL and does not force membership", () => {
    const assignment = assignmentTableSql();
    expect(assignment).toMatch(
      /organization_context_assignments_actor_user_fk[\s\S]*profiles \(id\)[\s\S]*on delete set null/,
    );
    expect(assignment).toMatch(
      /organization_context_assignments_actor_member_fk[\s\S]*organization_members \(organization_id, id\)[\s\S]*on delete restrict/,
    );
    expect(assignment).toContain("actor_user_id uuid,");
    expect(assignment).toContain("actor_member_id uuid,");
  });
});

describe("ORG-CONTEXT-1B events and immutability", () => {
  it("creates append-only events with tenant-honest FKs and object payload", () => {
    const events = eventTableSql();
    expect(events).toContain("'business_activity_created'");
    expect(events).toContain("'business_activity_classified'");
    expect(events).toContain("'context_version_assigned'");
    expect(events).toContain("'context_version_changed'");
    expect(events).toContain("'primary_activity_changed'");
    expect(events).toContain("'business_activity_archived'");
    expect(events).toContain("jsonb_typeof(payload) = 'object'");
    expect(events).toMatch(
      /organization_context_assignment_events_activity_fk[\s\S]*organization_business_activities \(organization_id, id\)[\s\S]*on delete restrict/,
    );
    expect(events).toMatch(
      /organization_context_assignment_events_assignment_fk[\s\S]*organization_context_assignments \(organization_id, id\)[\s\S]*on delete restrict/,
    );
    expect(events).not.toMatch(/on delete cascade/);
  });

  it("blocks UPDATE and DELETE through the immutability trigger", () => {
    expect(schemaMigration).toContain(
      "private.guard_organization_context_assignment_event_immutable()",
    );
    expect(schemaMigration).toContain(
      "organization context assignment events are immutable",
    );
    expect(schemaMigration).toMatch(
      /before update or delete on public\.organization_context_assignment_events/,
    );
  });
});

describe("ORG-CONTEXT-1B RLS and grants", () => {
  it("enables RLS without FORCE and without authenticated write policies", () => {
    for (const table of TABLES) {
      expect(allOrgContextMigrations).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(allOrgContextMigrations).not.toMatch(/force row level security/i);
    expect(rlsMigration).not.toMatch(/for (insert|update|delete)/i);
    expect(rlsMigration).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(rlsMigration).not.toContain("first_org");
    expect(rlsMigration).not.toContain("organizations.status");
  });

  it("lets active members SELECT activities in their Organization", () => {
    expect(rlsMigration).toContain(
      "organization_business_activities_select_member",
    );
    expect(rlsMigration).toContain("private.is_org_member(organization_id)");
    expect(rlsMigration).toContain(
      "grant select on table public.organization_business_activities to authenticated",
    );
  });

  it("lets members read active assignments and Owner/Admin read history", () => {
    expect(rlsMigration).toContain(
      "organization_context_assignments_select_member_active",
    );
    expect(rlsMigration).toContain("status = 'active'");
    expect(rlsMigration).toContain(
      "organization_context_assignments_select_owner_admin_history",
    );
    expect(rlsMigration).toContain(
      "private.has_org_role(organization_id, array['owner', 'admin'])",
    );
  });

  it("restricts raw event SELECT to Owner/Admin", () => {
    expect(rlsMigration).toContain(
      "organization_context_assignment_events_select_owner_admin",
    );
    expect(rlsMigration).not.toMatch(
      /organization_context_assignment_events_select_member/,
    );
  });

  it("denies authenticated/anon/public writes and grants limited service_role DML", () => {
    for (const table of TABLES) {
      expect(rlsMigration).toContain(
        `revoke insert, update, delete on table public.${table} from authenticated`,
      );
      expect(rlsMigration).toContain(
        `revoke insert, update, delete on table public.${table} from anon`,
      );
    }
    expect(rlsMigration).toContain(
      "grant select, insert, update on table public.organization_business_activities to service_role",
    );
    expect(rlsMigration).toContain(
      "grant select, insert, update on table public.organization_context_assignments to service_role",
    );
    expect(rlsMigration).toContain(
      "grant select, insert on table public.organization_context_assignment_events to service_role",
    );
    expect(rlsMigration).not.toMatch(/^\s*grant\b.*\bdelete\b/im);
    expect(rlsMigration).not.toMatch(/grant all on all tables/i);
    expect(rlsMigration).not.toMatch(/all tables in schema/i);
  });

  it("does not grant DML on CONTROL-PLANE TAX/CAP/CTX tables", () => {
    for (const table of CONTROL_PLANE_TABLES) {
      expect(allOrgContextMigrations).not.toContain(`on table public.${table}`);
    }
  });
});

describe("ORG-CONTEXT-1B function security", () => {
  it("hardens integrity functions with empty search_path and EXECUTE revocation", () => {
    for (const fn of INTEGRITY_FUNCTIONS) {
      expect(schemaMigration).toMatch(
        new RegExp(
          `create or replace function ${fn.replace("()", "\\(\\)")}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(allOrgContextMigrations).toContain(
        `revoke all on function ${fn} from public`,
      );
      expect(allOrgContextMigrations).toContain(
        `revoke all on function ${fn} from anon`,
      );
      expect(allOrgContextMigrations).toContain(
        `revoke all on function ${fn} from authenticated`,
      );
      expect(allOrgContextMigrations).toContain(
        `revoke all on function ${fn} from service_role`,
      );
    }
    expect(allOrgContextMigrations).not.toMatch(
      /create (or replace )?function public\./i,
    );
  });
});

describe("ORG-CONTEXT-1B no backfill and isolation", () => {
  it("inserts zero domain rows and does not DML organizations, TAX, CAP, CTX, or Social", () => {
    expect(allOrgContextMigrations).not.toMatch(/^\s*insert\b/im);
    expect(allOrgContextMigrations).not.toMatch(/^\s*update\b/im);
    expect(allOrgContextMigrations).not.toMatch(/^\s*delete\b/im);
    expect(allOrgContextMigrations).not.toMatch(/^\s*truncate\b/im);
    expect(allOrgContextMigrations).not.toContain("business_type");
    expect(allOrgContextMigrations).not.toContain("primary_audience");
    expect(allOrgContextMigrations).not.toContain("primary_offering");
    expect(allOrgContextMigrations).not.toContain("social_closed_beta");
    expect(allOrgContextMigrations).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(allOrgContextMigrations).not.toContain("entitled");
    expect(allOrgContextMigrations).not.toContain("enabled_capabilities");
    expect(allOrgContextMigrations).not.toContain("feature_flags");
  });

  it("does not implement mutation RPCs, resolver tables, or public APIs", () => {
    expect(allOrgContextMigrations).not.toContain("changePinnedContextVersion");
    expect(allOrgContextMigrations).not.toContain("apply_organization_onboarding");
    expect(allOrgContextMigrations).not.toContain("create or replace function public.");
    expect(allOrgContextMigrations).not.toContain("pg_advisory_xact_lock");
  });
});
