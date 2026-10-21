-- ZyntixAI ORG-CONTEXT-1B — Business Activity + Context assignment foundation.
--
-- Additive tenant schema only. No backfill. No Production apply.
-- Does not alter organizations, TAX, CAP, CTX, onboarding, or Social.
--
-- Organization remains the tenant boundary.
-- Business Activity owns classification and is the pin grain.
-- Context assignment stores an exact immutable context_pack_version_id.
-- Assignment is not entitlement, authorization, execution, or resolution.

create or replace function private.guard_organization_context_assignment_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'organization context assignment events are immutable'
    using errcode = 'P0001';
end;
$$;

comment on function private.guard_organization_context_assignment_event_immutable() is
  'ORG-CONTEXT-1B: append-only protection for assignment events. Not a public RPC.';

revoke all on function private.guard_organization_context_assignment_event_immutable() from public;
revoke all on function private.guard_organization_context_assignment_event_immutable() from anon;
revoke all on function private.guard_organization_context_assignment_event_immutable() from authenticated;
revoke all on function private.guard_organization_context_assignment_event_immutable() from service_role;

create or replace function private.enforce_organization_business_activity_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id then
      raise exception 'ORG-CONTEXT: business activity id is immutable'
        using errcode = 'P0001';
    end if;
    if old.organization_id is distinct from new.organization_id then
      raise exception 'ORG-CONTEXT: business activity organization_id is immutable'
        using errcode = 'P0001';
    end if;
    if old.activity_key is distinct from new.activity_key then
      raise exception 'ORG-CONTEXT: activity_key is immutable'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_organization_business_activity_identity() is
  'ORG-CONTEXT-1B: freeze activity identity. Not a public RPC.';

revoke all on function private.enforce_organization_business_activity_identity() from public;
revoke all on function private.enforce_organization_business_activity_identity() from anon;
revoke all on function private.enforce_organization_business_activity_identity() from authenticated;
revoke all on function private.enforce_organization_business_activity_identity() from service_role;

create or replace function private.enforce_organization_context_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity_status text;
  v_classification_kind text;
  v_activity_foundation_id uuid;
  v_activity_industry_id uuid;
  v_activity_niche_id uuid;
  v_activity_specialization_id uuid;
  v_activity_deep_specialization_id uuid;
  v_pack_kind text;
  v_pack_foundation_id uuid;
  v_pack_industry_id uuid;
  v_pack_niche_id uuid;
  v_pack_specialization_id uuid;
  v_pack_deep_specialization_id uuid;
  v_publication_status text;
  v_pack_target uuid;
  v_activity_target uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.context_pack_version_id is distinct from new.context_pack_version_id
      or old.source is distinct from new.source
      or old.actor_user_id is distinct from new.actor_user_id
      or old.actor_member_id is distinct from new.actor_member_id
      or old.reason is distinct from new.reason
    then
      raise exception 'ORG-CONTEXT: assignment pin identity is immutable'
        using errcode = 'P0001';
    end if;

    if not (
      old.status = 'active'
      and new.status = 'superseded'
    ) then
      raise exception 'ORG-CONTEXT: assignment status may only move active to superseded'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if new.status <> 'active' then
    raise exception 'ORG-CONTEXT: new assignments must be status active'
      using errcode = 'P0001';
  end if;

  select
      a.status,
      a.classification_kind,
      a.foundation_id,
      a.industry_id,
      a.niche_id,
      a.specialization_id,
      a.deep_specialization_id
    into
      v_activity_status,
      v_classification_kind,
      v_activity_foundation_id,
      v_activity_industry_id,
      v_activity_niche_id,
      v_activity_specialization_id,
      v_activity_deep_specialization_id
  from public.organization_business_activities as a
  where a.organization_id = new.organization_id
    and a.id = new.business_activity_id;

  if not found then
    raise exception 'ORG-CONTEXT: business activity not found for organization'
      using errcode = 'P0001';
  end if;

  if v_activity_status = 'archived' then
    raise exception 'ORG-CONTEXT: archived activity cannot receive a new assignment'
      using errcode = 'P0001';
  end if;

  if v_classification_kind is null then
    raise exception 'ORG-CONTEXT: unclassified activity cannot be assigned a Context version'
      using errcode = 'P0001';
  end if;

  select
      p.pack_kind,
      p.foundation_id,
      p.industry_id,
      p.niche_id,
      p.specialization_id,
      p.deep_specialization_id,
      v.publication_status
    into
      v_pack_kind,
      v_pack_foundation_id,
      v_pack_industry_id,
      v_pack_niche_id,
      v_pack_specialization_id,
      v_pack_deep_specialization_id,
      v_publication_status
  from public.context_pack_versions as v
  inner join public.context_packs as p
    on p.id = v.pack_id
  where v.id = new.context_pack_version_id;

  if v_publication_status is null then
    raise exception 'ORG-CONTEXT: context pack version not found'
      using errcode = 'P0001';
  end if;

  if v_publication_status <> 'published' then
    raise exception 'ORG-CONTEXT: new assignment requires a published Context version'
      using errcode = 'P0001';
  end if;

  if v_pack_kind is distinct from v_classification_kind then
    raise exception 'ORG-CONTEXT: Context pack kind is incompatible with activity classification'
      using errcode = 'P0001';
  end if;

  v_activity_target := case v_classification_kind
    when 'foundation' then v_activity_foundation_id
    when 'industry' then v_activity_industry_id
    when 'niche' then v_activity_niche_id
    when 'specialization' then v_activity_specialization_id
    when 'deep_specialization' then v_activity_deep_specialization_id
    else null
  end;

  v_pack_target := case v_pack_kind
    when 'foundation' then v_pack_foundation_id
    when 'industry' then v_pack_industry_id
    when 'niche' then v_pack_niche_id
    when 'specialization' then v_pack_specialization_id
    when 'deep_specialization' then v_pack_deep_specialization_id
    else null
  end;

  if v_activity_target is null or v_pack_target is null or v_activity_target is distinct from v_pack_target then
    raise exception 'ORG-CONTEXT: Context pack TAX target does not match activity classification'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function private.enforce_organization_context_assignment_integrity() is
  'ORG-CONTEXT-1B: structural pin compatibility. Not admission, entitlement, or a public RPC.';

revoke all on function private.enforce_organization_context_assignment_integrity() from public;
revoke all on function private.enforce_organization_context_assignment_integrity() from anon;
revoke all on function private.enforce_organization_context_assignment_integrity() from authenticated;
revoke all on function private.enforce_organization_context_assignment_integrity() from service_role;

create table public.organization_business_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  activity_key text not null,
  display_name text not null,
  status text not null,
  is_primary boolean not null default false,
  classification_kind text,
  foundation_id uuid,
  industry_id uuid,
  niche_id uuid,
  specialization_id uuid,
  deep_specialization_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_business_activities_org_id_unique unique (
    organization_id,
    id
  ),
  constraint organization_business_activities_org_activity_key_unique unique (
    organization_id,
    activity_key
  ),
  constraint organization_business_activities_activity_key_check check (
    activity_key = lower(btrim(activity_key))
    and char_length(activity_key) between 2 and 64
    and activity_key ~ '^[a-z][a-z0-9_]*$'
  ),
  constraint organization_business_activities_display_name_check check (
    char_length(btrim(display_name)) between 2 and 100
  ),
  constraint organization_business_activities_status_check check (
    status in ('draft', 'active', 'archived')
  ),
  constraint organization_business_activities_primary_active_check check (
    is_primary = false
    or status = 'active'
  ),
  constraint organization_business_activities_kind_check check (
    classification_kind is null
    or classification_kind in (
      'foundation',
      'industry',
      'niche',
      'specialization',
      'deep_specialization'
    )
  ),
  constraint organization_business_activities_target_cardinality_check check (
    (
      (foundation_id is not null)::integer
      + (industry_id is not null)::integer
      + (niche_id is not null)::integer
      + (specialization_id is not null)::integer
      + (deep_specialization_id is not null)::integer
    ) <= 1
  ),
  constraint organization_business_activities_kind_target_check check (
    (
      classification_kind is null
      and foundation_id is null
      and industry_id is null
      and niche_id is null
      and specialization_id is null
      and deep_specialization_id is null
    )
    or (
      classification_kind = 'foundation'
      and foundation_id is not null
    )
    or (
      classification_kind = 'industry'
      and industry_id is not null
    )
    or (
      classification_kind = 'niche'
      and niche_id is not null
    )
    or (
      classification_kind = 'specialization'
      and specialization_id is not null
    )
    or (
      classification_kind = 'deep_specialization'
      and deep_specialization_id is not null
    )
  ),
  constraint organization_business_activities_active_classified_check check (
    status <> 'active'
    or classification_kind is not null
  ),
  constraint organization_business_activities_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint organization_business_activities_foundation_fk foreign key (
    foundation_id
  )
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint organization_business_activities_industry_fk foreign key (
    industry_id
  )
    references public.taxonomy_industries (id)
    on delete restrict,
  constraint organization_business_activities_niche_fk foreign key (
    niche_id
  )
    references public.taxonomy_niches (id)
    on delete restrict,
  constraint organization_business_activities_specialization_fk foreign key (
    specialization_id
  )
    references public.taxonomy_specializations (id)
    on delete restrict,
  constraint organization_business_activities_deep_specialization_fk foreign key (
    deep_specialization_id
  )
    references public.taxonomy_deep_specializations (id)
    on delete restrict
);

comment on table public.organization_business_activities is
  'Tenant Business Activities. Classification grain for ORG-CONTEXT. Not a Business Unit, Work Area, entitlement table, or Organization shortcut.';
comment on column public.organization_business_activities.activity_key is
  'Stable per-Organization machine identity. Not a TAX key. Not display_name.';
comment on column public.organization_business_activities.display_name is
  'Tenant activity label. Taxonomy labels are not identity.';
comment on column public.organization_business_activities.is_primary is
  'Default UX relevance only. Must be active. Not authorization.';
comment on column public.organization_business_activities.classification_kind is
  'Typed TAX XOR kind. Draft/archived may be null. Active requires exactly one target.';

create unique index organization_business_activities_one_active_primary_uidx
  on public.organization_business_activities (organization_id)
  where status = 'active' and is_primary = true;

create index organization_business_activities_organization_id_status_idx
  on public.organization_business_activities (organization_id, status);

create trigger organization_business_activities_set_updated_at
  before update on public.organization_business_activities
  for each row
  execute function public.set_updated_at();

create trigger organization_business_activities_enforce_identity
  before update on public.organization_business_activities
  for each row
  execute function private.enforce_organization_business_activity_identity();

create table public.organization_context_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  context_pack_version_id uuid not null,
  status text not null,
  source text not null,
  actor_user_id uuid,
  actor_member_id uuid,
  reason text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  superseded_at timestamptz,
  constraint organization_context_assignments_org_id_unique unique (
    organization_id,
    id
  ),
  constraint organization_context_assignments_status_check check (
    status in ('active', 'superseded')
  ),
  constraint organization_context_assignments_source_check check (
    source in (
      'platform_operator',
      'manual_owner',
      'manual_admin',
      'onboarding',
      'bqa_confirmed',
      'migration'
    )
  ),
  constraint organization_context_assignments_reason_check check (
    reason is null
    or (
      char_length(btrim(reason)) > 0
      and char_length(reason) <= 500
    )
  ),
  constraint organization_context_assignments_active_fields_check check (
    status <> 'active'
    or superseded_at is null
  ),
  constraint organization_context_assignments_superseded_fields_check check (
    status <> 'superseded'
    or superseded_at is not null
  ),
  constraint organization_context_assignments_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint organization_context_assignments_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint organization_context_assignments_version_fk foreign key (
    context_pack_version_id
  )
    references public.context_pack_versions (id)
    on delete restrict,
  constraint organization_context_assignments_actor_user_fk foreign key (
    actor_user_id
  )
    references public.profiles (id)
    on delete set null,
  constraint organization_context_assignments_actor_member_fk foreign key (
    organization_id,
    actor_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.organization_context_assignments is
  'Exact immutable Context version pins for a Business Activity. Not resolved Context, entitlement, permissions, or Social gates.';
comment on column public.organization_context_assignments.context_pack_version_id is
  'Pinned published Context version. Pack is derived. Never latest. ON DELETE RESTRICT.';
comment on column public.organization_context_assignments.source is
  'Provenance. v1 uses platform_operator; later sources are reserved without enum surgery.';

create unique index organization_context_assignments_one_active_uidx
  on public.organization_context_assignments (organization_id, business_activity_id)
  where status = 'active';

create index organization_context_assignments_organization_id_activity_idx
  on public.organization_context_assignments (
    organization_id,
    business_activity_id,
    created_at desc
  );

create trigger organization_context_assignments_set_updated_at
  before update on public.organization_context_assignments
  for each row
  execute function public.set_updated_at();

create trigger organization_context_assignments_enforce_integrity
  before insert or update on public.organization_context_assignments
  for each row
  execute function private.enforce_organization_context_assignment_integrity();

create table public.organization_context_assignment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  assignment_id uuid,
  event_type text not null,
  actor_user_id uuid,
  actor_member_id uuid,
  source text not null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint organization_context_assignment_events_org_id_unique unique (
    organization_id,
    id
  ),
  constraint organization_context_assignment_events_event_type_check check (
    event_type in (
      'business_activity_created',
      'business_activity_classified',
      'context_version_assigned',
      'context_version_changed',
      'primary_activity_changed',
      'business_activity_archived'
    )
  ),
  constraint organization_context_assignment_events_source_check check (
    source in (
      'platform_operator',
      'manual_owner',
      'manual_admin',
      'onboarding',
      'bqa_confirmed',
      'migration'
    )
  ),
  constraint organization_context_assignment_events_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  ),
  constraint organization_context_assignment_events_reason_check check (
    reason is null
    or (
      char_length(btrim(reason)) > 0
      and char_length(reason) <= 500
    )
  ),
  constraint organization_context_assignment_events_assignment_required_check check (
    event_type not in ('context_version_assigned', 'context_version_changed')
    or assignment_id is not null
  ),
  constraint organization_context_assignment_events_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint organization_context_assignment_events_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint organization_context_assignment_events_assignment_fk foreign key (
    organization_id,
    assignment_id
  )
    references public.organization_context_assignments (organization_id, id)
    on delete restrict,
  constraint organization_context_assignment_events_actor_user_fk foreign key (
    actor_user_id
  )
    references public.profiles (id)
    on delete set null,
  constraint organization_context_assignment_events_actor_member_fk foreign key (
    organization_id,
    actor_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.organization_context_assignment_events is
  'Append-only ORG-CONTEXT governance events. Canonical truth stays on activity/assignment rows. Not a resolver snapshot.';

create index organization_context_assignment_events_org_created_at_idx
  on public.organization_context_assignment_events (
    organization_id,
    created_at desc
  );

create index organization_context_assignment_events_activity_created_at_idx
  on public.organization_context_assignment_events (
    organization_id,
    business_activity_id,
    created_at desc
  );

create trigger organization_context_assignment_events_guard_immutable
  before update or delete on public.organization_context_assignment_events
  for each row
  execute function private.guard_organization_context_assignment_event_immutable();

-- Deny-by-default until the companion RLS/grants migration. No policies here.
alter table public.organization_business_activities enable row level security;
alter table public.organization_context_assignments enable row level security;
alter table public.organization_context_assignment_events enable row level security;

revoke all on table public.organization_business_activities from public;
revoke all on table public.organization_business_activities from anon;
revoke all on table public.organization_business_activities from authenticated;
revoke all on table public.organization_business_activities from service_role;

revoke all on table public.organization_context_assignments from public;
revoke all on table public.organization_context_assignments from anon;
revoke all on table public.organization_context_assignments from authenticated;
revoke all on table public.organization_context_assignments from service_role;

revoke all on table public.organization_context_assignment_events from public;
revoke all on table public.organization_context_assignment_events from anon;
revoke all on table public.organization_context_assignment_events from authenticated;
revoke all on table public.organization_context_assignment_events from service_role;
