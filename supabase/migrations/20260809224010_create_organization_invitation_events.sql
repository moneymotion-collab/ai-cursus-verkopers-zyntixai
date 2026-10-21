-- ZyntixAI Invitations / Member Administration:
-- append-only organization_invitation_events (no business RPCs)

create table public.organization_invitation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  invitation_id uuid not null,
  event_type text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint organization_invitation_events_org_id_unique unique (
    organization_id,
    id
  ),
  constraint organization_invitation_events_event_type_check check (
    event_type in (
      'invitation_created',
      'invitation_resent',
      'invitation_revoked',
      'invitation_accepted'
    )
  ),
  constraint organization_invitation_events_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  ),
  constraint organization_invitation_events_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete cascade,
  constraint organization_invitation_events_invitation_fk foreign key (
    organization_id,
    invitation_id
  )
    references public.organization_invitations (organization_id, id)
    on delete cascade,
  constraint organization_invitation_events_actor_member_fk foreign key (
    organization_id,
    actor_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.organization_invitation_events is
  'Append-only organization invitation audit events. Written only via future SECURITY DEFINER helpers/RPCs. No raw token or credential hash columns.';

create or replace function private.guard_organization_invitation_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'organization invitation events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_organization_invitation_event_immutable() from public;
revoke all on function private.guard_organization_invitation_event_immutable() from anon;
revoke all on function private.guard_organization_invitation_event_immutable() from authenticated;
revoke all on function private.guard_organization_invitation_event_immutable() from service_role;

create trigger organization_invitation_events_guard_immutable
  before update on public.organization_invitation_events
  for each row
  execute function private.guard_organization_invitation_event_immutable();

create index organization_invitation_events_org_invitation_created_at_idx
  on public.organization_invitation_events (
    organization_id,
    invitation_id,
    created_at desc
  );

create index organization_invitation_events_organization_id_created_at_idx
  on public.organization_invitation_events (organization_id, created_at desc);

alter table public.organization_invitation_events enable row level security;

revoke all on table public.organization_invitation_events from public;
revoke all on table public.organization_invitation_events from anon;
revoke all on table public.organization_invitation_events from authenticated;

-- Intentionally no GRANT and no SELECT policy yet.
-- Operational Owner/Admin SELECT is added in a later migration.
-- Authenticated INSERT/UPDATE/DELETE remain denied by privileges + RLS.
