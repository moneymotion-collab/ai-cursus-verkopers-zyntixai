import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260824190000_create_context_pack_registry.sql";
const SEED_MIGRATION = "20260824190010_seed_context_pack_registry_ctx1.sql";
const FIX_MIGRATION = "20260824200500_fix_context_pack_key_format_check.sql";

const ORIGINAL_POSIX = String.raw`^[a-z][a-z0-9_]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$`;
const REPLACEMENT_POSIX = "^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$";
const REPLACEMENT_JS = /^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$/;

const VALID_KEYS = [
  "foundation.knowledge",
  "niche.online-course-business",
  "foundation.knowledge-base",
  "shared.crm",
  "horizontal.social-publishing",
] as const;

const INVALID_KEYS = [
  "foundation",
  "Foundation.knowledge",
  ".foundation",
  "foundation.",
  "foundation..knowledge",
  "foundation._knowledge",
  "foundation.-knowledge",
  "foundation.online_course",
  "foundation.knowledge-",
  "foundation.knowledge..extra",
] as const;

const schemaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SCHEMA_MIGRATION),
  "utf8",
);
const seedMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SEED_MIGRATION),
  "utf8",
);
const fixMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", FIX_MIGRATION),
  "utf8",
);

describe("CTX-1FV-R1A context pack key format remediation", () => {
  it("targets only context_packs_key_format_check on public.context_packs", () => {
    expect(fixMigration).toContain("alter table public.context_packs");
    expect(fixMigration).toContain("drop constraint context_packs_key_format_check");
    expect(fixMigration).toContain("add constraint context_packs_key_format_check");
    expect(fixMigration).not.toMatch(/drop constraint if exists/i);
    expect(fixMigration).not.toMatch(/create table/i);
    expect(fixMigration).not.toMatch(/^\s*drop table\b/im);
    expect(fixMigration).not.toMatch(/insert into/i);
    expect(fixMigration).not.toMatch(/update public\./i);
    expect(fixMigration).not.toMatch(/delete from/i);
    expect(fixMigration).not.toMatch(/create policy/i);
    expect(fixMigration).not.toMatch(/^\s*grant\s+/im);
    expect(fixMigration).not.toContain("taxonomy_");
    expect(fixMigration).not.toContain("capabilities");
    expect(fixMigration).not.toContain("organization");
    expect(fixMigration).toContain("expected public.context_packs to exist exactly once");
    expect(fixMigration).toContain("expected exactly one context_packs_key_format_check");
  });

  it("replaces the live CHECK with the transport-safe [.] grammar", () => {
    expect(fixMigration).toContain(REPLACEMENT_POSIX);
    expect(fixMigration).not.toContain(String.raw`\.`);
    expect(fixMigration).not.toContain("\\\\.");
    expect(schemaMigration).toContain(ORIGINAL_POSIX);
  });

  it("accepts frozen seed keys and equivalent namespaced keys", () => {
    for (const key of VALID_KEYS) {
      expect(REPLACEMENT_JS.test(key), key).toBe(true);
    }
  });

  it("rejects malformed pack keys", () => {
    for (const key of INVALID_KEYS) {
      expect(REPLACEMENT_JS.test(key), key).toBe(false);
    }
  });

  it("leaves frozen CTX-1B schema and seed migrations unchanged", () => {
    expect(schemaMigration).toContain("'foundation'");
    expect(schemaMigration).toContain(ORIGINAL_POSIX);
    expect(seedMigration).toContain("'foundation.knowledge'");
    expect(seedMigration).toContain("'niche.online-course-business'");
    expect(seedMigration).toContain("n_packs <> 2");
    expect(seedMigration).toContain("n_mappings <> 10");
    expect(seedMigration).not.toContain(FIX_MIGRATION);
    expect(fixMigration).not.toContain("foundation.knowledge");
    expect(fixMigration).not.toContain("insert into public.context_packs");
  });

  it("registers the forward-fix after the frozen CTX-1B pair", () => {
    const context = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("context_pack") || name.includes("context-pack"))
      .sort();
    expect(context).toEqual([SCHEMA_MIGRATION, SEED_MIGRATION, FIX_MIGRATION]);
  });

  it("does not add a runtime Context consumer or Organization assignment", () => {
    expect(fixMigration).not.toMatch(/\borganization_id\b/);
    expect(fixMigration).not.toContain("database.generated.ts");
    expect(fixMigration).not.toContain("src/");
  });
});
