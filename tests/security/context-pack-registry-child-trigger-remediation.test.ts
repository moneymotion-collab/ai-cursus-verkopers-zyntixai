import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCHEMA_MIGRATION = "20260824190000_create_context_pack_registry.sql";
const SEED_MIGRATION = "20260824190010_seed_context_pack_registry_ctx1.sql";
const KEY_FIX_MIGRATION = "20260824200500_fix_context_pack_key_format_check.sql";
const CHILD_FIX_MIGRATION =
  "20260824203000_fix_context_pack_child_protection_trigger.sql";

const schemaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SCHEMA_MIGRATION),
  "utf8",
);
const seedMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", SEED_MIGRATION),
  "utf8",
);
const keyFixMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", KEY_FIX_MIGRATION),
  "utf8",
);
const childFixMigration = readFileSync(
  join(process.cwd(), "supabase/migrations", CHILD_FIX_MIGRATION),
  "utf8",
);

function extractProtectChildrenBody(sql: string): string {
  const marker =
    "create or replace function public.context_pack_version_protect_children()";
  const start = sql.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const asDollar = sql.indexOf("as $$", start);
  const endDollar = sql.indexOf("\n$$;", asDollar);
  expect(asDollar).toBeGreaterThan(start);
  expect(endDollar).toBeGreaterThan(asDollar);
  return sql.slice(asDollar + "as $$".length, endDollar);
}

function mappingOpOccurrences(body: string): number {
  return body.split("mapping_op").length - 1;
}

describe("CTX-1FV-R1C context pack child-protection trigger remediation", () => {
  it("replaces only the shared child-protection function", () => {
    expect(childFixMigration).toContain(
      "create or replace function public.context_pack_version_protect_children()",
    );
    expect(childFixMigration).toContain("returns trigger");
    expect(childFixMigration).toContain("language plpgsql");
    expect(childFixMigration).toContain("security invoker");
    expect(childFixMigration).toContain("set search_path = ''");
    expect(childFixMigration).toContain(
      "expected public.context_pack_version_protect_children() trigger function once",
    );
    expect(childFixMigration).toContain(
      "expected context_capability_mappings_protect_children once",
    );
    expect(childFixMigration).toContain(
      "expected context_terminology_protect_children once",
    );
    expect(childFixMigration).not.toMatch(/create table/i);
    expect(childFixMigration).not.toMatch(/^\s*drop table\b/im);
    expect(childFixMigration).not.toMatch(/drop function/i);
    expect(childFixMigration).not.toMatch(/drop trigger/i);
    expect(childFixMigration).not.toMatch(/create trigger/i);
    expect(childFixMigration).not.toMatch(/insert into/i);
    expect(childFixMigration).not.toMatch(/update public\./i);
    expect(childFixMigration).not.toMatch(/delete from/i);
    expect(childFixMigration).not.toMatch(/create policy/i);
    expect(childFixMigration).not.toMatch(/^\s*grant\s+/im);
    expect(childFixMigration).not.toContain("taxonomy_");
    expect(childFixMigration).not.toContain("capabilities");
    expect(childFixMigration).not.toContain("organization");
  });

  it("nests mapping_op behind TG_TABLE_NAME and INSERT/UPDATE", () => {
    const replacement = extractProtectChildrenBody(childFixMigration);
    const original = extractProtectChildrenBody(schemaMigration);

    expect(original).toMatch(
      /tg_table_name = 'context_capability_mappings'\s+and new\.mapping_op = 'remove'/,
    );

    expect(replacement).not.toMatch(
      /tg_table_name = 'context_capability_mappings'\s+and new\.mapping_op/,
    );
    expect(replacement).not.toContain("old.mapping_op");
    expect(mappingOpOccurrences(replacement)).toBe(1);
    expect(replacement).toMatch(
      /if tg_table_name = 'context_capability_mappings' then\s+if tg_op in \('INSERT', 'UPDATE'\) then\s+if new\.mapping_op = 'remove'\s+and v_completeness = 'full'\s+then\s+raise exception 'CTX: FULL versions may only SET capability mappings';\s+end if;\s+end if;\s+end if;/,
    );

    const tableBranchStart = replacement.search(
      /if tg_table_name = 'context_capability_mappings' then/,
    );
    const mappingOpAt = replacement.indexOf("new.mapping_op");
    expect(tableBranchStart).toBeGreaterThanOrEqual(0);
    expect(mappingOpAt).toBeGreaterThan(tableBranchStart);
    expect(replacement.slice(0, tableBranchStart)).not.toContain("mapping_op");
  });

  it("preserves draft child writes, FULL/remove rejection, and published immutability", () => {
    const replacement = extractProtectChildrenBody(childFixMigration);
    expect(replacement).toContain("if tg_op = 'DELETE' then");
    expect(replacement).toContain("return old;");
    expect(replacement.indexOf("return old;")).toBeLessThan(
      replacement.indexOf("new.mapping_op"),
    );
    expect(replacement).toContain(
      "CTX: cannot mutate semantic children of a published or superseded context version",
    );
    expect(replacement).toContain(
      "CTX: FULL versions may only SET capability mappings",
    );
    expect(replacement).toContain(
      "if tg_op = 'UPDATE' and old.version_id is distinct from new.version_id",
    );
    expect(childFixMigration).toContain(
      "Does not protect context_pack_readiness",
    );
    expect(childFixMigration).not.toContain(
      "create trigger context_pack_readiness",
    );

    expect(seedMigration).toContain("'draft'");
    expect(seedMigration).toContain("insert into public.context_capability_mappings");
    expect(seedMigration).toContain("insert into public.context_terminology");
    expect(seedMigration).toContain("'set'");
    expect(seedMigration).toMatch(
      /set publication_status = 'published'[\s\S]*insert into public.context_pack_readiness/,
    );
  });

  it("reasserts revoke-only privilege posture and is not an RPC", () => {
    expect(childFixMigration).toContain("Internal integrity trigger only. Not a Context RPC");
    for (const role of ["public", "anon", "authenticated", "service_role"]) {
      expect(childFixMigration).toContain(
        `revoke all on function public.context_pack_version_protect_children() from ${role}`,
      );
    }
    expect(childFixMigration).not.toMatch(
      /grant execute on function public\.context_pack_version_protect_children/i,
    );
  });

  it("leaves frozen CTX schema, seed, and R1A key-format repair unchanged", () => {
    expect(schemaMigration).toMatch(
      /tg_table_name = 'context_capability_mappings'\s+and new\.mapping_op = 'remove'/,
    );
    expect(seedMigration).toContain("'foundation.knowledge'");
    expect(seedMigration).toContain("'niche.online-course-business'");
    expect(seedMigration).toContain("n_packs <> 2");
    expect(seedMigration).toContain("n_mappings <> 10");
    expect(keyFixMigration).toContain("context_packs_key_format_check");
    expect(keyFixMigration).toContain("^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$");
    expect(childFixMigration).not.toContain("foundation.knowledge");
    expect(childFixMigration).not.toContain("insert into public.context_packs");
    expect(childFixMigration).not.toContain("context_packs_key_format_check");
  });

  it("registers the child-trigger repair after schema, seed, and key-format repair", () => {
    const context = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("context_pack") || name.includes("context-pack"))
      .sort();
    expect(context).toEqual([
      SCHEMA_MIGRATION,
      SEED_MIGRATION,
      KEY_FIX_MIGRATION,
      CHILD_FIX_MIGRATION,
    ]);
  });

  it("does not add a runtime Context consumer or Organization assignment", () => {
    expect(childFixMigration).not.toMatch(/\borganization_id\b/);
    expect(childFixMigration).not.toContain("database.generated.ts");
    expect(childFixMigration).not.toContain("src/");
  });
});
