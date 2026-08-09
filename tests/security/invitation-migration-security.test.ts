import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const invitationsSchemaMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260809224000_create_organization_invitations.sql",
  ),
  "utf8",
);

const invitationEventsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260809224010_create_organization_invitation_events.sql",
  ),
  "utf8",
);

const invitationRlsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260809224020_enable_organization_invitation_operational_rls.sql",
  ),
  "utf8",
);

const allInvitationMigrations = [
  invitationsSchemaMigration,
  invitationEventsMigration,
  invitationRlsMigration,
].join("\n");

describe("Invitations database foundation migration security contract", () => {
  it("creates invitation and event tables without Postgres ENUM types", () => {
    expect(invitationsSchemaMigration).toContain(
      "create table public.organization_invitations",
    );
    expect(invitationEventsMigration).toContain(
      "create table public.organization_invitation_events",
    );
    expect(allInvitationMigrations).not.toMatch(/create type\s+/i);
  });

  it("constrains invitation status with text CHECK values only", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_status_check",
    );
    expect(invitationsSchemaMigration).toMatch(
      /status in \('pending', 'accepted', 'revoked', 'expired'\)/,
    );
  });

  it("constrains invitation role to admin/staff/viewer and makes owner impossible", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_role_check",
    );
    expect(invitationsSchemaMigration).toMatch(
      /role in \('admin', 'staff', 'viewer'\)/,
    );
    expect(invitationsSchemaMigration).not.toMatch(
      /role in \([^)]*'owner'/,
    );
  });

  it("enforces email_normalized lower(btrim(...)) invariant", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_email_normalized_check",
    );
    expect(invitationsSchemaMigration).toContain(
      "email_normalized = lower(btrim(email_normalized))",
    );
  });

  it("enforces pending uniqueness via partial unique index without now()", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_pending_org_email_uidx",
    );
    expect(invitationsSchemaMigration).toMatch(
      /unique index organization_invitations_pending_org_email_uidx[\s\S]*where status = 'pending'/,
    );
    expect(invitationsSchemaMigration).not.toMatch(
      /unique index organization_invitations_pending_org_email_uidx[\s\S]*now\s*\(/i,
    );
  });

  it("enforces non-null token_hash uniqueness and omits plaintext token column", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_token_hash_uidx",
    );
    expect(invitationsSchemaMigration).toMatch(
      /unique index organization_invitations_token_hash_uidx[\s\S]*where token_hash is not null/,
    );
    expect(invitationsSchemaMigration).toContain("token_hash");
    expect(invitationsSchemaMigration).not.toMatch(/\braw_token\b/);
    expect(invitationsSchemaMigration).not.toMatch(/\bplaintext_token\b/);
    expect(invitationsSchemaMigration).not.toMatch(/\btoken_plaintext\b/);
  });

  it("locks pending/accepted/revoked/expired status-timestamp-token invariants", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_pending_fields_check",
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_accepted_fields_check",
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_revoked_fields_check",
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_expired_fields_check",
    );
    expect(invitationsSchemaMigration).toMatch(
      /status <> 'pending'[\s\S]*token_hash is not null[\s\S]*expires_at is not null/,
    );
    expect(invitationsSchemaMigration).toMatch(
      /status <> 'accepted'[\s\S]*accepted_at is not null[\s\S]*token_hash is null/,
    );
    // accepted_by_user_id may become NULL after profile deletion (SET NULL FK).
    expect(invitationsSchemaMigration).not.toMatch(
      /organization_invitations_accepted_fields_check[\s\S]*accepted_by_user_id is not null/,
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_accepted_by_user_status_check",
    );
    expect(invitationsSchemaMigration).toMatch(
      /accepted_by_user_id is null\s+or status = 'accepted'/,
    );
    expect(invitationsSchemaMigration).toMatch(
      /status <> 'revoked'[\s\S]*token_hash is null/,
    );
    expect(invitationsSchemaMigration).toMatch(
      /status <> 'expired'[\s\S]*token_hash is null/,
    );
  });

  it("keeps accepted_by_user_id FK SET NULL coherent with accepted-state CHECKs", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_accepted_by_user_fk",
    );
    expect(invitationsSchemaMigration).toMatch(
      /constraint organization_invitations_accepted_by_user_fk[\s\S]*references public\.profiles \(id\)\s+on delete set null/,
    );
    expect(invitationsSchemaMigration).not.toMatch(
      /constraint organization_invitations_accepted_by_user_fk[\s\S]*on delete restrict/,
    );
  });

  it("anchors organization and inviter with tenant-safe FKs", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_org_id_unique",
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_organization_fk",
    );
    expect(invitationsSchemaMigration).toMatch(
      /references public\.organizations \(id\)\s+on delete cascade/,
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_inviter_member_fk",
    );
    expect(invitationsSchemaMigration).toMatch(
      /references public\.organization_members \(\s*organization_id,\s*id\s*\)\s+on delete restrict/,
    );
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_accepted_by_user_fk",
    );
    expect(invitationsSchemaMigration).toMatch(
      /references public\.profiles \(id\)\s+on delete set null/,
    );
  });

  it("reuses public.set_updated_at and enables deny-by-default RLS on invitations", () => {
    expect(invitationsSchemaMigration).toContain(
      "organization_invitations_set_updated_at",
    );
    expect(invitationsSchemaMigration).toContain(
      "execute function public.set_updated_at()",
    );
    expect(invitationsSchemaMigration).toContain(
      "alter table public.organization_invitations enable row level security",
    );
    expect(invitationsSchemaMigration).toContain(
      "revoke all on table public.organization_invitations from authenticated",
    );
    expect(invitationsSchemaMigration).not.toMatch(
      /^\s*create policy\b/im,
    );
  });

  it("does not implement lazy-expiry mutation or business RPCs in schema migration", () => {
    expect(allInvitationMigrations).not.toMatch(
      /create (or replace )?function public\.(create|resend|revoke|accept)_organization_invitation/i,
    );
    expect(allInvitationMigrations).not.toContain("auth.users");
    expect(allInvitationMigrations).not.toMatch(/gen_random_bytes\s*\(/i);
    expect(allInvitationMigrations).not.toMatch(/digest\s*\(/i);
    expect(allInvitationMigrations).not.toMatch(/encode\s*\(/i);
  });
});

describe("Invitations event persistence migration security contract", () => {
  it("locks event types without invitation_expired", () => {
    expect(invitationEventsMigration).toContain(
      "organization_invitation_events_event_type_check",
    );
    expect(invitationEventsMigration).toContain("'invitation_created'");
    expect(invitationEventsMigration).toContain("'invitation_resent'");
    expect(invitationEventsMigration).toContain("'invitation_revoked'");
    expect(invitationEventsMigration).toContain("'invitation_accepted'");
    expect(invitationEventsMigration).not.toContain("'invitation_expired'");
  });

  it("tenant-anchors events to invitations and organizations", () => {
    expect(invitationEventsMigration).toContain(
      "organization_invitation_events_invitation_fk",
    );
    expect(invitationEventsMigration).toMatch(
      /references public\.organization_invitations \(\s*organization_id,\s*id\s*\)/,
    );
    expect(invitationEventsMigration).toContain(
      "organization_invitation_events_actor_member_fk",
    );
  });

  it("implements UPDATE immutability with hardened SECURITY DEFINER trigger function", () => {
    expect(invitationEventsMigration).toContain(
      "private.guard_organization_invitation_event_immutable",
    );
    expect(invitationEventsMigration).toContain("security definer");
    expect(invitationEventsMigration).toContain("set search_path = ''");
    expect(invitationEventsMigration).toContain(
      "organization_invitation_events_guard_immutable",
    );
    expect(invitationEventsMigration).toMatch(
      /before update on public\.organization_invitation_events/,
    );
    expect(invitationEventsMigration).toContain(
      "revoke all on function private.guard_organization_invitation_event_immutable() from authenticated",
    );
    expect(invitationEventsMigration).toContain(
      "revoke all on function private.guard_organization_invitation_event_immutable() from service_role",
    );
  });

  it("denies authenticated event writes by default before operational grants", () => {
    expect(invitationEventsMigration).toContain(
      "alter table public.organization_invitation_events enable row level security",
    );
    expect(invitationEventsMigration).toContain(
      "revoke all on table public.organization_invitation_events from authenticated",
    );
  });

  it("forbids token secrets in event table columns", () => {
    expect(invitationEventsMigration).not.toMatch(
      /^\s*token_hash\b/m,
    );
    expect(invitationEventsMigration).not.toMatch(/\braw_token\b/);
    expect(invitationEventsMigration).not.toMatch(
      /create table public\.organization_invitation_events \([\s\S]*token_hash/,
    );
  });
});

describe("Invitations operational RLS migration security contract", () => {
  it("grants authenticated SELECT excluding token_hash", () => {
    expect(invitationRlsMigration).toMatch(
      /grant select \(\s*id,\s*organization_id,\s*email_normalized,\s*role,\s*status,\s*invited_by_member_id,\s*expires_at,\s*accepted_at,\s*accepted_by_user_id,\s*revoked_at,\s*created_at,\s*updated_at\s*\) on table public\.organization_invitations to authenticated/s,
    );
    expect(invitationRlsMigration).not.toMatch(
      /grant select[\s\S]*token_hash[\s\S]*organization_invitations/i,
    );
    expect(invitationRlsMigration).not.toMatch(
      /grant select on table public\.organization_invitations to authenticated/i,
    );
  });

  it("creates Owner/Admin SELECT policies without organizations.status gate (OD-1)", () => {
    expect(invitationRlsMigration).toContain(
      "organization_invitations_select_owner_admin",
    );
    expect(invitationRlsMigration).toContain(
      "organization_invitation_events_select_owner_admin",
    );
    expect(invitationRlsMigration).toContain(
      "private.has_org_role(organization_id, array['owner', 'admin'])",
    );
    expect(invitationRlsMigration).not.toMatch(
      /using\s*\([\s\S]*organizations\.status/i,
    );
    expect(invitationRlsMigration).not.toMatch(
      /from public\.organizations/,
    );
  });

  it("does not create Staff/Viewer invitation SELECT policies", () => {
    expect(invitationRlsMigration).not.toMatch(
      /create policy[\s\S]*staff/i,
    );
    expect(invitationRlsMigration).not.toMatch(
      /create policy[\s\S]*viewer/i,
    );
    expect(invitationRlsMigration).not.toContain(
      "private.is_org_member(organization_id)",
    );
  });

  it("keeps authenticated invitation and event mutation privileges revoked", () => {
    expect(invitationRlsMigration).toContain(
      "revoke insert, update, delete on table public.organization_invitations from authenticated",
    );
    expect(invitationRlsMigration).toContain(
      "revoke insert, update, delete on table public.organization_invitation_events from authenticated",
    );
    expect(invitationRlsMigration).not.toMatch(
      /grant (insert|update|delete)/i,
    );
    expect(invitationRlsMigration).not.toMatch(
      /for (insert|update|delete)/i,
    );
  });

  it("grants event SELECT without exposing invitation token_hash", () => {
    expect(invitationRlsMigration).toContain(
      "grant select on table public.organization_invitation_events to authenticated",
    );
  });
});
