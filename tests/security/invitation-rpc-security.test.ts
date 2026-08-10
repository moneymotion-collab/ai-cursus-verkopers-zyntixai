import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const helpersMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260810121000_add_organization_invitation_operator_helpers_and_rpcs.sql",
  ),
  "utf8",
);

const hardeningMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260810121010_organization_invitation_operator_rpc_security_hardening.sql",
  ),
  "utf8",
);

const allOperatorMigrations = [helpersMigration, hardeningMigration].join("\n");

describe("Invitations operator RPC & token security contract", () => {
  it("exposes create/resend/revoke public RPCs and no accept RPC", () => {
    expect(helpersMigration).toContain(
      "create or replace function public.create_organization_invitation",
    );
    expect(helpersMigration).toContain(
      "create or replace function public.resend_organization_invitation",
    );
    expect(helpersMigration).toContain(
      "create or replace function public.revoke_organization_invitation",
    );
    expect(allOperatorMigrations).not.toContain(
      "accept_organization_invitation",
    );
  });

  it("marks public operator RPCs SECURITY DEFINER with empty search_path", () => {
    for (const name of [
      "create_organization_invitation",
      "resend_organization_invitation",
      "revoke_organization_invitation",
    ]) {
      expect(helpersMigration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
    }
  });

  it("derives actor from auth.uid and denies null auth", () => {
    expect(helpersMigration).toContain("auth.uid()");
    expect(helpersMigration).toContain("if auth.uid() is null then");
    expect(helpersMigration).toContain("raise exception 'not authenticated'");
    expect(helpersMigration).toContain(
      "private.get_organization_invitation_actor_membership",
    );
    expect(helpersMigration).toContain("and om.status = 'active'");
  });

  it("encodes create/manage role matrices and rejects owner targets", () => {
    expect(helpersMigration).toContain(
      "private.can_create_organization_invitation_target",
    );
    expect(helpersMigration).toContain(
      "private.can_manage_organization_invitation_target",
    );
    expect(helpersMigration).toMatch(
      /p_actor_role = 'owner' and p_target_role in \('admin', 'staff', 'viewer'\)/,
    );
    expect(helpersMigration).toMatch(
      /p_actor_role = 'admin' and p_target_role in \('staff', 'viewer'\)/,
    );
    expect(helpersMigration).toContain(
      "v_target_role not in ('admin', 'staff', 'viewer')",
    );
    expect(helpersMigration).not.toMatch(
      /p_target_role\s*=\s*'owner'/,
    );
  });

  it("requires active organization for mutation RPCs", () => {
    expect(helpersMigration).toContain(
      "private.assert_active_organization_for_invitation_mutation",
    );
    expect(helpersMigration).toContain("o.status = 'active'");
  });

  it("normalizes email with lower(btrim(...)) only", () => {
    expect(helpersMigration).toContain(
      "v_email_normalized := lower(btrim(coalesce(p_email, '')));",
    );
    expect(helpersMigration).not.toMatch(/gmail|plus.?strip|dot.?normal/i);
  });

  it("resolves membership collisions including OD-RPC-3 invited → admin_action", () => {
    expect(helpersMigration).toContain(
      "private.resolve_organization_invitation_membership_collision",
    );
    expect(helpersMigration).toContain("from auth.users");
    expect(helpersMigration).toContain("already_member");
    expect(helpersMigration).toContain(
      "existing_membership_requires_admin_action",
    );
    expect(helpersMigration).toContain(
      "if v_collision in ('suspended', 'removed', 'invited') then",
    );
    expect(helpersMigration).not.toContain("registered_user");
    expect(helpersMigration).not.toContain("unregistered_user");
  });

  it("uses pgcrypto CSPRNG and SHA-256 hex hash of exact raw token UTF-8", () => {
    expect(helpersMigration).toContain("extensions.gen_random_bytes(32)");
    expect(helpersMigration).toContain(
      "encode(extensions.gen_random_bytes(32), 'hex')",
    );
    expect(helpersMigration).toContain(
      "extensions.digest(convert_to(v_raw, 'UTF8'), 'sha256')",
    );
    expect(helpersMigration).toContain(
      "private.generate_organization_invitation_token_pair",
    );
  });

  it("does not persist raw tokens and forbids credential event payloads", () => {
    expect(helpersMigration).toMatch(
      /insert into public\.organization_invitations \(\s*organization_id,\s*email_normalized,\s*role,\s*status,\s*invited_by_member_id,\s*token_hash,\s*expires_at\s*\)/s,
    );
    expect(helpersMigration).not.toMatch(
      /insert into public\.organization_invitations \([^)]*raw_token/s,
    );
    expect(helpersMigration).toContain(
      "invitation event payload must not contain credentials",
    );
    expect(helpersMigration).not.toMatch(
      /raise\s+(notice|log|info|warning|exception).*raw_token/i,
    );
  });

  it("locks pending rows and materializes lazy expiry without invitation_expired event", () => {
    expect(helpersMigration).toMatch(
      /status = 'pending'[\s\S]*for update/,
    );
    expect(helpersMigration).toContain("status = 'expired'");
    expect(helpersMigration).toContain("token_hash = null");
    expect(helpersMigration).toContain("invite_already_pending");
    expect(helpersMigration).not.toMatch(/'invitation_expired'/);
    expect(helpersMigration).not.toMatch(
      /event_type\s*=\s*'invitation_expired'/,
    );
  });

  it("rotates token on resend and clears token on revoke", () => {
    expect(helpersMigration).toMatch(
      /create or replace function public\.resend_organization_invitation[\s\S]*token_hash = v_token_hash[\s\S]*expires_at = v_expires_at/,
    );
    expect(helpersMigration).toContain("invitation_resent");
    expect(helpersMigration).toMatch(
      /create or replace function public\.revoke_organization_invitation[\s\S]*status = 'revoked'[\s\S]*token_hash = null/,
    );
    expect(helpersMigration).toContain("invitation_revoked");
    expect(helpersMigration).toContain(
      "Idempotent second revoke: no second transition / event",
    );
  });

  it("documents concurrent resend last-committed-token-wins under FOR UPDATE", () => {
    expect(helpersMigration).toContain(
      "Concurrent resend: FOR UPDATE serializes; last committed token wins",
    );
  });

  it("inserts operator events via private helper with actor membership", () => {
    expect(helpersMigration).toContain(
      "private.insert_organization_invitation_event",
    );
    expect(helpersMigration).toContain("'invitation_created'");
    expect(helpersMigration).toContain("'invitation_resent'");
    expect(helpersMigration).toContain("'invitation_revoked'");
  });

  it("maps only pending unique index collisions to invite_already_pending", () => {
    expect(helpersMigration).toContain(
      "get stacked diagnostics v_constraint = constraint_name",
    );
    expect(helpersMigration).toContain(
      "organization_invitations_pending_org_email_uidx",
    );
    expect(helpersMigration).toContain(
      "organization_invitations_token_hash_uidx",
    );
    expect(helpersMigration).toMatch(
      /if v_constraint = 'organization_invitations_pending_org_email_uidx' then[\s\S]*invite_already_pending/,
    );
    expect(helpersMigration).toMatch(
      /if v_constraint = 'organization_invitations_token_hash_uidx' then[\s\S]*continue/,
    );
    expect(helpersMigration).not.toMatch(
      /when unique_violation then\s+-- Concurrent create race: final pending uniqueness backstop\.\s+select oi\.id/,
    );
    expect(helpersMigration).toContain("'unexpected'");
  });

  it("hardens EXECUTE: authenticated grant; public/anon/service_role revoke", () => {
    expect(hardeningMigration).toContain(
      "revoke all on function public.create_organization_invitation(uuid, text, text) from service_role",
    );
    expect(hardeningMigration).toContain(
      "grant execute on function public.create_organization_invitation(uuid, text, text) to authenticated",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function public.resend_organization_invitation(uuid, uuid) from service_role",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function public.revoke_organization_invitation(uuid, uuid) from service_role",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function private.generate_organization_invitation_token_pair() from service_role",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from service_role",
    );
  });
});
