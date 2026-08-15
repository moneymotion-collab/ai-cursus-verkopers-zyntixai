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

describe("SMM-B1.1-B RPC authorization and single-use contract", () => {
  it("rejects unsupported providers at create intent", () => {
    expect(migration).toContain("if p_provider <> 'instagram' then");
    expect(migration).toContain("'provider_unsupported'");
  });

  it("consumes oauth intents atomically with row lock and actor binding", () => {
    expect(migration).toMatch(
      /from private\.social_oauth_authorization_intents as i[\s\S]*?for update/,
    );
    expect(migration).toContain("initiating_actor_user_id <> v_actor_user_id");
    expect(migration).toContain("'wrong_actor'");
    expect(migration).toContain("'replayed_state'");
    expect(migration).toContain("'expired_state'");
    expect(migration).toContain("status = 'consumed'");
    expect(migration).toContain("consumed_at is null");
  });

  it("rate-limits callback from persisted intent identity, not client org", () => {
    expect(migration).toMatch(
      /create or replace function public\.consume_social_oauth_intent[\s\S]*?v_intent\.organization_id,[\s\S]*?v_intent\.initiating_actor_user_id,[\s\S]*?'oauth_callback'/,
    );
  });

  it("protects reauthorization identity and duplicate active connections", () => {
    expect(migration).toContain("'identity_mismatch'");
    expect(migration).toContain("'duplicate_connection'");
    expect(migration).toContain("expected_external_account_id");
  });

  it("denies Staff/Viewer connection management inside RPCs", () => {
    expect(migration).toContain("if not private.can_manage_social_connections(v_member_role) then");
    expect(migration).toContain("return query select 'forbidden'");
  });

  it("load envelope is Owner/Admin only and returns ciphertext fields without plaintext token names", () => {
    expect(migration).toContain(
      "create or replace function public.load_social_provider_credential_envelope",
    );
    const load = migration.match(
      /create or replace function public\.load_social_provider_credential_envelope[\s\S]*?grant execute on function public\.load_social_provider_credential_envelope/,
    )?.[0];
    expect(load).toBeTruthy();
    expect(load).toContain("can_manage_social_connections");
    expect(load).not.toMatch(/access_token|refresh_token/i);
    expect(load).toContain("ciphertext");
  });
});
