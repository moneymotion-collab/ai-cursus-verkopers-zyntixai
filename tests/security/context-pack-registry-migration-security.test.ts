import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260824190000_create_context_pack_registry.sql";
const SEED_MIGRATION = "20260824190010_seed_context_pack_registry_ctx1.sql";

const schemaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SCHEMA_MIGRATION),
  "utf8",
);

const CONTEXT_TABLES = [
  "context_packs",
  "context_pack_versions",
  "context_capability_mappings",
  "context_terminology",
  "context_pack_readiness",
] as const;

const INTEGRITY_FUNCTIONS = [
  "context_packs_protect_identity",
  "context_pack_versions_enforce_integrity",
  "context_pack_version_protect_children",
] as const;

describe("CTX-1B context pack registry schema contract", () => {
  it("creates exactly the five contracted public tables", () => {
    for (const table of CONTEXT_TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("organization_context");
    expect(schemaMigration).not.toContain("context_roles");
    expect(schemaMigration).not.toContain("context_work_areas");
    expect(schemaMigration).not.toContain("context_modules");
    expect(schemaMigration).not.toContain("context_kpis");
    expect(schemaMigration).not.toContain("context_templates");
    expect(schemaMigration).not.toContain("context_automations");
    expect(schemaMigration).not.toContain("context_ai_prompts");
    expect(schemaMigration).not.toContain("context_qualification_hints");
    expect(schemaMigration).not.toContain("context_data_mappings");
    expect(schemaMigration).not.toContain("context_integrations");
    expect(schemaMigration).not.toContain("context_data jsonb");
    expect(schemaMigration).not.toContain("context_definition");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
    expect(schemaMigration).not.toMatch(/create\s+type\s+\w+\s+as\s+enum/i);
  });

  it("uses UUID identity, unique pack_key, and no hardcoded UUID literals", () => {
    expect(schemaMigration).toContain("id uuid primary key default gen_random_uuid()");
    expect(schemaMigration).toContain("constraint context_packs_key_unique unique (pack_key)");
    expect(schemaMigration).toContain("constraint context_packs_key_format_check");
    expect(schemaMigration).toContain(
      String.raw`^[a-z][a-z0-9_]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$`,
    );
    expect(schemaMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
  });

  it("does not add tenant ownership columns or Organization FKs", () => {
    expect(schemaMigration).not.toMatch(/\borganization_id\b/);
    expect(schemaMigration).not.toMatch(/alter table public\.organizations/i);
    expect(schemaMigration).not.toContain("organization_context_assignments");
    expect(schemaMigration).not.toContain("organization_context_overrides");
  });

  it("locks pack_kind, lifecycle, and XOR typed TAX targets", () => {
    expect(schemaMigration).toContain("'foundation'");
    expect(schemaMigration).toContain("'industry'");
    expect(schemaMigration).toContain("'niche'");
    expect(schemaMigration).toContain("'specialization'");
    expect(schemaMigration).toContain("'deep_specialization'");
    expect(schemaMigration).toContain("constraint context_packs_kind_check");
    expect(schemaMigration).toContain(
      "lifecycle_status in ('draft', 'active', 'superseded')",
    );
    expect(schemaMigration).toContain("context_packs_exactly_one_target_check");
    expect(schemaMigration).toContain("context_packs_kind_target_check");
    expect(schemaMigration).toContain("pack_kind = 'foundation'");
    expect(schemaMigration).toContain("pack_kind = 'niche'");
    expect(schemaMigration).toMatch(
      /constraint context_packs_foundation_fk[\s\S]*references public\.taxonomy_foundations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_packs_industry_fk[\s\S]*references public\.taxonomy_industries \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_packs_niche_fk[\s\S]*references public\.taxonomy_niches \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_packs_specialization_fk[\s\S]*references public\.taxonomy_specializations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_packs_deep_specialization_fk[\s\S]*references public\.taxonomy_deep_specializations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).not.toContain("target_id uuid");
    expect(schemaMigration).not.toContain("target_type");
  });

  it("creates unique per-target indexes so each TAX node has at most one pack", () => {
    expect(schemaMigration).toContain("context_packs_foundation_id_uidx");
    expect(schemaMigration).toContain("context_packs_industry_id_uidx");
    expect(schemaMigration).toContain("context_packs_niche_id_uidx");
    expect(schemaMigration).toContain("context_packs_specialization_id_uidx");
    expect(schemaMigration).toContain("context_packs_deep_specialization_id_uidx");
  });

  it("separates version identity with publication, completeness, and parent FK", () => {
    expect(schemaMigration).toContain(
      "constraint context_pack_versions_pack_version_unique unique (pack_id, version_number)",
    );
    expect(schemaMigration).toMatch(
      /constraint context_pack_versions_pack_fk[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_pack_versions_parent_fk[\s\S]*references public\.context_pack_versions \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toContain(
      "publication_status in ('draft', 'published', 'superseded')",
    );
    expect(schemaMigration).toContain("completeness in ('full', 'delta')");
    expect(schemaMigration).toContain("change_impact in ('low', 'medium', 'high')");
    expect(schemaMigration).toContain("version_number > 0");
    expect(schemaMigration).toContain("parent_version_id <> id");
    expect(schemaMigration).toContain("definition_summary text not null");
    expect(schemaMigration).toContain("intended_operator text");
    expect(schemaMigration).toContain("primary_exchange text");
  });

  it("does not attach set_updated_at to immutable version rows", () => {
    expect(schemaMigration).not.toContain("context_pack_versions_set_updated_at");
    expect(schemaMigration).toContain("No updated_at / set_updated_at");
    expect(schemaMigration).toContain("create trigger context_packs_set_updated_at");
    expect(schemaMigration).toContain(
      "create trigger context_pack_readiness_set_updated_at",
    );
  });

  it("models SET/REMOVE relevance without fake REMOVE relevance and with CAP FKs", () => {
    expect(schemaMigration).toContain(
      "primary key (version_id, capability_id)",
    );
    expect(schemaMigration).toContain("mapping_op in ('set', 'remove')");
    expect(schemaMigration).toMatch(
      /mapping_op = 'set'\s+and relevance in \('required', 'recommended', 'optional'\)/,
    );
    expect(schemaMigration).toMatch(
      /mapping_op = 'remove'\s+and relevance is null/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_capability_mappings_capability_fk[\s\S]*references public\.capabilities \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint context_capability_mappings_version_fk[\s\S]*on delete restrict/,
    );
  });

  it("stores terminology with unique version/locale/term_key and governed term_key", () => {
    expect(schemaMigration).toContain(
      "constraint context_terminology_version_locale_key_unique",
    );
    expect(schemaMigration).toContain("unique (version_id, locale, term_key)");
    expect(schemaMigration).toContain(String.raw`^[a-z][a-z0-9_]*$`);
    expect(schemaMigration).toContain("singular_label text not null");
    expect(schemaMigration).toContain("plural_label text not null");
    expect(schemaMigration).toContain("short_label text");
    expect(schemaMigration).toContain("help_text text");
  });

  it("separates readiness from publication with object scope and evidence integrity", () => {
    expect(schemaMigration).toContain(
      "constraint context_pack_readiness_version_unique unique (version_id)",
    );
    expect(schemaMigration).toContain("'planned'");
    expect(schemaMigration).toContain("'context_ready'");
    expect(schemaMigration).toContain("'beta_supported'");
    expect(schemaMigration).toContain("'production_verified'");
    expect(schemaMigration).not.toContain("'foundation_ready'");
    expect(schemaMigration).toContain("jsonb_typeof(supported_scope) = 'object'");
    expect(schemaMigration).toContain("readiness_status = 'planned'");
    expect(schemaMigration).toContain("supported_scope <> '{}'::jsonb");
    expect(schemaMigration).toMatch(
      /readiness_status in \('planned', 'context_ready'\)\s+and verified_at is null/,
    );
    expect(schemaMigration).toContain(
      "readiness_status in ('beta_supported', 'production_verified')",
    );
  });

  it("creates only contracted lookup indexes", () => {
    expect(schemaMigration).toContain("context_pack_versions_parent_version_id_idx");
    expect(schemaMigration).toContain("context_capability_mappings_capability_id_idx");
    expect(schemaMigration).not.toMatch(/\bgin\b/i);
    expect(schemaMigration).not.toContain("pg_trgm");
    expect(schemaMigration).not.toContain("to_tsvector");
  });

  it("documents relevance vs authority and published vs production_verified", () => {
    expect(schemaMigration).toContain("CONTEXT CONTROLS RELEVANCE");
    expect(schemaMigration).toContain("PERMISSIONS CONTROL AUTHORITY");
    expect(schemaMigration).toContain("published != production_verified");
    expect(schemaMigration).toContain("context_ready != production_verified");
    expect(schemaMigration).toContain("Not a copy of capability_dependencies");
  });
});

describe("CTX-1B context pack registry security contract", () => {
  it("enables RLS without FORCE and without policies or Context RPCs", () => {
    for (const table of CONTEXT_TABLES) {
      expect(schemaMigration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(schemaMigration).not.toMatch(
      /^\s*alter table\s+\S+\s+force row level security/im,
    );
    expect(schemaMigration).not.toMatch(/^\s*create policy/im);
    expect(schemaMigration).not.toMatch(/security definer/i);
    expect(schemaMigration).not.toMatch(/^\s*grant\s+/im);
  });

  it("revokes all table privileges from public, anon, authenticated, and service_role", () => {
    for (const table of CONTEXT_TABLES) {
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(schemaMigration).toContain(
          `revoke all on table public.${table} from ${role}`,
        );
      }
    }
  });

  it("revokes EXECUTE on internal integrity functions from runtime roles", () => {
    for (const fn of INTEGRITY_FUNCTIONS) {
      expect(schemaMigration).toContain(
        `create or replace function public.${fn}()`,
      );
      expect(schemaMigration).toContain("security invoker");
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(schemaMigration).toContain(
          `revoke all on function public.${fn}() from ${role}`,
        );
      }
    }
    expect(schemaMigration).toContain("Internal integrity trigger only. Not a Context RPC");
  });
});

describe("CTX-1B context pack migration inventory", () => {
  it("registers exactly two ordered context pack migrations", () => {
    const context = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("context_pack") || name.includes("context-pack"))
      .sort();
    expect(context).toEqual([SCHEMA_MIGRATION, SEED_MIGRATION]);
    expect(SEED_MIGRATION > SCHEMA_MIGRATION).toBe(true);
  });
});
