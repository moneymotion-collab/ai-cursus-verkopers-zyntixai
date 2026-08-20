import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_NAME =
  "20260820120000_add_social_reauthorization_connected_finalize.sql";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION_NAME),
  "utf8",
);

const originalFinalize = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.1-R A2-FIX reauthorization finalize security", () => {
  it("adds an explicit reauthorization finalize RPC without replacing connect finalize", () => {
    expect(migration).toContain(
      "create or replace function public.finalize_social_reauthorization(",
    );
    expect(migration).toContain("p_intent_id uuid");
    expect(migration).not.toMatch(
      /create or replace function public\.finalize_social_connection\(/,
    );
    expect(migration).not.toContain("p_connection_id");
    expect(originalFinalize).toContain(
      "if v_connection.status not in ('authorization_pending', 'reauthorization_required') then",
    );
  });

  it("binds finalize to a consumed reauthorize intent, actor, identity, and credential refresh", () => {
    expect(migration).toContain("v_intent.intent_kind <> 'reauthorize'");
    expect(migration).toContain("v_intent.status <> 'consumed'");
    expect(migration).toContain("v_intent.initiating_actor_user_id <> v_actor_user_id");
    expect(migration).toContain(
      "v_intent.expected_external_account_id <> p_external_account_id",
    );
    expect(migration).toContain(
      "v_connection.external_account_id <> p_external_account_id",
    );
    expect(migration).toContain("identity_mismatch");
    expect(migration).toContain("v_connection.last_refreshed_at < v_intent.consumed_at");
    expect(migration).toContain("interval '30 minutes'");
    expect(migration).toContain("'connected'");
    expect(migration).toContain("'reauthorization_required'");
    expect(migration).toContain("'permission_missing'");
    expect(migration).toContain("'social_connection_reauthorized'");
    expect(migration).not.toMatch(
      /v_connection\.status not in \([\s\S]*?'authorization_pending'/,
    );
    expect(migration).not.toMatch(
      /v_connection\.status in \([\s\S]*?'authorization_pending'/,
    );
  });

  it("keeps SECURITY DEFINER, empty search_path, and authenticated-only EXECUTE", () => {
    expect(migration).toMatch(
      /create or replace function public\.finalize_social_reauthorization[\s\S]*?security definer\s+set search_path = ''/,
    );
    expect(migration).toContain(
      "revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from anon",
    );
    expect(migration).toContain(
      "revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from service_role",
    );
    expect(migration).toContain(
      "grant execute on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) to authenticated",
    );
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("private.can_manage_social_connections");
    expect(migration).toContain(
      "private.assert_active_organization_for_social_connection_mutation",
    );
  });

  it("does not expose tokens or rewrite historical credential tables", () => {
    expect(migration).not.toMatch(/access_token/i);
    expect(migration).not.toContain("drop table");
    expect(migration).not.toContain("delete from public.social_account_connections");
    expect(migration).not.toContain("delete from private.social_provider_credentials");
    expect(readdirSync(join(process.cwd(), "supabase/migrations"))).toContain(
      MIGRATION_NAME,
    );
  });
});
