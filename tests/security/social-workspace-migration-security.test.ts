import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815162306_add_social_workspace_foundation.sql",
  ),
  "utf8",
);

const connectionMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.2 social workspace migration security contract", () => {
  it("creates brands, workspaces, and append-only workspace events", () => {
    expect(migration).toContain("create table public.social_brands");
    expect(migration).toContain("create table public.social_workspaces");
    expect(migration).toContain("create table public.social_workspace_events");
    expect(migration).toContain("unique (organization_id, brand_id)");
    expect(migration).toContain("social_workspaces_org_id_unique unique (organization_id, id)");
  });

  it("does not add Brand Brain / campaign / content tables", () => {
    expect(migration).not.toContain("social_content_pillars");
    expect(migration).not.toContain("social_campaigns");
    expect(migration).not.toContain("tone_of_voice");
    expect(migration).not.toContain("create table public.social_audiences");
    expect(migration).not.toMatch(/settings\s+jsonb/i);
  });

  it("adds org-bound physical FKs for connections and oauth intents", () => {
    expect(migration).toContain("social_account_connections_workspace_fk");
    expect(migration).toContain("social_oauth_authorization_intents_workspace_fk");
    expect(migration).toContain(
      "references public.social_workspaces (organization_id, id)",
    );
  });

  it("keeps historical B1.1-B migration workspace-FK deferred wording intact", () => {
    expect(connectionMigration).toContain("Physical FK deferred until SMM-B1.2");
    expect(connectionMigration).not.toContain(
      "social_account_connections_workspace_fk",
    );
  });

  it("enables RLS and revokes client mutations on workspace tables", () => {
    for (const table of [
      "public.social_brands",
      "public.social_workspaces",
      "public.social_workspace_events",
    ]) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(`revoke all on table ${table} from anon`);
      expect(migration).toContain(`revoke all on table ${table} from service_role`);
    }
    expect(migration).toContain(
      "revoke insert, update, delete on table public.social_workspaces from authenticated",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on table public.social_brands from authenticated",
    );
  });

  it("uses SECURITY DEFINER RPCs with empty search_path and authenticated-only EXECUTE", () => {
    for (const name of [
      "create_social_workspace",
      "update_social_workspace",
      "archive_social_workspace",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]{0,220} from service_role`,
        ),
      );
      expect(migration).toContain(`grant execute on function public.${name}`);
    }
  });

  it("requires Owner/Admin and active organization for workspace mutations", () => {
    expect(migration).toContain("private.can_manage_social_workspaces");
    expect(migration).toContain("p_actor_role in ('owner', 'admin')");
    expect(migration).toContain(
      "private.assert_active_organization_for_social_workspace_mutation",
    );
    expect(migration).toContain("and om.status = 'active'");
    expect(migration).toContain("auth.uid()");
  });

  it("gates connection intents on eligible same-org workspaces", () => {
    expect(migration).toContain(
      "private.is_social_workspace_eligible_for_connection",
    );
    expect(migration).toContain("workspace_not_found");
    expect(migration).toContain("and sw.archived_at is null");
  });

  it("does not broaden Instagram provider constraints", () => {
    expect(migration).not.toMatch(/provider\s*=\s*'facebook'/i);
    expect(migration).not.toMatch(/provider\s*=\s*'tiktok'/i);
    expect(migration).not.toContain("drop constraint social_account_connections_provider_chk");
  });

  it("documents the remote history-alignment stub separately from the schema migration", () => {
    const stub = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260815161759_add_social_workspace_foundation.sql",
      ),
      "utf8",
    );
    expect(stub).toContain("remote history alignment");
    expect(stub).not.toContain("create table public.social_workspaces");
  });
});
