import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260824180000_create_capability_registry.sql";
const SEED_MIGRATION = "20260824180010_seed_capability_registry_cap1.sql";
const FOUR_TG_SEED_MIGRATION = "20260901100000_seed_capability_registry_4tg_cap2.sql";

const schemaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SCHEMA_MIGRATION),
  "utf8",
);

const CAPABILITY_TABLES = [
  "capabilities",
  "capability_dependencies",
  "capability_readiness",
] as const;

describe("CAP-1B capability registry schema contract", () => {
  it("creates exactly the three contracted public tables", () => {
    for (const table of CAPABILITY_TABLES) {
      expect(schemaMigration).toContain(`create table public.${table}`);
    }
    expect(schemaMigration).not.toContain("capability_releases");
    expect(schemaMigration).not.toContain("capability_domains");
    expect(schemaMigration).not.toContain("capability_modules");
    expect(schemaMigration).not.toContain("capability_conflicts");
    expect(schemaMigration).not.toContain("organization_capabilities");
    expect(schemaMigration).not.toContain("capability_permissions");
    expect(schemaMigration).not.toContain("capability_niches");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
    expect(schemaMigration).not.toMatch(/create\s+type\s+\w+\s+as\s+enum/i);
  });

  it("uses UUID identity, unique dotted keys, and no hardcoded UUID literals", () => {
    expect(schemaMigration).toContain("id uuid primary key default gen_random_uuid()");
    expect(schemaMigration).toContain("constraint capabilities_key_unique unique (capability_key)");
    expect(schemaMigration).toContain("constraint capabilities_key_format_check");
    expect(schemaMigration).toContain(
      String.raw`^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)+$`,
    );
    expect(schemaMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
  });

  it("does not add tenant ownership columns or Organization FKs", () => {
    expect(schemaMigration).not.toMatch(/\borganization_id\b/);
    expect(schemaMigration).not.toMatch(/alter table public\.organizations/i);
    expect(schemaMigration).not.toContain("organization_capability");
  });

  it("locks owner_class and Foundation FK consistency without hardcoded Foundation names", () => {
    expect(schemaMigration).toContain(
      "owner_class in ('core', 'shared', 'foundation', 'horizontal')",
    );
    expect(schemaMigration).toContain("capabilities_owner_foundation_consistency_check");
    expect(schemaMigration).toMatch(
      /owner_class = 'foundation'\s+and foundation_id is not null/,
    );
    expect(schemaMigration).toMatch(
      /owner_class <> 'foundation'\s+and foundation_id is null/,
    );
    expect(schemaMigration).toMatch(
      /constraint capabilities_foundation_fk[\s\S]*references public\.taxonomy_foundations \(id\)[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).not.toContain("field-operations");
    expect(schemaMigration).not.toContain("product-operations");
  });

  it("locks lifecycle, visibility, and supersession with text CHECKs", () => {
    expect(schemaMigration).toContain(
      "lifecycle_status in ('draft', 'active', 'deprecated', 'superseded')",
    );
    expect(schemaMigration).toContain("catalog_visibility in ('internal', 'listed')");
    expect(schemaMigration).toContain("capabilities_superseded_by_fk");
    expect(schemaMigration).toContain("superseded_by_capability_id <> id");
    expect(schemaMigration).toMatch(
      /lifecycle_status = 'superseded'\s+and superseded_by_capability_id is not null/,
    );
    expect(schemaMigration).toMatch(
      /lifecycle_status <> 'superseded'\s+and superseded_by_capability_id is null/,
    );
  });

  it("models hard requires edges without relation types or self-edges", () => {
    expect(schemaMigration).toContain("constraint capability_dependencies_pkey");
    expect(schemaMigration).toContain("primary key (capability_id, depends_on_capability_id)");
    expect(schemaMigration).toContain("capability_id <> depends_on_capability_id");
    expect(schemaMigration).toMatch(
      /constraint capability_dependencies_capability_fk[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).toMatch(
      /constraint capability_dependencies_depends_on_fk[\s\S]*on delete restrict/,
    );
    expect(schemaMigration).not.toContain("recommended");
    expect(schemaMigration).not.toContain("optional");
    expect(schemaMigration).not.toContain("conflicts_with");
    expect(schemaMigration).not.toContain("extends");
  });

  it("separates readiness from existence with object scope and evidence integrity", () => {
    expect(schemaMigration).toContain("constraint capability_readiness_capability_unique unique (capability_id)");
    expect(schemaMigration).toContain("'planned'");
    expect(schemaMigration).toContain("'context_ready'");
    expect(schemaMigration).toContain("'foundation_ready'");
    expect(schemaMigration).toContain("'beta_supported'");
    expect(schemaMigration).toContain("'production_verified'");
    expect(schemaMigration).toContain("jsonb_typeof(supported_scope) = 'object'");
    expect(schemaMigration).toContain("readiness_status = 'planned'");
    expect(schemaMigration).toContain("supported_scope <> '{}'::jsonb");
    expect(schemaMigration).toContain("verified_at is not null");
    expect(schemaMigration).toMatch(
      /readiness_status in \('planned', 'context_ready', 'foundation_ready'\)\s+and verified_at is null/,
    );
  });

  it("creates only contracted lookup indexes", () => {
    expect(schemaMigration).toContain("capabilities_owner_idx");
    expect(schemaMigration).toContain("capabilities_lifecycle_visibility_idx");
    expect(schemaMigration).toContain("capabilities_foundation_id_idx");
    expect(schemaMigration).toContain("capability_dependencies_depends_on_idx");
    expect(schemaMigration).not.toMatch(/\bgin\b/i);
    expect(schemaMigration).not.toContain("pg_trgm");
    expect(schemaMigration).not.toContain("to_tsvector");
  });

  it("attaches set_updated_at triggers on all three tables", () => {
    for (const table of CAPABILITY_TABLES) {
      expect(schemaMigration).toContain(`${table}_set_updated_at`);
      expect(schemaMigration).toContain(`before update on public.${table}`);
    }
    expect(schemaMigration).toContain("execute function public.set_updated_at()");
  });

  it("documents production_verified is not execution enabled", () => {
    expect(schemaMigration).toContain("production_verified != execution enabled");
    expect(schemaMigration).toContain("listed != client/public runtime access");
    expect(schemaMigration).toContain("Not permission");
  });
});

describe("CAP-1B capability registry security contract", () => {
  it("enables RLS without FORCE and without policies or RPCs", () => {
    for (const table of CAPABILITY_TABLES) {
      expect(schemaMigration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(schemaMigration).not.toMatch(
      /^\s*alter table\s+\S+\s+force row level security/im,
    );
    expect(schemaMigration).not.toMatch(/^\s*create policy/im);
    expect(schemaMigration).not.toMatch(
      /create or replace function public\.(capabilit)/i,
    );
    expect(schemaMigration).not.toMatch(/security definer/i);
  });

  it("revokes all table privileges from public, anon, authenticated, and service_role", () => {
    for (const table of CAPABILITY_TABLES) {
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(schemaMigration).toContain(
          `revoke all on table public.${table} from ${role}`,
        );
      }
    }
    expect(schemaMigration).not.toMatch(/^\s*grant\s+(select|insert|update|delete|all)\b/im);
  });
});

describe("CAP-1B capability migration inventory", () => {
  it("registers the frozen CAP-1 pair first and the additive 4TG seed after it", () => {
    const capability = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("capability"))
      .sort();
    expect(capability[0]).toBe(SCHEMA_MIGRATION);
    expect(capability[1]).toBe(SEED_MIGRATION);
    expect(capability[2]).toBe(FOUR_TG_SEED_MIGRATION);
    expect(SEED_MIGRATION > SCHEMA_MIGRATION).toBe(true);
    expect(FOUR_TG_SEED_MIGRATION > SEED_MIGRATION).toBe(true);
  });
});
