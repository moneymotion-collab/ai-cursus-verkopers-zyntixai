import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION =
  "20260826170000_create_business_qualification_admission_foundation.sql";
const RLS_MIGRATION =
  "20260826170010_enable_business_qualification_admission_rls.sql";
const ORG_CONTEXT_RPC =
  "20260825130000_add_organization_context_platform_mutations.sql";
const CONTROL_PLANE_GRANT =
  "20260824210000_grant_control_plane_select_to_service_role.sql";

const TABLES = [
  "business_activity_qualifications",
  "business_activity_qualification_answers",
  "business_activity_classification_decisions",
  "business_activity_support_assessments",
  "business_activity_admission_decisions",
  "business_activity_qualification_events",
  "business_activity_demand_signals",
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
  "private.guard_business_activity_qualification_event_immutable()",
  "private.lookup_bqa_taxonomy_target_key(text, uuid)",
  "private.enforce_business_activity_qualification_identity()",
  "private.enforce_business_activity_qualification_answer_identity()",
  "private.enforce_business_activity_classification_decision_integrity()",
  "private.enforce_business_activity_support_assessment_integrity()",
  "private.enforce_business_activity_admission_decision_integrity()",
  "private.enforce_business_activity_demand_signal_integrity()",
] as const;

const EVENT_TYPES = [
  "qualification_started",
  "answer_saved",
  "classification_proposed",
  "classification_confirmed",
  "classification_superseded",
  "review_requested",
  "review_resolved",
  "support_assessed",
  "admission_decided",
  "waitlist_joined",
  "waitlist_withdrawn",
  "split_recommended",
  "assignment_handoff_requested",
  "assignment_handoff_completed",
  "requalify_started",
] as const;

const migrationsDir = join(process.cwd(), "supabase/migrations");

const schemaMigration = readFileSync(join(migrationsDir, SCHEMA_MIGRATION), "utf8");
const rlsMigration = readFileSync(join(migrationsDir, RLS_MIGRATION), "utf8");
const allBqaMigrations = `${schemaMigration}\n${rlsMigration}`;

function tableSql(table: string, nextTable?: string): string {
  const start = schemaMigration.indexOf(`create table public.${table}`);
  expect(start).toBeGreaterThan(-1);
  const end = nextTable
    ? schemaMigration.indexOf(`create table public.${nextTable}`)
    : schemaMigration.indexOf(
        "alter table public.business_activity_qualifications",
      );
  expect(end).toBeGreaterThan(start);
  return schemaMigration.slice(start, end);
}

const qualifications = () =>
  tableSql("business_activity_qualifications", "business_activity_qualification_answers");
const answers = () =>
  tableSql(
    "business_activity_qualification_answers",
    "business_activity_classification_decisions",
  );
const classification = () =>
  tableSql(
    "business_activity_classification_decisions",
    "business_activity_support_assessments",
  );
const support = () =>
  tableSql(
    "business_activity_support_assessments",
    "business_activity_admission_decisions",
  );
const admission = () =>
  tableSql(
    "business_activity_admission_decisions",
    "business_activity_qualification_events",
  );
const events = () =>
  tableSql("business_activity_qualification_events", "business_activity_demand_signals");
const demand = () => tableSql("business_activity_demand_signals");

describe("BQA-1C migration inventory", () => {
  it("registers exactly two ordered additive BQA migrations after ORG-CONTEXT RPC", () => {
    const names = readdirSync(migrationsDir)
      .filter((name) => name.includes("business_qualification_admission"))
      .sort();
    expect(names).toEqual([SCHEMA_MIGRATION, RLS_MIGRATION]);
    expect(SCHEMA_MIGRATION > ORG_CONTEXT_RPC).toBe(true);
    expect(RLS_MIGRATION > SCHEMA_MIGRATION).toBe(true);
  });

  it("does not edit historical TAX/CAP/CTX, CONTROL-PLANE-READ, or ORG-CONTEXT migrations", () => {
    expect(readdirSync(migrationsDir)).toContain(CONTROL_PLANE_GRANT);
    expect(readdirSync(migrationsDir)).toContain(ORG_CONTEXT_RPC);
    expect(allBqaMigrations).not.toContain(
      "grant_control_plane_select_to_service_role",
    );
    expect(allBqaMigrations).not.toMatch(
      /alter table public\.organization_business_activities/i,
    );
    expect(allBqaMigrations).not.toMatch(
      /alter table public\.organization_context_assignments/i,
    );
  });
});

describe("BQA-1C table model", () => {
  it("creates exactly the seven contracted public tables", () => {
    for (const table of TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("business_activity_review_requests");
    expect(schemaMigration).not.toContain("business_activity_questions");
    expect(schemaMigration).not.toContain("qualification_questions");
    expect(schemaMigration).not.toContain("ai_classification_candidates");
    expect(schemaMigration).not.toContain("bqa_workflow_states");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
    expect(schemaMigration).not.toMatch(/create\s+type\s+\w+\s+as\s+enum/i);
    expect((schemaMigration.match(/create table public\./g) ?? []).length).toBe(
      7,
    );
  });

  it("does not add BQA shortcuts onto organizations or rewrite ORG-CONTEXT", () => {
    expect(allBqaMigrations).not.toMatch(/alter table public\.organizations/i);
    expect(allBqaMigrations).not.toMatch(/update public\.organizations/i);
    expect(allBqaMigrations).not.toMatch(/insert into public\.organizations/i);
    expect(allBqaMigrations).not.toContain("required_capability_readiness");
    expect(allBqaMigrations).not.toContain("minimum_cap_readiness");
    expect(allBqaMigrations).not.toContain("capability_entitlement");
  });
});

describe("BQA-1C qualification aggregate", () => {
  it("enforces one qualification per Activity and tenant-honest Activity ownership", () => {
    const sql = qualifications();
    expect(sql).toContain("business_activity_qualifications_activity_unique unique");
    expect(sql).toMatch(
      /business_activity_qualifications_activity_unique unique \(\s*organization_id,\s*business_activity_id\s*\)/,
    );
    expect(sql).toMatch(
      /business_activity_qualifications_activity_fk[\s\S]*foreign key \(\s*organization_id,\s*business_activity_id\s*\)[\s\S]*references public\.organization_business_activities \(organization_id, id\)[\s\S]*on delete restrict/,
    );
    expect(sql).not.toMatch(/on delete cascade/i);
  });

  it("owns only progress, review, split, and current pointers", () => {
    const sql = qualifications();
    expect(sql).toContain("progress_status");
    expect(sql).toContain("review_status");
    expect(sql).toContain("split_recommended");
    expect(sql).toContain("current_classification_decision_id");
    expect(sql).toContain("current_support_assessment_id");
    expect(sql).toContain("current_admission_decision_id");
    expect(sql).not.toContain("classification_outcome");
    expect(sql).not.toContain("support_status");
    expect(sql).not.toContain("admission_status");
    expect(sql).toMatch(/progress_status in \(/);
    expect(sql).toContain("'unstarted'");
    expect(sql).toContain("'collecting'");
    expect(sql).toContain("'awaiting_confirmation'");
    expect(sql).toContain("'requalifying'");
    expect(sql).toMatch(/review_status in \(/);
    expect(sql).toContain("'resolved_proceed'");
    expect(sql).toContain("'resolved_reject'");
  });
});

describe("BQA-1C answers", () => {
  it("stores one current row per qualification question_key without a question CMS", () => {
    const sql = answers();
    expect(sql).toContain(
      "business_activity_qualification_answers_current_unique unique",
    );
    expect(sql).toMatch(
      /unique \(\s*qualification_id,\s*question_key\s*\)/,
    );
    expect(sql).toContain("question_key");
    expect(sql).toContain("value_kind");
    expect(sql).toContain("value_text");
    expect(sql).toContain("value_code");
    expect(sql).not.toContain("question_prompt");
    expect(sql).not.toContain("question_text");
    expect(sql).toContain("'activity_description'");
    expect(sql).toContain("'structured_programs'");
    expect(sql).toContain("'one_line'");
  });
});

describe("BQA-1C classification decisions", () => {
  it("preserves TAX identity snapshot, provenance, and confirmation fields", () => {
    const sql = classification();
    expect(sql).toContain("taxonomy_target_id");
    expect(sql).toContain("taxonomy_target_kind");
    expect(sql).toContain("taxonomy_target_key");
    expect(sql).toContain("taxonomy_release_id");
    expect(sql).toContain("confidence_band in ('high', 'medium', 'low', 'none')");
    expect(sql).toContain("proposal_source");
    expect(sql).toContain("decision_source");
    expect(sql).toContain("confirmed_at");
    expect(sql).toContain("supersedes_decision_id");
    expect(sql).not.toContain("confidence_percent");
    expect(sql).not.toContain("ai_score");
    expect(sql).toContain("'chain_of_thought'");
    expect(sql).toContain("'ai_proposal'");
    expect(sql).toMatch(
      /decision_source is null\s+or decision_source in \([\s\S]*'user_self'/,
    );
    expect(sql).not.toMatch(
      /decision_source in \([\s\S]*'ai_proposal'/,
    );
  });

  it("requires confirmed classified rows to have target, source, actor, and timestamp", () => {
    const sql = classification();
    expect(sql).toContain(
      "business_activity_classification_decisions_confirmed_fields_check",
    );
    expect(sql).toContain("classification_outcome = 'classified'");
    expect(sql).toContain("decision_source is not null");
    expect(sql).toContain("confirmed_by_user_id is not null");
    expect(sql).toContain("confirmed_at is not null");
    expect(schemaMigration).toContain(
      "business_activity_classification_decisions_one_confirmed_uidx",
    );
    expect(schemaMigration).toMatch(
      /unique index business_activity_classification_decisions_one_confirmed_uidx[\s\S]*\(business_activity_id\)[\s\S]*where decision_status = 'confirmed'/,
    );
  });

  it("blocks self-supersession and keeps historical rows", () => {
    const sql = classification();
    expect(sql).toContain(
      "supersedes_decision_id is distinct from id",
    );
    expect(sql).not.toMatch(/on delete cascade/i);
    expect(schemaMigration).toContain(
      "classification decision cannot supersede itself",
    );
    expect(schemaMigration).toContain(
      "supersedes_decision_id must belong to the same qualification",
    );
  });
});

describe("BQA-1C support assessments", () => {
  it("snapshots catalog observation without requiring a Context pack on every row", () => {
    const sql = support();
    expect(sql).toContain("context_pack_id");
    expect(sql).toContain("context_pack_version_id");
    expect(sql).toContain("context_readiness");
    expect(sql).toContain("rollout_mode");
    expect(sql).toContain("support_status");
    expect(sql).toContain("'missing_context_pack'");
    expect(sql).toContain("'open_beta_policy_undefined'");
    expect(sql).toContain(
      "business_activity_support_assessments_eligible_context_check",
    );
    expect(sql).toContain("context_pack_id is not null");
    expect(sql).toMatch(
      /reason_code <> 'missing_context_pack'[\s\S]*context_pack_version_id is null/,
    );
    expect(sql).not.toContain("organization_context_assignment_id");
  });
});

describe("BQA-1C admission decisions", () => {
  it("keeps admission_status, rollout_mode, and reason_code orthogonal", () => {
    const sql = admission();
    expect(sql).toContain("'incomplete'");
    expect(sql).toContain("'waitlisted'");
    expect(sql).toContain("'admitted'");
    expect(sql).toContain("'open_beta'");
    expect(sql).not.toContain("'admitted_closed_beta'");
    expect(sql).not.toContain("'admitted_production'");
    expect(sql).toMatch(
      /admission_status = 'admitted'[\s\S]*rollout_mode = 'open_beta'/,
    );
    expect(sql).toContain("'path_b_independent'");
  });
});

describe("BQA-1C events and demand", () => {
  it("implements the frozen append-only event vocabulary", () => {
    const sql = events();
    for (const eventType of EVENT_TYPES) {
      expect(sql).toContain(`'${eventType}'`);
    }
    expect(sql).not.toContain("'read'");
    expect(sql).not.toContain("updated_at");
    expect(schemaMigration).toContain(
      "business activity qualification events are immutable",
    );
    expect(schemaMigration).toMatch(
      /before update or delete on public\.business_activity_qualification_events/,
    );
    expect(schemaMigration).toContain(
      "business_activity_qualification_events_idempotency_uidx",
    );
  });

  it("allows one active demand signal per Activity and TAX target", () => {
    const sql = demand();
    expect(sql).toContain("status in ('active', 'withdrawn')");
    expect(sql).not.toContain("vote_count");
    expect(sql).not.toContain("public_roadmap");
    expect(schemaMigration).toContain(
      "business_activity_demand_signals_one_active_uidx",
    );
    expect(schemaMigration).toMatch(
      /unique index business_activity_demand_signals_one_active_uidx[\s\S]*\(\s*business_activity_id,\s*taxonomy_target_id\s*\)[\s\S]*where status = 'active'/,
    );
  });
});

describe("BQA-1C tenant consistency and non-effects", () => {
  it("uses organization_id plus composite Activity FKs with RESTRICT on every table", () => {
    for (const table of TABLES) {
      expect(schemaMigration).toContain(`${table}_activity_fk`);
      expect(schemaMigration).toContain(`${table}_organization_fk`);
    }
    expect(allBqaMigrations).not.toMatch(
      /on delete cascade/i,
    );
  });

  it("does not mutate Activities, Context assignments, Path B, or catalogs", () => {
    expect(allBqaMigrations).not.toMatch(
      /^\s*insert into public\.organization_business_activities/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*update public\.organization_business_activities/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*insert into public\.organization_context_assignments/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*update public\.organization_context_assignments/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*insert into public\.organization_invitations/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*insert into public\.organization_members/im,
    );
    expect(allBqaMigrations).not.toMatch(
      /^\s*update public\.context_pack_readiness/im,
    );
    expect(allBqaMigrations).not.toContain("ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST");
    expect(schemaMigration).toContain(
      "Does not call apply_organization_context_platform_mutation",
    );
  });

  it("does not backfill BQA rows or convert onboarding", () => {
    for (const table of TABLES) {
      expect(allBqaMigrations).not.toMatch(
        new RegExp(`insert into public\\.${table}`, "i"),
      );
    }
    expect(allBqaMigrations).not.toContain("apply_organization_onboarding");
    expect(allBqaMigrations).not.toContain("business_type");
    expect(allBqaMigrations).not.toContain("registration_intents");
    expect(allBqaMigrations).not.toContain("qa_online_course_business");
  });
});

describe("BQA-1C RLS and grants", () => {
  it("enables RLS without FORCE and without authenticated write policies", () => {
    for (const table of TABLES) {
      expect(allBqaMigrations).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(allBqaMigrations).not.toMatch(/force row level security/i);
    expect(rlsMigration).not.toMatch(/for (insert|update|delete)/i);
    expect(rlsMigration).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("lets active members SELECT current BQA state and restricts events to Owner/Admin", () => {
    expect(rlsMigration).toContain(
      "business_activity_qualifications_select_member",
    );
    expect(rlsMigration).toContain("private.is_org_member(organization_id)");
    expect(rlsMigration).toContain(
      "business_activity_qualification_events_select_owner_admin",
    );
    expect(rlsMigration).toContain(
      "private.has_org_role(organization_id, array['owner', 'admin'])",
    );
    expect(rlsMigration).not.toMatch(
      /business_activity_qualification_events_select_member/,
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
      expect(rlsMigration).toContain(
        `grant select on table public.${table} to authenticated`,
      );
    }
    expect(rlsMigration).toContain(
      "grant select, insert, update on table public.business_activity_qualifications to service_role",
    );
    expect(rlsMigration).toContain(
      "grant select, insert on table public.business_activity_qualification_events to service_role",
    );
    expect(rlsMigration).not.toMatch(/^\s*grant\b.*\bdelete\b/im);
    expect(rlsMigration).not.toMatch(/grant all on all tables/i);
  });

  it("does not grant authenticated DML on CONTROL-PLANE TAX/CAP/CTX tables", () => {
    for (const table of CONTROL_PLANE_TABLES) {
      expect(allBqaMigrations).not.toContain(
        `grant select on table public.${table} to authenticated`,
      );
      expect(allBqaMigrations).not.toContain(
        `grant insert on table public.${table}`,
      );
    }
  });
});

describe("BQA-1C function security", () => {
  it("hardens integrity functions with empty search_path and EXECUTE revocation", () => {
    for (const fn of INTEGRITY_FUNCTIONS) {
      const name = fn.replace(/\(.*\)$/, "");
      expect(schemaMigration).toContain(`create or replace function ${name}`);
      expect(schemaMigration).toMatch(
        new RegExp(
          `${name.replace(".", "\\.")}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(allBqaMigrations).toContain(`revoke all on function ${fn} from public`);
      expect(allBqaMigrations).toContain(`revoke all on function ${fn} from anon`);
      expect(allBqaMigrations).toContain(
        `revoke all on function ${fn} from authenticated`,
      );
      expect(allBqaMigrations).toContain(
        `revoke all on function ${fn} from service_role`,
      );
    }
    expect(allBqaMigrations).not.toMatch(
      /create (or replace )?function public\./i,
    );
  });
});
