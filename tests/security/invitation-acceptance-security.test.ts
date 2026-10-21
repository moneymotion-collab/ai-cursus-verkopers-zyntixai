import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const helpersMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260810143000_add_organization_invitation_acceptance_helpers_and_rpc.sql",
  ),
  "utf8",
);

const hardeningMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260810143010_organization_invitation_acceptance_rpc_security_hardening.sql",
  ),
  "utf8",
);

const allAcceptanceMigrations = [helpersMigration, hardeningMigration].join(
  "\n",
);

describe("Invitations Acceptance RPC & membership activation security contract", () => {
  it("exposes accept_organization_invitation(text) only as public Accept RPC", () => {
    expect(helpersMigration).toContain(
      "create or replace function public.accept_organization_invitation(",
    );
    expect(helpersMigration).toMatch(
      /create or replace function public\.accept_organization_invitation\(\s*p_raw_token text\s*\)/,
    );
    expect(helpersMigration).not.toMatch(
      /accept_organization_invitation\([^)]*uuid/,
    );
    expect(helpersMigration).not.toMatch(
      /p_user_id|p_email|p_organization_id|p_role|p_membership_id|p_invitation_id|p_accepted/,
    );
  });

  it("marks Accept RPC SECURITY DEFINER with empty search_path", () => {
    expect(helpersMigration).toMatch(
      /create or replace function public\.accept_organization_invitation[\s\S]*?security definer\s+set search_path = ''/,
    );
  });

  it("derives auth.uid and requires authenticated callers", () => {
    expect(helpersMigration).toContain("auth.uid()");
    expect(helpersMigration).toContain("if auth.uid() is null then");
    expect(helpersMigration).toContain("invite_not_found_or_unavailable");
  });

  it("loads authoritative email from auth.users by auth.uid via private helper", () => {
    expect(helpersMigration).toContain(
      "private.get_organization_invitation_accept_identity",
    );
    expect(helpersMigration).toContain("from auth.users as u");
    expect(helpersMigration).toContain("where u.id = v_uid");
    expect(helpersMigration).toContain("u.email_confirmed_at");
    expect(helpersMigration).not.toMatch(/auth\.jwt\(\)/);
    expect(helpersMigration).not.toMatch(/p_email/);
  });

  it("requires email_confirmed_at and denies unverified without mutation", () => {
    expect(helpersMigration).toContain("email_confirmed");
    expect(helpersMigration).toContain(
      "if not coalesce(v_email_confirmed, false) then",
    );
    expect(helpersMigration).toContain("'forbidden'");
  });

  it("normalizes email with lower(btrim(...)) only and exact-match against invitation", () => {
    expect(helpersMigration).toContain(
      "email_normalized := lower(btrim(coalesce(v_email, '')));",
    );
    expect(helpersMigration).toContain(
      "if v_email_normalized is distinct from v_invitation.email_normalized then",
    );
    expect(helpersMigration).toContain("'email_mismatch'");
    expect(helpersMigration).not.toMatch(/gmail|plus.?strip|dot.?normal/i);
  });

  it("validates 64 lowercase hex raw token before digest", () => {
    expect(helpersMigration).toContain("v_raw !~ '^[0-9a-f]{64}$'");
  });

  it("reuses exact operator SHA-256 hex of UTF-8 raw token string", () => {
    expect(helpersMigration).toContain(
      "private.hash_organization_invitation_raw_token",
    );
    expect(helpersMigration).toContain(
      "extensions.digest(convert_to(p_raw_token, 'UTF8'), 'sha256')",
    );
    expect(helpersMigration).not.toContain("generate_organization_invitation_token_pair");
  });

  it("looks up invitation by token_hash with FOR UPDATE and post-lock revalidation", () => {
    expect(helpersMigration).toMatch(
      /where oi\.token_hash = v_computed_hash\s+for update/,
    );
    expect(helpersMigration).toContain(
      "CRITICAL post-lock token revalidation",
    );
    expect(helpersMigration).toContain(
      "if v_invitation.token_hash is distinct from v_computed_hash then",
    );
  });

  it("requires pending + unexpired and implements OD-ACC-4 expiry materialization", () => {
    expect(helpersMigration).toContain(
      "if v_invitation.status is distinct from 'pending' then",
    );
    expect(helpersMigration).toContain("v_now >= v_invitation.expires_at");
    expect(helpersMigration).toContain("OD-ACC-4 OPTION B");
    expect(helpersMigration).toContain("status = 'expired'");
    expect(helpersMigration).toContain("token_hash = null");
    expect(allAcceptanceMigrations).not.toMatch(/'invitation_expired'/);
  });

  it("requires active organization via published assert helper", () => {
    expect(helpersMigration).toContain(
      "private.assert_active_organization_for_invitation_mutation",
    );
  });

  it("derives membership role from invitation and never creates owner", () => {
    expect(helpersMigration).toContain("v_invitation.role");
    expect(helpersMigration).toContain(
      "v_invitation.role not in ('admin', 'staff', 'viewer')",
    );
    expect(helpersMigration).toMatch(
      /insert into public\.organization_members \(\s*organization_id,\s*user_id,\s*role,\s*status,\s*joined_at\s*\)/s,
    );
    expect(helpersMigration).not.toMatch(
      /role\s*,\s*'owner'|values\s*\([^)]*'owner'/,
    );
    expect(helpersMigration).not.toContain("complete_owner_self_registration");
    expect(helpersMigration).not.toMatch(
      /insert into public\.organizations/i,
    );
  });

  it("does not reauthorize original inviter at acceptance", () => {
    expect(helpersMigration).not.toContain("invited_by_member_id");
    expect(helpersMigration).not.toContain(
      "can_create_organization_invitation_target",
    );
    expect(helpersMigration).not.toContain(
      "can_manage_organization_invitation_target",
    );
  });

  it("implements active-member idempotent terminalization without role mutation", () => {
    expect(helpersMigration).toContain("v_had_active_membership");
    expect(helpersMigration).toContain("'already_member'");
    expect(helpersMigration).toContain("status = 'accepted'");
    expect(helpersMigration).toContain("accepted_at = v_now");
    expect(helpersMigration).toContain("accepted_by_user_id = v_user_id");
    expect(helpersMigration).toContain("token_hash = null");
    expect(helpersMigration).toContain(
      "Do NOT update existing active membership role/status from Invitation",
    );
    expect(helpersMigration).not.toMatch(
      /v_had_active_membership := true;[\s\S]{0,400}update public\.organization_members/,
    );
  });

  it("returns NULL identifiers on all non-success failure paths", () => {
    const failureReturns = helpersMigration.match(
      /return query\s+select\s+'[^']+'::text,\s*null::uuid,\s*null::uuid,\s*null::uuid;/g,
    );
    expect(failureReturns?.length ?? 0).toBeGreaterThanOrEqual(10);
    expect(helpersMigration).toMatch(
      /'email_mismatch'::text,\s*null::uuid,\s*null::uuid,\s*null::uuid/,
    );
    expect(helpersMigration).toMatch(
      /'existing_membership_requires_admin_action'::text,\s*null::uuid,\s*null::uuid,\s*null::uuid/,
    );
    expect(helpersMigration).toMatch(
      /'invite_not_found_or_unavailable'::text,\s*null::uuid,\s*null::uuid,\s*null::uuid/,
    );
    expect(helpersMigration).toMatch(
      /'forbidden'::text,\s*null::uuid,\s*null::uuid,\s*null::uuid/,
    );
  });

  it("raises on terminalization miss to roll back membership writes", () => {
    expect(helpersMigration).toContain(
      "invitation accept terminalization race",
    );
    expect(helpersMigration).toContain(
      "never return success/unavailable after a membership write",
    );
  });

  it("handles organization_members_org_user_unique specifically on insert race", () => {
    expect(helpersMigration).toContain(
      "get stacked diagnostics v_constraint = constraint_name",
    );
    expect(helpersMigration).toContain(
      "organization_members_org_user_unique",
    );
    expect(helpersMigration).toContain("'unexpected'");
  });

  it("implements OD-ACC-1 OPTION B legacy invited denial without mutation", () => {
    expect(helpersMigration).toContain("OD-ACC-1 OPTION B");
    expect(helpersMigration).toContain("v_membership_status = 'invited'");
    expect(helpersMigration).toContain(
      "existing_membership_requires_admin_action",
    );
    expect(helpersMigration).not.toMatch(
      /status\s*=\s*'invited'[\s\S]{0,200}status\s*=\s*'active'/,
    );
  });

  it("implements OD-ACC-3 OPTION A suspended/removed denial without auto-revoke", () => {
    expect(helpersMigration).toContain("OD-ACC-3 OPTION A");
    expect(helpersMigration).toContain(
      "v_membership_status in ('suspended', 'removed')",
    );
    expect(helpersMigration).not.toMatch(
      /suspended[\s\S]{0,120}status = 'revoked'/,
    );
    expect(helpersMigration).not.toMatch(
      /removed[\s\S]{0,120}status = 'revoked'/,
    );
  });

  it("emits one invitation_accepted event with invitee membership actor", () => {
    expect(helpersMigration).toContain(
      "private.insert_organization_invitation_event",
    );
    expect(helpersMigration).toContain("'invitation_accepted'");
    expect(helpersMigration).toMatch(
      /insert_organization_invitation_event\(\s*v_invitation\.organization_id,\s*v_invitation\.id,\s*'invitation_accepted',\s*v_membership_id/s,
    );
  });

  it("requires profile existence before acceptance writes", () => {
    expect(helpersMigration).toContain("from public.profiles as p");
    expect(helpersMigration).toContain("where p.id = v_user_id");
  });

  it("hardens EXECUTE: authenticated grant; public/anon/service_role revoke", () => {
    expect(hardeningMigration).toContain(
      "revoke all on function public.accept_organization_invitation(text) from service_role",
    );
    expect(hardeningMigration).toContain(
      "grant execute on function public.accept_organization_invitation(text) to authenticated",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function private.hash_organization_invitation_raw_token(text) from service_role",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function private.get_organization_invitation_accept_identity() from service_role",
    );
  });

  it("contains no application route/UI/email/rate-limit work", () => {
    expect(allAcceptanceMigrations).not.toMatch(
      /invite\/accept|localStorage|resend\.|sendgrid|rate.?limit/i,
    );
    expect(allAcceptanceMigrations).not.toContain(
      "complete_owner_self_registration",
    );
  });
});
