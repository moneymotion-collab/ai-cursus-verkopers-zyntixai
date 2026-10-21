import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260824153300_create_taxonomy_registry.sql";
const SEED_MIGRATION = "20260824153310_seed_taxonomy_registry_tax1.sql";

const schemaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SCHEMA_MIGRATION),
  "utf8",
);

const seedMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SEED_MIGRATION),
  "utf8",
);

const TAXONOMY_TABLES = [
  "taxonomy_releases",
  "taxonomy_foundations",
  "taxonomy_industries",
  "taxonomy_niches",
  "taxonomy_specializations",
  "taxonomy_deep_specializations",
  "taxonomy_aliases",
] as const;

describe("TAX-1B taxonomy registry schema contract", () => {
  it("creates exactly the seven typed public tables without a generic node table", () => {
    for (const table of TAXONOMY_TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("taxonomy_nodes");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
  });

  it("uses UUID PKs and unique stable keys without hardcoded UUID literals", () => {
    expect(schemaMigration).toContain("id uuid primary key default gen_random_uuid()");
    expect(schemaMigration).toContain("constraint taxonomy_releases_key_unique unique (key)");
    expect(schemaMigration).toContain("constraint taxonomy_foundations_key_unique unique (key)");
    expect(schemaMigration).toContain("constraint taxonomy_industries_key_unique unique (key)");
    expect(schemaMigration).toContain("constraint taxonomy_niches_key_unique unique (key)");
    expect(schemaMigration).toContain(
      "constraint taxonomy_specializations_key_unique unique (key)",
    );
    expect(schemaMigration).toContain(
      "constraint taxonomy_deep_specializations_key_unique unique (key)",
    );
    expect(schemaMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
  });

  it("does not add tenant ownership columns or Organization FKs", () => {
    expect(schemaMigration).not.toMatch(/\borganization_id\b/);
    expect(schemaMigration).not.toMatch(/alter table public\.organizations/i);
    expect(schemaMigration).not.toContain("business_activities");
  });

  it("implements typed parent FKs with ON DELETE RESTRICT", () => {
    expect(schemaMigration).toMatch(
      /constraint taxonomy_industries_foundation_fk[\s\S]*references public\.taxonomy_foundations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint taxonomy_niches_industry_fk[\s\S]*references public\.taxonomy_industries \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint taxonomy_specializations_niche_fk[\s\S]*references public\.taxonomy_niches \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint taxonomy_deep_specializations_specialization_fk[\s\S]*references public\.taxonomy_specializations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).not.toContain("parent_id");
  });

  it("locks lifecycle and visibility with text CHECKs and no readiness values", () => {
    for (const table of [
      "taxonomy_foundations",
      "taxonomy_industries",
      "taxonomy_niches",
      "taxonomy_specializations",
      "taxonomy_deep_specializations",
    ]) {
      expect(schemaMigration).toContain(`${table}_lifecycle_status_check`);
      expect(schemaMigration).toContain(`${table}_catalog_visibility_check`);
    }
    expect(schemaMigration).toContain("taxonomy_releases_lifecycle_status_check");
    expect(schemaMigration).toContain("lifecycle_status in ('draft', 'active', 'superseded')");
    expect(schemaMigration).toContain("catalog_visibility in ('internal', 'listed')");
    expect(schemaMigration).not.toContain("planned");
    expect(schemaMigration).not.toContain("context_ready");
    expect(schemaMigration).not.toContain("foundation_ready");
    expect(schemaMigration).not.toContain("beta_supported");
    expect(schemaMigration).not.toContain("production_verified");
  });

  it("requires introduced_in_release_id and same-table supersession integrity", () => {
    expect(schemaMigration).toContain("introduced_in_release_id uuid not null");
    expect(schemaMigration).toContain("taxonomy_foundations_introduced_release_fk");
    expect(schemaMigration).toContain("taxonomy_foundations_superseded_by_fk");
    expect(schemaMigration).toContain("taxonomy_industries_superseded_by_fk");
    expect(schemaMigration).toContain("taxonomy_niches_superseded_by_fk");
    expect(schemaMigration).toContain("taxonomy_specializations_superseded_by_fk");
    expect(schemaMigration).toContain("taxonomy_deep_specializations_superseded_by_fk");
    expect(schemaMigration).toContain("superseded_by_id <> id");
    expect(schemaMigration).toMatch(
      /lifecycle_status = 'superseded'\s+and superseded_by_id is not null/,
    );
    expect(schemaMigration).toMatch(
      /lifecycle_status <> 'superseded'\s+and superseded_by_id is null/,
    );
  });

  it("enforces alias XOR targets, generated normalization, and partial unique mappings", () => {
    expect(schemaMigration).toContain(
      "alias_normalized text generated always as (lower(btrim(alias_label))) stored",
    );
    expect(schemaMigration).toContain("taxonomy_aliases_exactly_one_target_check");
    expect(schemaMigration).toContain("taxonomy_aliases_foundation_fk");
    expect(schemaMigration).toContain("taxonomy_aliases_industry_fk");
    expect(schemaMigration).toContain("taxonomy_aliases_niche_fk");
    expect(schemaMigration).toContain("taxonomy_aliases_specialization_fk");
    expect(schemaMigration).toContain("taxonomy_aliases_deep_specialization_fk");
    expect(schemaMigration).toContain("taxonomy_aliases_foundation_mapping_uidx");
    expect(schemaMigration).toContain("taxonomy_aliases_industry_mapping_uidx");
    expect(schemaMigration).toContain("taxonomy_aliases_niche_mapping_uidx");
    expect(schemaMigration).toContain("taxonomy_aliases_specialization_mapping_uidx");
    expect(schemaMigration).toContain("taxonomy_aliases_deep_specialization_mapping_uidx");
    expect(schemaMigration).toContain(
      "on public.taxonomy_aliases (locale, alias_normalized, niche_id)",
    );
    expect(schemaMigration).not.toContain("target_id uuid");
  });

  it("creates only contracted lookup indexes", () => {
    expect(schemaMigration).toContain("taxonomy_industries_foundation_id_idx");
    expect(schemaMigration).toContain("taxonomy_niches_industry_id_idx");
    expect(schemaMigration).toContain("taxonomy_specializations_niche_id_idx");
    expect(schemaMigration).toContain(
      "taxonomy_deep_specializations_specialization_id_idx",
    );
    expect(schemaMigration).toContain("taxonomy_aliases_locale_normalized_idx");
    expect(schemaMigration).toContain("taxonomy_niches_visibility_lifecycle_idx");
    expect(schemaMigration).not.toMatch(/\bgin\b/i);
    expect(schemaMigration).not.toContain("pg_trgm");
    expect(schemaMigration).not.toContain("to_tsvector");
  });

  it("attaches set_updated_at triggers on all seven tables", () => {
    for (const table of TAXONOMY_TABLES) {
      expect(schemaMigration).toContain(`${table}_set_updated_at`);
      expect(schemaMigration).toContain(`before update on public.${table}`);
    }
    expect(schemaMigration).toContain("execute function public.set_updated_at()");
  });
});

describe("TAX-1B taxonomy registry security contract", () => {
  it("enables RLS without FORCE and without policies or RPCs", () => {
    for (const table of TAXONOMY_TABLES) {
      expect(schemaMigration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(schemaMigration).not.toMatch(
      /^\s*alter table\s+\S+\s+force row level security/im,
    );
    expect(schemaMigration).not.toMatch(/^\s*create policy/im);
    expect(schemaMigration).not.toMatch(
      /create or replace function public\.taxonomy_/i,
    );
    expect(schemaMigration).not.toMatch(/security definer/i);
  });

  it("revokes all table privileges from public, anon, authenticated, and service_role", () => {
    for (const table of TAXONOMY_TABLES) {
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(schemaMigration).toContain(
          `revoke all on table public.${table} from ${role}`,
        );
      }
    }
    expect(schemaMigration).not.toMatch(/^\s*grant\s+(select|insert|update|delete|all)\b/im);
  });
});

describe("TAX-1B taxonomy migration inventory", () => {
  it("registers exactly two ordered taxonomy migrations", () => {
    const taxonomy = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("taxonomy"))
      .sort();
    expect(taxonomy).toEqual([SCHEMA_MIGRATION, SEED_MIGRATION]);
    expect(SEED_MIGRATION > SCHEMA_MIGRATION).toBe(true);
  });
});
