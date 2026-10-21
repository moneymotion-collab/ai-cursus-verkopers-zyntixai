import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase/migrations");
const SCHEMA = "20260824190000_create_context_pack_registry.sql";
const PREREQUISITE = "20260824190005_prepare_context_pack_registry_ctx1.sql";
const SEED = "20260824190010_seed_context_pack_registry_ctx1.sql";
const KEY_FIX = "20260824200500_fix_context_pack_key_format_check.sql";
const CHILD_FIX = "20260824203000_fix_context_pack_child_protection_trigger.sql";
const ONBOARDING_VERSIONING = "20260907120240_add_versioned_onboarding_state.sql";
const ONBOARDING_AUTHORITY =
  "20260907140829_onboarding_v2_transition_authority.sql";

const sql = readFileSync(join(MIGRATIONS, PREREQUISITE), "utf8");
const childFixSql = readFileSync(join(MIGRATIONS, CHILD_FIX), "utf8");

const FROZEN_SHA256 = {
  [SCHEMA]: "7056fca9d47e89c9f4d9ce611eefda95e9aed61ca7cec39207744779a88fba5c",
  [SEED]: "835b034b96f73d34e51686f5766ec991ab977b34806771bc7393a2c97898ddb3",
  [KEY_FIX]: "1b6d11f7f78cbe70c0b475c45f529c2dfd61fbdd68fadad55deb62c1a87e7b9e",
  [CHILD_FIX]:
    "3bfda6c804cc152e7b15558145a1951037b9b4c7fbcb874b8f521aff60911558",
} as const;

function functionBody(source: string): string {
  const marker =
    "create or replace function public.context_pack_version_protect_children()";
  const start = source.indexOf(marker);
  const bodyStart = source.indexOf("as $$", start);
  const end = source.indexOf("\n$$;", bodyStart);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(bodyStart).toBeGreaterThan(start);
  expect(end).toBeGreaterThan(bodyStart);
  return source.slice(bodyStart + "as $$".length, end);
}

describe("DB-MIG-CTX1-C pre-seed trigger prerequisite", () => {
  it("orders the prerequisite strictly between frozen schema and seed", () => {
    const migrations = readdirSync(MIGRATIONS).sort();
    expect(migrations).toContain(PREREQUISITE);
    expect(migrations.indexOf(SCHEMA)).toBeLessThan(
      migrations.indexOf(PREREQUISITE),
    );
    expect(migrations.indexOf(PREREQUISITE)).toBeLessThan(
      migrations.indexOf(SEED),
    );
    expect(migrations.indexOf(CHILD_FIX)).toBeLessThan(
      migrations.indexOf(ONBOARDING_VERSIONING),
    );
    expect(migrations.indexOf(ONBOARDING_VERSIONING)).toBeLessThan(
      migrations.indexOf(ONBOARDING_AUTHORITY),
    );
  });

  it("keeps every governed historical migration byte-identical", () => {
    for (const [migration, expected] of Object.entries(FROZEN_SHA256)) {
      const actual = createHash("sha256")
        .update(readFileSync(join(MIGRATIONS, migration)))
        .digest("hex");
      expect(actual, migration).toBe(expected);
    }
  });

  it("verifies the existing function and both trigger bindings", () => {
    expect(sql).toContain(
      "expected public.context_pack_version_protect_children() trigger function once",
    );
    expect(sql).toContain(
      "expected context_capability_mappings_protect_children once",
    );
    expect(sql).toContain(
      "expected context_terminology_protect_children once",
    );
    expect(sql).not.toMatch(/drop trigger|create trigger/i);
  });

  it("guards mapping_op behind mappings INSERT or UPDATE semantics", () => {
    const body = functionBody(sql);
    const mappingsBranch = body.indexOf(
      "if tg_table_name = 'context_capability_mappings' then",
    );
    const operationBranch = body.indexOf(
      "if tg_op in ('INSERT', 'UPDATE') then",
      mappingsBranch,
    );
    const mappingAccess = body.indexOf("new.mapping_op", operationBranch);

    expect(mappingsBranch).toBeGreaterThanOrEqual(0);
    expect(operationBranch).toBeGreaterThan(mappingsBranch);
    expect(mappingAccess).toBeGreaterThan(operationBranch);
    expect(body.slice(0, mappingsBranch)).not.toContain("mapping_op");
    expect(body.match(/\bmapping_op\b/g)).toHaveLength(1);
  });

  it("preserves governed function security and child protections", () => {
    expect(sql).toContain("security invoker");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("if tg_op = 'DELETE' then");
    expect(sql).toContain(
      "if tg_op = 'UPDATE' and old.version_id is distinct from new.version_id",
    );
    expect(sql).toContain(
      "CTX: cannot mutate semantic children of a published or superseded context version",
    );
    expect(sql).toContain("CTX: FULL versions may only SET capability mappings");
    for (const role of ["public", "anon", "authenticated", "service_role"]) {
      expect(sql).toContain(
        `revoke all on function public.context_pack_version_protect_children() from ${role}`,
      );
    }
  });

  it("is function governance only, without seed or product mutations", () => {
    expect(sql).not.toMatch(/^\s*(insert|update|delete)\b/im);
    expect(sql).not.toMatch(/create table|alter table|drop table/i);
    expect(sql).not.toContain("context_packs_key_format_check");
    expect(sql).not.toContain("foundation.knowledge");
    expect(sql).not.toContain("niche.online-course-business");
    expect(sql).not.toContain("taxonomy_");
    expect(sql).not.toContain("organization");
  });

  it("matches the later governed repair function body exactly", () => {
    expect(functionBody(sql)).toBe(functionBody(childFixSql));
  });
});
