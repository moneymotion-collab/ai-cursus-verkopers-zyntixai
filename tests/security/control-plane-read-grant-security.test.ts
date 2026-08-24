import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const GRANT_MIGRATION =
  "20260824210000_grant_control_plane_select_to_service_role.sql";

const TAX_SCHEMA = "20260824153300_create_taxonomy_registry.sql";
const CAP_SCHEMA = "20260824180000_create_capability_registry.sql";
const CTX_SCHEMA = "20260824190000_create_context_pack_registry.sql";

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

const CLIENT_ROLES = ["public", "anon", "authenticated"] as const;
const RUNTIME_ROLES = [...CLIENT_ROLES, "service_role"] as const;

const GRANT_SELECT_PATTERN =
  /^grant select on table public\.([a-z0-9_]+) to service_role;$/;

const TABLE_PRIVILEGE_PATTERN =
  /^(?:grant|revoke)\s+(.+?)\s+on table public\.([a-z0-9_]+)\s+(?:to|from)\s+([a-z0-9_]+)\s*;$/i;

const migrationsDir = join(process.cwd(), "supabase/migrations");

const grantMigration = readFileSync(join(migrationsDir, GRANT_MIGRATION), "utf8");

function sqlStatements(sql: string): string[] {
  return sql
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("--"));
}

function grantStatements(sql: string): string[] {
  return sqlStatements(sql).filter((line) => /^grant\b/i.test(line));
}

function tablePrivilegeStatements(sql: string): Array<{
  kind: "grant" | "revoke";
  privilege: string;
  table: string;
  role: string;
}> {
  const rows: Array<{
    kind: "grant" | "revoke";
    privilege: string;
    table: string;
    role: string;
  }> = [];

  for (const line of sqlStatements(sql)) {
    const match = line.match(TABLE_PRIVILEGE_PATTERN);
    if (!match) {
      continue;
    }
    const privilege = match[1].toLowerCase();
    const table = match[2];
    const role = match[3];
    if (!(CONTROL_PLANE_TABLES as readonly string[]).includes(table)) {
      continue;
    }
    rows.push({
      kind: /^\s*grant\b/i.test(line) ? "grant" : "revoke",
      privilege,
      table,
      role,
    });
  }

  return rows;
}

describe("CONTROL-PLANE-READ-1B grant migration inventory", () => {
  it("registers exactly one control-plane SELECT grant migration after CTX repairs", () => {
    const names = readdirSync(migrationsDir)
      .filter((name) => name.includes("grant_control_plane_select_to_service_role"))
      .sort();
    expect(names).toEqual([GRANT_MIGRATION]);
    expect(GRANT_MIGRATION > "20260824203000_fix_context_pack_child_protection_trigger.sql").toBe(
      true,
    );
  });
});

describe("CONTROL-PLANE-READ-1B historical deny contract remains", () => {
  it("keeps original TAX/CAP/CTX schema files revoking all runtime roles", () => {
    const originals = [
      readFileSync(join(migrationsDir, TAX_SCHEMA), "utf8"),
      readFileSync(join(migrationsDir, CAP_SCHEMA), "utf8"),
      readFileSync(join(migrationsDir, CTX_SCHEMA), "utf8"),
    ];

    for (const table of CONTROL_PLANE_TABLES) {
      const owningSchema = originals.find((sql) =>
        sql.includes(`revoke all on table public.${table} from service_role`),
      );
      expect(owningSchema, `missing historical revoke for ${table}`).toBeDefined();
      for (const role of RUNTIME_ROLES) {
        expect(owningSchema).toContain(`revoke all on table public.${table} from ${role}`);
      }
    }
  });

  it("does not rewrite historical TAX/CAP/CTX schema files to include SELECT grants", () => {
    for (const name of [TAX_SCHEMA, CAP_SCHEMA, CTX_SCHEMA]) {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      expect(sql).not.toMatch(/^\s*grant\s+select\s+on table public\./im);
    }
  });
});

describe("CONTROL-PLANE-READ-1B exact SELECT grant contract", () => {
  it("grants SELECT on exactly the 15 approved tables to service_role", () => {
    const grants = grantStatements(grantMigration);
    expect(grants).toHaveLength(CONTROL_PLANE_TABLES.length);

    const tables = grants.map((line) => {
      const match = line.match(GRANT_SELECT_PATTERN);
      expect(match, `unexpected grant statement: ${line}`).not.toBeNull();
      return match?.[1];
    });

    expect(tables).toEqual([...CONTROL_PLANE_TABLES]);
  });

  it("does not grant to public, anon, or authenticated", () => {
    for (const role of CLIENT_ROLES) {
      expect(grantMigration).not.toMatch(
        new RegExp(`^\\s*grant\\b.*\\bto\\s+${role}\\s*;`, "im"),
      );
    }
  });

  it("does not grant write or ancillary table privileges", () => {
    const forbidden = [
      "all",
      "insert",
      "update",
      "delete",
      "truncate",
      "references",
      "trigger",
    ];
    for (const line of grantStatements(grantMigration)) {
      for (const privilege of forbidden) {
        expect(line).not.toMatch(new RegExp(`\\b${privilege}\\b`, "i"));
      }
      expect(line).toMatch(/^grant select on table public\./);
    }
  });

  it("does not use schema wildcards or default privileges", () => {
    expect(grantMigration).not.toMatch(/all tables in schema/i);
    expect(grantMigration).not.toMatch(/alter default privileges/i);
    expect(grantMigration).not.toMatch(/grant\s+all\s+on schema/i);
    expect(grantMigration).not.toMatch(/grant\s+usage\s+on schema/i);
    expect(grantMigration).not.toMatch(/grant\s+select\s+on all/i);
  });
});

describe("CONTROL-PLANE-READ-1B fail-closed prerequisite", () => {
  it("requires all 15 public tables to exist before granting", () => {
    expect(grantMigration).toContain("CONTROL-PLANE-READ-1B: missing required control-plane table(s)");
    expect(grantMigration).toContain("c.relkind = 'r'");
    expect(grantMigration).toContain("n.nspname = 'public'");
    for (const table of CONTROL_PLANE_TABLES) {
      expect(grantMigration).toContain(`('${table}')`);
    }
    const grantIndex = grantMigration.indexOf(
      "grant select on table public.taxonomy_releases to service_role;",
    );
    const checkIndex = grantMigration.indexOf(
      "CONTROL-PLANE-READ-1B: missing required control-plane table(s)",
    );
    expect(checkIndex).toBeGreaterThan(-1);
    expect(grantIndex).toBeGreaterThan(checkIndex);
  });
});

describe("CONTROL-PLANE-READ-1B isolation from schema and runtime expansion", () => {
  it("does not create policies or change RLS", () => {
    expect(grantMigration).not.toMatch(/^\s*create policy\b/im);
    expect(grantMigration).not.toMatch(/disable row level security/i);
    expect(grantMigration).not.toMatch(/force row level security/i);
    expect(grantMigration).not.toMatch(/enable row level security/i);
  });

  it("does not create functions, RPCs, views, triggers, or tables", () => {
    expect(grantMigration).not.toMatch(/^\s*create(\s+or\s+replace)?\s+function\b/im);
    expect(grantMigration).not.toMatch(/^\s*create(\s+or\s+replace)?\s+view\b/im);
    expect(grantMigration).not.toMatch(/^\s*create(\s+materialized\s+view)\b/im);
    expect(grantMigration).not.toMatch(/^\s*create(\s+or\s+replace)?\s+trigger\b/im);
    expect(grantMigration).not.toMatch(/^\s*create table\b/im);
    expect(grantMigration).not.toMatch(/^\s*drop table\b/im);
    expect(grantMigration).not.toMatch(/^\s*alter table\b/im);
    expect(grantMigration).not.toMatch(/^\s*alter column\b/im);
    expect(grantMigration).not.toMatch(/\badd column\b/i);
    expect(grantMigration).not.toMatch(/\bdrop column\b/i);
    expect(grantMigration).not.toMatch(/security definer/i);
  });

  it("does not perform semantic DML", () => {
    expect(grantMigration).not.toMatch(/^\s*insert\b/im);
    expect(grantMigration).not.toMatch(/^\s*update\b/im);
    expect(grantMigration).not.toMatch(/^\s*delete\b/im);
    expect(grantMigration).not.toMatch(/^\s*truncate\b/im);
    expect(grantMigration).not.toMatch(/\bon conflict\b/i);
  });

  it("does not assign Organization Context or name tenant assignment tables", () => {
    expect(grantMigration).not.toMatch(/\borganization_id\b/);
    expect(grantMigration).not.toMatch(/\borganizations\b/);
    expect(grantMigration).not.toContain("organization_context_assignments");
    expect(grantMigration).not.toContain("organization_context_overrides");
  });

  it("does not mutate readiness rows", () => {
    expect(grantMigration).not.toMatch(
      /^\s*(insert|update|delete)\b.*capability_readiness/im,
    );
    expect(grantMigration).not.toMatch(
      /^\s*(insert|update|delete)\b.*context_pack_readiness/im,
    );
    expect(grantMigration).not.toContain("context_ready");
    expect(grantMigration).not.toContain("beta_supported");
    expect(grantMigration).not.toContain("production_verified");
  });

  it("does not touch Social, PATH B, or Closed Beta identifiers", () => {
    expect(grantMigration).not.toContain("social_closed_beta_enrollments");
    expect(grantMigration).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(grantMigration).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(grantMigration).not.toContain("INVITATIONS_ENABLED");
    expect(grantMigration).not.toContain("PUBLIC_REGISTRATION_ENABLED");
    expect(grantMigration).not.toContain("invoke_social_publication_scheduler");
  });
});

describe("CONTROL-PLANE-READ-1B final privilege-chain state", () => {
  it("leaves client roles with no catalog grants and service_role with SELECT only", () => {
    const chain: Array<{
      file: string;
      kind: "grant" | "revoke";
      privilege: string;
      table: string;
      role: string;
    }> = [];

    for (const name of readdirSync(migrationsDir).sort()) {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      for (const row of tablePrivilegeStatements(sql)) {
        chain.push({ file: name, ...row });
      }
    }

    const historicalRevokes = chain.filter((row) =>
      [TAX_SCHEMA, CAP_SCHEMA, CTX_SCHEMA].includes(row.file),
    );
    expect(historicalRevokes.length).toBe(
      CONTROL_PLANE_TABLES.length * RUNTIME_ROLES.length,
    );
    expect(
      historicalRevokes.every(
        (row) => row.kind === "revoke" && row.privilege === "all",
      ),
    ).toBe(true);

    const later = chain.filter(
      (row) => ![TAX_SCHEMA, CAP_SCHEMA, CTX_SCHEMA].includes(row.file),
    );
    expect(later.every((row) => row.file === GRANT_MIGRATION)).toBe(true);
    expect(later).toHaveLength(CONTROL_PLANE_TABLES.length);
    expect(
      later.every(
        (row) =>
          row.kind === "grant" &&
          row.privilege === "select" &&
          row.role === "service_role",
      ),
    ).toBe(true);
    expect(later.map((row) => row.table).sort()).toEqual(
      [...CONTROL_PLANE_TABLES].sort(),
    );

    const clientGrants = chain.filter(
      (row) =>
        row.kind === "grant" &&
        (CLIENT_ROLES as readonly string[]).includes(row.role),
    );
    expect(clientGrants).toEqual([]);

    const writeGrants = chain.filter(
      (row) =>
        row.kind === "grant" &&
        row.privilege !== "select",
    );
    expect(writeGrants).toEqual([]);
  });
});
