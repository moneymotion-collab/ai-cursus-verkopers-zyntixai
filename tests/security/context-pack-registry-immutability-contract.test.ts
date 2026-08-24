import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824190000_create_context_pack_registry.sql",
  ),
  "utf8",
);

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql",
  ),
  "utf8",
);

describe("CTX-1B published version immutability contract", () => {
  it("freezes pack_key, pack_kind, and TAX target on context_packs", () => {
    expect(schemaMigration).toContain(
      "create trigger context_packs_protect_identity",
    );
    expect(schemaMigration).toContain(
      "before update on public.context_packs",
    );
    expect(schemaMigration).toContain(
      "CTX: context_packs identity (pack_key, pack_kind, taxonomy target) is immutable",
    );
  });

  it("allows only published → superseded on frozen version rows", () => {
    expect(schemaMigration).toContain(
      "create trigger context_pack_versions_enforce_integrity",
    );
    expect(schemaMigration).toContain(
      "before insert or update on public.context_pack_versions",
    );
    expect(schemaMigration).toContain(
      "Allowed lifecycle transition: published → superseded only.",
    );
    expect(schemaMigration).toContain("published → draft forbidden");
    expect(schemaMigration).toContain("superseded → published forbidden");
    expect(schemaMigration).toContain("superseded → draft forbidden");
    expect(schemaMigration).toMatch(
      /old\.publication_status = 'published'\s+and new\.publication_status = 'superseded'/,
    );
    expect(schemaMigration).toContain(
      "CTX: published or superseded context_pack_versions row is immutable",
    );
    expect(schemaMigration).toContain("CTX: draft cannot transition to superseded");
  });

  it("blocks INSERT/UPDATE/DELETE of mappings and terminology for published versions", () => {
    expect(schemaMigration).toContain(
      "create trigger context_capability_mappings_protect_children",
    );
    expect(schemaMigration).toContain(
      "before insert or update or delete on public.context_capability_mappings",
    );
    expect(schemaMigration).toContain(
      "create trigger context_terminology_protect_children",
    );
    expect(schemaMigration).toContain(
      "before insert or update or delete on public.context_terminology",
    );
    expect(schemaMigration).toContain(
      "CTX: cannot mutate semantic children of a published or superseded context version",
    );
    expect(schemaMigration).toContain(
      "Draft child rows remain writable by the migration owner",
    );
    expect(schemaMigration).toContain(
      "Does not protect context_pack_readiness",
    );
  });

  it("lets FULL versions SET only and requires published/superseded parents", () => {
    expect(schemaMigration).toContain(
      "CTX: FULL versions may only SET capability mappings",
    );
    expect(schemaMigration).toContain(
      "CTX: pack_kind foundation or niche requires completeness full",
    );
    expect(schemaMigration).toContain(
      "CTX: pack_kind industry/specialization/deep_specialization requires completeness delta",
    );
    expect(schemaMigration).toContain(
      "CTX: parent version must be published or superseded",
    );
  });

  it("does not disable immutability to seed; seed publishes after child inserts", () => {
    expect(seedMigration).toMatch(/publication_status,\s+completeness,/);
    expect(seedMigration).toContain("'draft'");
    expect(seedMigration).toContain("set publication_status = 'published'");
    expect(seedMigration).toContain(
      "Knowledge Foundation v1 must be published before Niche v1",
    );
    expect(seedMigration).not.toContain("disable trigger");
    expect(seedMigration).not.toContain("session_replication_role");
    expect(seedMigration).not.toContain("alter table public.context_pack_versions disable");
  });
});
