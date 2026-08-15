import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.1-B migration security contract", () => {
  it("creates connection, private credential, oauth intent, event, and rate-limit tables", () => {
    expect(migration).toContain("create table public.social_account_connections");
    expect(migration).toContain(
      "create table private.social_oauth_authorization_intents",
    );
    expect(migration).toContain("create table private.social_provider_credentials");
    expect(migration).toContain("create table public.social_connection_events");
    expect(migration).toContain(
      "create table private.social_connection_mutation_rate_limits",
    );
  });

  it("locks provider, login product, lifecycle, health, and account type", () => {
    expect(migration).toContain("check (provider = 'instagram')");
    expect(migration).toContain("check (login_product = 'instagram_login')");
    expect(migration).toContain("'initiated'");
    expect(migration).toContain("'authorization_pending'");
    expect(migration).toContain("'connected'");
    expect(migration).toContain("'reauthorization_required'");
    expect(migration).toContain("'permission_missing'");
    expect(migration).toContain("'revoked'");
    expect(migration).toContain("'disconnected'");
    expect(migration).not.toMatch(
      /social_account_connections_status_chk[\s\S]{0,400}'error'/,
    );
    expect(migration).toContain("'healthy'");
    expect(migration).toContain("'degraded'");
    expect(migration).toContain("'provider_unavailable'");
    expect(migration).toContain("'business'");
    expect(migration).toContain("'creator'");
    expect(migration).not.toMatch(
      /professional_account_type in \([^)]*personal/,
    );
  });

  it("enforces organization-scoped active uniqueness and defers workspace FK", () => {
    expect(migration).toContain("social_account_connections_active_external_uidx");
    expect(migration).toContain("status <> 'disconnected'");
    expect(migration).toContain("Physical FK deferred until SMM-B1.2");
    expect(migration).not.toContain("references public.social_workspaces");
  });

  it("keeps credentials and oauth intents private with RLS and no client grants", () => {
    for (const table of [
      "private.social_provider_credentials",
      "private.social_oauth_authorization_intents",
      "private.social_connection_mutation_rate_limits",
    ]) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(`revoke all on table ${table} from authenticated`);
      expect(migration).toContain(`revoke all on table ${table} from anon`);
      expect(migration).toContain(`revoke all on table ${table} from service_role`);
    }
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)\b[\s\S]{0,80}social_provider_credentials/i,
    );
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)\b[\s\S]{0,80}social_oauth_authorization_intents/i,
    );
  });

  it("stores oauth state fingerprint only and never raw state", () => {
    expect(migration).toContain("state_fingerprint text not null");
    expect(migration).toContain("state_fingerprint ~ '^[0-9a-f]{64}$'");
    expect(migration).toContain("never raw OAuth state");
    const intentBlock = migration.match(
      /create table private.social_oauth_authorization_intents \([\s\S]*?\);/,
    )?.[0];
    expect(intentBlock).toBeTruthy();
    expect(intentBlock).not.toMatch(/raw_state|state_secret|access_token/i);
  });

  it("uses SECURITY DEFINER RPCs with empty search_path and authenticated-only EXECUTE", () => {
    for (const name of [
      "create_social_connection_intent",
      "create_social_reauthorization_intent",
      "consume_social_oauth_intent",
      "finalize_social_connection",
      "upsert_social_provider_credential",
      "load_social_provider_credential_envelope",
      "disconnect_social_connection",
      "mark_social_connection_reauthorization_required",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toContain(
        `grant execute on function public.${name}`,
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]{0,200} from service_role`,
        ),
      );
    }
  });

  it("derives actor from auth.uid and requires active Owner/Admin", () => {
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("and om.status = 'active'");
    expect(migration).toContain("private.can_manage_social_connections");
    expect(migration).toContain("p_actor_role in ('owner', 'admin')");
    expect(migration).toContain(
      "private.assert_active_organization_for_social_connection_mutation",
    );
  });

  it("implements CAS credential versions and secret-free events", () => {
    expect(migration).toContain("credential_version = cred.credential_version + 1");
    expect(migration).toContain("'stale_version'");
    expect(migration).toContain("and cred.credential_version = p_expected_credential_version");
    expect(migration).toContain("social connection event payload must not contain secrets");
    expect(migration).toContain("social connection events are immutable");
  });

  it("does not introduce a service-role client path or invitation changes", () => {
    expect(migration).not.toContain("INVITE_CONTINUATION_SECRET");
    expect(migration).not.toContain("create_organization_invitation");
    expect(migration).not.toContain("service_role key");
    expect(migration).toContain("zyntixai.smm.credential.aes-v1");
  });
});
