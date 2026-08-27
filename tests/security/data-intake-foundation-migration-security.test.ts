import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260827140000_create_data_intake_foundation.sql";
const RLS_MIGRATION = "20260827140010_enable_data_intake_rls.sql";
const STORAGE_MIGRATION = "20260827140020_add_data_intake_storage_bucket.sql";
const CUSTOMER_HELPER = "20260705170000_add_private_create_customer_record.sql";
const CUSTOMER_TABLE = "20260705160001_create_customers.sql";
const BQA_HANDOFF = "20260827120000_add_business_qualification_assignment_handoff.sql";
const BQA_MUTATION = "20260826190000_add_business_qualification_support_admission_mutations.sql";
const ORG_CONTEXT_RPC = "20260825130000_add_organization_context_platform_mutations.sql";

const TABLES = [
  "data_intake_sessions",
  "data_intake_sources",
  "data_intake_mappings",
  "data_intake_staging_rows",
  "data_import_plans",
  "data_intake_events",
  "data_external_record_links",
  "data_import_row_results",
] as const;

const EVENT_TYPES = [
  "intake_created",
  "source_uploaded",
  "source_replaced",
  "source_parsed",
  "mapping_proposed",
  "mapping_confirmed",
  "validation_completed",
  "plan_created",
  "plan_approved",
  "plan_superseded",
  "import_started",
  "import_batch_completed",
  "import_completed",
  "import_failed",
  "import_cancelled",
] as const;

const SESSION_STATUSES = [
  "created",
  "source_ready",
  "parsed",
  "mapping_required",
  "mapped",
  "validating",
  "review_required",
  "ready_for_approval",
  "approved",
  "importing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
] as const;

const migrationsDir = join(process.cwd(), "supabase/migrations");
const schemaMigration = readFileSync(join(migrationsDir, SCHEMA_MIGRATION), "utf8");
const rlsMigration = readFileSync(join(migrationsDir, RLS_MIGRATION), "utf8");
const storageMigration = readFileSync(join(migrationsDir, STORAGE_MIGRATION), "utf8");
const allDataMigrations = `${schemaMigration}\n${rlsMigration}\n${storageMigration}`;

function tableSql(table: string, nextTable?: string): string {
  const start = schemaMigration.indexOf(`create table public.${table}`);
  expect(start).toBeGreaterThan(-1);
  const end = nextTable
    ? schemaMigration.indexOf(`create table public.${nextTable}`)
    : schemaMigration.indexOf("create trigger data_intake_sessions_set_updated_at");
  expect(end).toBeGreaterThan(start);
  return schemaMigration.slice(start, end);
}

describe("DATA-1C migration inventory", () => {
  it("registers the three frozen DATA-1C migrations in order before later DATA phases", () => {
    const names = readdirSync(migrationsDir)
      .filter((name) => name.includes("data_intake"))
      .sort();
    expect(names.slice(0, 3)).toEqual([SCHEMA_MIGRATION, RLS_MIGRATION, STORAGE_MIGRATION]);
    expect(SCHEMA_MIGRATION > BQA_HANDOFF).toBe(true);
    expect(RLS_MIGRATION > SCHEMA_MIGRATION).toBe(true);
    expect(STORAGE_MIGRATION > RLS_MIGRATION).toBe(true);
  });

  it("does not edit historical Customer, BQA, or ORG-CONTEXT migrations", () => {
    expect(readdirSync(migrationsDir)).toContain(CUSTOMER_HELPER);
    expect(readdirSync(migrationsDir)).toContain(CUSTOMER_TABLE);
    expect(readdirSync(migrationsDir)).toContain(BQA_MUTATION);
    expect(readdirSync(migrationsDir)).toContain(ORG_CONTEXT_RPC);
    expect(allDataMigrations).not.toMatch(/alter table public\.customers/i);
    expect(allDataMigrations).not.toMatch(/create or replace function private\.create_customer_record/i);
    expect(allDataMigrations).not.toMatch(/alter function private\.create_customer_record/i);
    expect(allDataMigrations).not.toMatch(/create or replace function public\.create_customer\(/i);
    expect(allDataMigrations).not.toMatch(/alter table public\.business_activity_qualifications/i);
    expect(allDataMigrations).not.toMatch(/alter table public\.organization_context_assignments/i);
    expect(allDataMigrations).not.toContain("apply_business_qualification_mutation");
    expect(allDataMigrations).not.toContain("apply_organization_context");
  });
});

describe("DATA-1C table model", () => {
  it("creates exactly the eight contracted public tables", () => {
    for (const table of TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("data_import_jobs");
    expect(schemaMigration).not.toContain("data_plan_rows");
    expect(schemaMigration).not.toContain("data_mapping_templates");
    expect(schemaMigration).not.toContain("customer_intake_staging");
    expect((schemaMigration.match(/create table public\./g) ?? []).length).toBe(8);
  });
});

describe("DATA-1C session aggregate", () => {
  it("enforces tenant uniqueness, Customer Activity NULL, and frozen statuses", () => {
    const sql = tableSql("data_intake_sessions", "data_intake_sources");
    expect(sql).toContain("data_intake_sessions_org_id_unique unique (organization_id, id)");
    expect(sql).toMatch(/on delete restrict/);
    expect(sql).toContain("data_intake_sessions_customer_activity_null_check");
    expect(sql).toContain("target_domain <> 'customer'");
    expect(sql).toContain("business_activity_id is null");
    for (const status of SESSION_STATUSES) {
      expect(sql).toContain(`'${status}'`);
    }
    expect(sql).not.toContain("archived_at");
    expect(sql).toContain("execution_lease_token");
    expect(sql).toContain("cancel_requested");
  });
});

describe("DATA-1C source model", () => {
  it("enforces one active source per session and immutable hash/path", () => {
    const sql = tableSql("data_intake_sources", "data_intake_mappings");
    expect(sql).toContain("data_intake_sources_session_fk");
    expect(sql).toContain("foreign key (organization_id, session_id)");
    expect(sql).toContain("sha256 ~ '^[0-9a-f]{64}$'");
    expect(sql).toContain("byte_size <= 10485760");
    expect(schemaMigration).toContain(
      "create unique index data_intake_sources_one_active_per_session_idx",
    );
    expect(schemaMigration).toContain("where superseded_at is null");
    expect(schemaMigration).toContain(
      "DATA: source artifact identity and content metadata are immutable",
    );
  });
});

describe("DATA-1C mapping model", () => {
  it("stores semantic target_field metadata without SQL-identifier authority", () => {
    const sql = tableSql("data_intake_mappings", "data_intake_staging_rows");
    expect(sql).toContain("unique (source_id, source_field_key)");
    expect(sql).toContain("'proposed'");
    expect(sql).toContain("'deterministic'");
    expect(sql).toContain("'email_normalize'");
    expect(sql).toContain("never a SQL identifier");
    expect(allDataMigrations).not.toMatch(/execute\s+.*target_field/i);
    expect(allDataMigrations).not.toContain("format('%I'");
    expect(allDataMigrations).not.toContain("quote_ident");
  });
});

describe("DATA-1C staging model", () => {
  it("uses generic JSONB with lifecycle/resolution and fingerprint uniqueness", () => {
    const sql = tableSql("data_intake_staging_rows", "data_import_plans");
    expect(sql).toContain("unique (source_id, source_row_number)");
    expect(sql).toContain("unique (source_id, row_fingerprint)");
    expect(sql).toContain("'pending'");
    expect(sql).toContain("'validated'");
    expect(sql).toContain("'duplicate'");
    expect(sql).not.toContain("'valid'");
    expect(sql).not.toContain("'warning'");
    expect(sql).toContain("jsonb_typeof(raw_values) = 'object'");
    expect(sql).toContain("on delete restrict");
  });
});

describe("DATA-1C plan model", () => {
  it("versions plans, freezes approved snapshots, and stores fingerprint arrays", () => {
    const sql = tableSql("data_import_plans", "data_intake_events");
    expect(sql).toContain("unique (session_id, version)");
    expect(sql).toContain("jsonb_typeof(included_fingerprints) = 'array'");
    expect(sql).toContain("jsonb_typeof(mapping_snapshot) = 'object'");
    expect(schemaMigration).toContain(
      "create unique index data_import_plans_one_approved_or_executing_per_session_idx",
    );
    expect(schemaMigration).toContain("DATA: approved plan snapshot is immutable");
    expect(schemaMigration).toContain("old.source_sha256 is distinct from new.source_sha256");
    expect(schemaMigration).toContain("old.adapter_version is distinct from new.adapter_version");
    expect(schemaMigration).toContain("old.mapping_snapshot is distinct from new.mapping_snapshot");
    expect(schemaMigration).toContain(
      "old.included_fingerprints is distinct from new.included_fingerprints",
    );
    expect(schemaMigration).toContain("old.plan_hash is distinct from new.plan_hash");
  });
});

describe("DATA-1C events", () => {
  it("is append-only with the frozen vocabulary and no raw row content", () => {
    const sql = tableSql("data_intake_events", "data_external_record_links");
    for (const eventType of EVENT_TYPES) {
      expect(sql).toContain(`'${eventType}'`);
    }
    expect(schemaMigration).toContain("data intake events are immutable");
    expect(schemaMigration).toContain("before update on public.data_intake_events");
    expect(schemaMigration).toContain("before delete on public.data_intake_events");
    expect(rlsMigration).toContain("grant select, insert on table public.data_intake_events to service_role");
    expect(rlsMigration).not.toMatch(
      /grant update on table public\.data_intake_events/i,
    );
    expect(rlsMigration).not.toMatch(
      /grant delete on table public\.data_intake_events/i,
    );
  });
});

describe("DATA-1C external links and row results", () => {
  it("keeps polymorphic targets without Customer FKs and unique plan fingerprints", () => {
    const links = tableSql("data_external_record_links", "data_import_row_results");
    const results = tableSql("data_import_row_results");
    expect(links).toContain("data_external_record_links_external_unique unique");
    expect(links).not.toContain("references public.customers");
    expect(results).not.toContain("references public.customers");
    expect(results).toContain("unique (plan_id, row_fingerprint)");
    expect(results).toContain("on delete restrict");
    expect(results).not.toMatch(/on delete cascade/i);
  });
});

describe("DATA-1C RLS and RPC", () => {
  it("denies authenticated DML/SELECT and grants service_role executor only", () => {
    for (const table of TABLES) {
      expect(rlsMigration).toContain(`alter table public.${table} enable row level security`);
      expect(rlsMigration).toContain(`revoke all on table public.${table} from authenticated`);
      expect(rlsMigration).toContain(`revoke all on table public.${table} from anon`);
      expect(rlsMigration).not.toContain(`grant select on table public.${table} to authenticated`);
      expect(rlsMigration).not.toContain(`create policy ${table}`);
    }
    expect(rlsMigration).toContain(
      "grant execute on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) to service_role",
    );
    expect(rlsMigration).toContain(
      "revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from authenticated",
    );
    expect(rlsMigration).toContain("auth.role() is distinct from 'service_role'");
    expect(rlsMigration).toContain("v_member_role not in ('owner', 'admin')");
    expect(rlsMigration).toContain("'FORBIDDEN_ROLE'");
    expect(rlsMigration).toContain("'ACTIVITY_NOT_ALLOWED_FOR_TARGET'");
    expect(rlsMigration).toContain("p_operation not in ('create_session', 'register_source', 'cancel_session')");
    expect(rlsMigration).not.toContain("csv-parse");
    expect(rlsMigration).not.toContain("papaparse");
    expect(rlsMigration).not.toContain("sheetjs");
  });
});

describe("DATA-1C delete safety", () => {
  it("does not cascade from intake tables to customers", () => {
    expect(schemaMigration).not.toMatch(/references public\.customers[\s\S]*on delete cascade/i);
    expect(schemaMigration).not.toMatch(/references public\.customers/);
    const childFks = [
      "data_intake_sources_session_fk",
      "data_intake_mappings_session_fk",
      "data_intake_staging_rows_session_fk",
      "data_import_plans_session_fk",
      "data_intake_events_session_fk",
      "data_import_row_results_session_fk",
    ];
    for (const name of childFks) {
      expect(schemaMigration).toContain(name);
    }
    expect(schemaMigration).not.toContain("data_intake_sessions_organization_fk foreign key (organization_id)\n    references public.organizations (id)\n    on delete cascade");
  });
});
