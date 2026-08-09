-- ZyntixAI Invitations / Member Administration:
-- organization_invitations schema foundation (no RPCs / no token crypto)

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  email_normalized text not null,
  role text not null,
  status text not null,
  invited_by_member_id uuid not null,
  token_hash text,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by_user_id uuid,
  revoked_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_invitations_org_id_unique unique (organization_id, id),
  constraint organization_invitations_status_check check (
    status in ('pending', 'accepted', 'revoked', 'expired')
  ),
  constraint organization_invitations_role_check check (
    role in ('admin', 'staff', 'viewer')
  ),
  constraint organization_invitations_email_normalized_check check (
    email_normalized = lower(btrim(email_normalized))
    and char_length(email_normalized) > 0
    and char_length(email_normalized) <= 254
  ),
  constraint organization_invitations_token_hash_present_check check (
    token_hash is null
    or char_length(btrim(token_hash)) > 0
  ),
  constraint organization_invitations_expires_at_order_check check (
    expires_at is null
    or expires_at >= created_at
  ),
  constraint organization_invitations_pending_fields_check check (
    status <> 'pending'
    or (
      accepted_at is null
      and accepted_by_user_id is null
      and revoked_at is null
      and token_hash is not null
      and expires_at is not null
    )
  ),
  constraint organization_invitations_accepted_fields_check check (
    status <> 'accepted'
    or (
      accepted_at is not null
      and revoked_at is null
      and token_hash is null
    )
  ),
  constraint organization_invitations_accepted_by_user_status_check check (
    accepted_by_user_id is null
    or status = 'accepted'
  ),
  constraint organization_invitations_revoked_fields_check check (
    status <> 'revoked'
    or (
      revoked_at is not null
      and accepted_at is null
      and accepted_by_user_id is null
      and token_hash is null
    )
  ),
  constraint organization_invitations_expired_fields_check check (
    status <> 'expired'
    or (
      accepted_at is null
      and accepted_by_user_id is null
      and revoked_at is null
      and token_hash is null
    )
  ),
  constraint organization_invitations_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint organization_invitations_inviter_member_fk foreign key (
    organization_id,
    invited_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint organization_invitations_accepted_by_user_fk foreign key (
    accepted_by_user_id
  )
    references public.profiles (id)
    on delete set null
);

comment on table public.organization_invitations is
  'Email-first organization invitations. Mutations via future SECURITY DEFINER RPCs only; token_hash never granted to ordinary authenticated SELECT.';

comment on column public.organization_invitations.accepted_by_user_id is
  'Accepting profile id when known. Required at accept time by future RPC; may become NULL if the profile is later deleted (ON DELETE SET NULL) while status/accepted_at remain.';

comment on column public.organization_invitations.token_hash is
  'Cryptographic hash of invitation credential. Present only while status=pending. Never expose via ordinary authenticated SELECT grants.';

create unique index organization_invitations_pending_org_email_uidx
  on public.organization_invitations (organization_id, email_normalized)
  where status = 'pending';

create unique index organization_invitations_token_hash_uidx
  on public.organization_invitations (token_hash)
  where token_hash is not null;

create index organization_invitations_organization_id_created_at_idx
  on public.organization_invitations (organization_id, created_at desc);

create index organization_invitations_organization_id_status_idx
  on public.organization_invitations (organization_id, status);

create trigger organization_invitations_set_updated_at
  before update on public.organization_invitations
  for each row
  execute function public.set_updated_at();

alter table public.organization_invitations enable row level security;

revoke all on table public.organization_invitations from public;
revoke all on table public.organization_invitations from anon;
revoke all on table public.organization_invitations from authenticated;

-- Intentionally no GRANT SELECT/INSERT/UPDATE/DELETE and no SELECT policy yet.
-- Operational Owner/Admin SELECT (excluding token_hash) is added in a later migration.
-- Application mutations remain reserved for future SECURITY DEFINER RPCs.
