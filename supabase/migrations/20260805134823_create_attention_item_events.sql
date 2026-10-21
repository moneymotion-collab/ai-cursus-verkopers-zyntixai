-- ZyntixAI B1.7.3 Attention RPC Foundation:
-- append-only attention_item_events audit table

create table public.attention_item_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  attention_item_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text,
  from_severity text,
  to_severity text,
  from_assignee_member_id uuid,
  to_assignee_member_id uuid,
  reason text,
  source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint attention_item_events_org_id_unique unique (organization_id, id),
  constraint attention_item_events_event_type_check check (
    event_type in (
      'created',
      'status_changed',
      'assigned',
      'severity_changed',
      'signal_recorded',
      'archived',
      'detection_updated'
    )
  ),
  constraint attention_item_events_from_status_check check (
    from_status is null
    or from_status in ('open', 'acknowledged', 'resolved', 'dismissed', 'expired')
  ),
  constraint attention_item_events_to_status_check check (
    to_status is null
    or to_status in ('open', 'acknowledged', 'resolved', 'dismissed', 'expired')
  ),
  constraint attention_item_events_from_severity_check check (
    from_severity is null
    or from_severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint attention_item_events_to_severity_check check (
    to_severity is null
    or to_severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint attention_item_events_source_check check (
    source in ('manual', 'rule', 'system')
  ),
  constraint attention_item_events_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  ),
  constraint attention_item_events_reason_length_check check (
    reason is null
    or (
      char_length(btrim(reason)) > 0
      and char_length(btrim(reason)) <= 2000
    )
  ),
  constraint attention_item_events_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint attention_item_events_item_fk foreign key (
    organization_id,
    attention_item_id
  )
    references public.attention_items (organization_id, id)
    on delete cascade,
  constraint attention_item_events_actor_member_fk foreign key (
    organization_id,
    actor_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint attention_item_events_from_assignee_member_fk foreign key (
    organization_id,
    from_assignee_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint attention_item_events_to_assignee_member_fk foreign key (
    organization_id,
    to_assignee_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.attention_item_events is
  'Append-only Attention Item audit events. Written only via SECURITY DEFINER helpers/RPCs.';

create or replace function private.guard_attention_item_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'attention item events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_attention_item_event_immutable() from public;
revoke all on function private.guard_attention_item_event_immutable() from anon;
revoke all on function private.guard_attention_item_event_immutable() from authenticated;
revoke all on function private.guard_attention_item_event_immutable() from service_role;

create trigger attention_item_events_guard_immutable
  before update on public.attention_item_events
  for each row
  execute function private.guard_attention_item_event_immutable();

create index attention_item_events_organization_id_item_id_created_at_idx
  on public.attention_item_events (organization_id, attention_item_id, created_at desc);

create index attention_item_events_organization_id_created_at_idx
  on public.attention_item_events (organization_id, created_at desc);

alter table public.attention_item_events enable row level security;

revoke all on table public.attention_item_events from public;
revoke all on table public.attention_item_events from anon;
revoke all on table public.attention_item_events from authenticated;
