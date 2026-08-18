-- SMM-R1-A: Closed-beta enrollment foundation
-- Additive entitlement under GLOBAL SOCIAL_PUBLISHING_ENABLED kill switch.
-- No automatic enrollments. No provider writes. Pause/revoke never deletes Social evidence.
-- Operator mutations: service_role + session GUC only (not customer self-serve).

-- ---------------------------------------------------------------------------
-- Enrollment current state (row absent = not enrolled)
-- ---------------------------------------------------------------------------

create table public.social_closed_beta_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  status text not null,
  status_before_pause text,
  reason text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  approved_at timestamptz,
  publishing_allowed_at timestamptz,
  paused_at timestamptz,
  revoked_at timestamptz,
  constraint social_closed_beta_enrollments_organization_unique
    unique (organization_id),
  constraint social_closed_beta_enrollments_org_id_unique
    unique (organization_id, id),
  constraint social_closed_beta_enrollments_status_chk
    check (status in ('approved', 'publishing_allowed', 'paused', 'revoked')),
  constraint social_closed_beta_enrollments_status_before_pause_chk
    check (
      status_before_pause is null
      or status_before_pause in ('approved', 'publishing_allowed')
    ),
  constraint social_closed_beta_enrollments_reason_len_chk
    check (reason is null or char_length(reason) <= 500),
  constraint social_closed_beta_enrollments_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade
);

create index social_closed_beta_enrollments_status_idx
  on public.social_closed_beta_enrollments (status);

create trigger social_closed_beta_enrollments_set_updated_at
  before update on public.social_closed_beta_enrollments
  for each row execute function public.set_updated_at();

alter table public.social_closed_beta_enrollments enable row level security;
revoke all on table public.social_closed_beta_enrollments from public;
revoke all on table public.social_closed_beta_enrollments from anon;
revoke all on table public.social_closed_beta_enrollments from authenticated;
revoke all on table public.social_closed_beta_enrollments from service_role;
grant select on table public.social_closed_beta_enrollments to authenticated;
create policy social_closed_beta_enrollments_select_owner_admin
  on public.social_closed_beta_enrollments
  for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_closed_beta_enrollments from authenticated;
revoke insert, update, delete on table public.social_closed_beta_enrollments from anon;

comment on table public.social_closed_beta_enrollments is
  'SMM-R1: org-level closed-beta Social entitlement. Absent row = not enrolled. Mutations only via platform operator RPCs.';

-- ---------------------------------------------------------------------------
-- Append-only enrollment events
-- ---------------------------------------------------------------------------

create table public.social_closed_beta_enrollment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  enrollment_id uuid not null,
  event_type text not null,
  previous_status text,
  next_status text not null,
  actor_source text not null,
  actor_user_id uuid,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_closed_beta_enrollment_events_org_id_unique
    unique (organization_id, id),
  constraint social_closed_beta_enrollment_events_event_type_chk
    check (
      event_type in (
        'social_beta_enrolled_approved',
        'social_beta_publishing_allowed',
        'social_beta_paused',
        'social_beta_resumed',
        'social_beta_revoked'
      )
    ),
  constraint social_closed_beta_enrollment_events_previous_status_chk
    check (
      previous_status is null
      or previous_status in ('approved', 'publishing_allowed', 'paused', 'revoked')
    ),
  constraint social_closed_beta_enrollment_events_next_status_chk
    check (next_status in ('approved', 'publishing_allowed', 'paused', 'revoked')),
  constraint social_closed_beta_enrollment_events_actor_source_chk
    check (actor_source in ('platform_operator', 'system')),
  constraint social_closed_beta_enrollment_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_closed_beta_enrollment_events_reason_len_chk
    check (reason is null or char_length(reason) <= 500),
  constraint social_closed_beta_enrollment_events_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_closed_beta_enrollment_events_enrollment_fk
    foreign key (organization_id, enrollment_id)
    references public.social_closed_beta_enrollments (organization_id, id)
    on delete cascade
);

create or replace function private.guard_social_closed_beta_enrollment_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social closed beta enrollment events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_closed_beta_enrollment_event_immutable() from public;
revoke all on function private.guard_social_closed_beta_enrollment_event_immutable() from anon;
revoke all on function private.guard_social_closed_beta_enrollment_event_immutable() from authenticated;
revoke all on function private.guard_social_closed_beta_enrollment_event_immutable() from service_role;

create trigger social_closed_beta_enrollment_events_guard_immutable
  before update or delete on public.social_closed_beta_enrollment_events
  for each row execute function private.guard_social_closed_beta_enrollment_event_immutable();

create index social_closed_beta_enrollment_events_org_created_idx
  on public.social_closed_beta_enrollment_events (organization_id, created_at desc);

alter table public.social_closed_beta_enrollment_events enable row level security;
revoke all on table public.social_closed_beta_enrollment_events from public;
revoke all on table public.social_closed_beta_enrollment_events from anon;
revoke all on table public.social_closed_beta_enrollment_events from authenticated;
revoke all on table public.social_closed_beta_enrollment_events from service_role;
grant select on table public.social_closed_beta_enrollment_events to authenticated;
create policy social_closed_beta_enrollment_events_select_owner_admin
  on public.social_closed_beta_enrollment_events
  for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_closed_beta_enrollment_events from authenticated;
revoke insert, update, delete on table public.social_closed_beta_enrollment_events from anon;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.assert_social_closed_beta_operator_context()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('zyntix.social_closed_beta_operator', true), '')
    is distinct from 'on'
  then
    raise exception 'social closed beta platform operator context required'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.assert_social_closed_beta_operator_context() from public;
revoke all on function private.assert_social_closed_beta_operator_context() from anon;
revoke all on function private.assert_social_closed_beta_operator_context() from authenticated;
revoke all on function private.assert_social_closed_beta_operator_context() from service_role;

create or replace function private.insert_social_closed_beta_enrollment_event(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_event_type text,
  p_previous_status text,
  p_next_status text,
  p_actor_source text,
  p_actor_user_id uuid,
  p_reason text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if jsonb_typeof(v_payload) is distinct from 'object' then
    raise exception 'invalid social closed beta enrollment event payload'
      using errcode = 'P0001';
  end if;
  if v_payload ?| array[
    'access_token','refresh_token','token','ciphertext','iv','auth_tag',
    'authorization_code','client_secret','raw_state','state','encryption_key'
  ] then
    raise exception 'social closed beta enrollment event payload contains forbidden secret keys'
      using errcode = 'P0001';
  end if;

  insert into public.social_closed_beta_enrollment_events (
    organization_id,
    enrollment_id,
    event_type,
    previous_status,
    next_status,
    actor_source,
    actor_user_id,
    reason,
    payload
  ) values (
    p_organization_id,
    p_enrollment_id,
    p_event_type,
    p_previous_status,
    p_next_status,
    p_actor_source,
    p_actor_user_id,
    p_reason,
    v_payload
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function private.insert_social_closed_beta_enrollment_event(
  uuid, uuid, text, text, text, text, uuid, text, jsonb
) from public;
revoke all on function private.insert_social_closed_beta_enrollment_event(
  uuid, uuid, text, text, text, text, uuid, text, jsonb
) from anon;
revoke all on function private.insert_social_closed_beta_enrollment_event(
  uuid, uuid, text, text, text, text, uuid, text, jsonb
) from authenticated;
revoke all on function private.insert_social_closed_beta_enrollment_event(
  uuid, uuid, text, text, text, text, uuid, text, jsonb
) from service_role;

-- Returns: ok | closed_beta_not_enrolled | closed_beta_paused | closed_beta_revoked
create or replace function private.social_closed_beta_prepare_result_code(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_organization_id is null then
    return 'invalid_input';
  end if;

  select e.status
  into v_status
  from public.social_closed_beta_enrollments as e
  where e.organization_id = p_organization_id;

  if v_status is null then
    return 'closed_beta_not_enrolled';
  end if;
  if v_status = 'paused' then
    return 'closed_beta_paused';
  end if;
  if v_status = 'revoked' then
    return 'closed_beta_revoked';
  end if;
  if v_status in ('approved', 'publishing_allowed') then
    return 'ok';
  end if;

  return 'closed_beta_not_enrolled';
end;
$$;

revoke all on function private.social_closed_beta_prepare_result_code(uuid) from public;
revoke all on function private.social_closed_beta_prepare_result_code(uuid) from anon;
revoke all on function private.social_closed_beta_prepare_result_code(uuid) from authenticated;
revoke all on function private.social_closed_beta_prepare_result_code(uuid) from service_role;

-- Returns: ok | closed_beta_not_enrolled | closed_beta_paused | closed_beta_revoked
--          | closed_beta_publish_not_allowed
create or replace function private.social_closed_beta_publish_result_code(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_organization_id is null then
    return 'invalid_input';
  end if;

  select e.status
  into v_status
  from public.social_closed_beta_enrollments as e
  where e.organization_id = p_organization_id;

  if v_status is null then
    return 'closed_beta_not_enrolled';
  end if;
  if v_status = 'paused' then
    return 'closed_beta_paused';
  end if;
  if v_status = 'revoked' then
    return 'closed_beta_revoked';
  end if;
  if v_status = 'approved' then
    return 'closed_beta_publish_not_allowed';
  end if;
  if v_status = 'publishing_allowed' then
    return 'ok';
  end if;

  return 'closed_beta_not_enrolled';
end;
$$;

revoke all on function private.social_closed_beta_publish_result_code(uuid) from public;
revoke all on function private.social_closed_beta_publish_result_code(uuid) from anon;
revoke all on function private.social_closed_beta_publish_result_code(uuid) from authenticated;
revoke all on function private.social_closed_beta_publish_result_code(uuid) from service_role;

-- ---------------------------------------------------------------------------
-- Platform operator mutation core (private)
-- ---------------------------------------------------------------------------

create or replace function private.transition_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_action text,
  p_reason text,
  p_actor_user_id uuid
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.social_closed_beta_enrollments;
  v_prev text;
  v_next text;
  v_event_type text;
  v_enrollment_id uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  perform private.assert_social_closed_beta_operator_context();

  if p_organization_id is null or p_action is null then
    return query select 'invalid_input'::text, null::uuid, null::text, null::text;
    return;
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
  ) then
    return query select 'not_found'::text, null::uuid, null::text, null::text;
    return;
  end if;

  select e.* into v_row
  from public.social_closed_beta_enrollments as e
  where e.organization_id = p_organization_id
  for update;

  v_prev := v_row.status;

  if p_action = 'enroll_approved' then
    if v_row.id is not null then
      return query select 'conflict'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    insert into public.social_closed_beta_enrollments (
      organization_id, status, approved_at, reason
    ) values (
      p_organization_id, 'approved', pg_catalog.now(), v_reason
    )
    returning id into v_enrollment_id;
    v_next := 'approved';
    v_event_type := 'social_beta_enrolled_approved';

  elsif p_action = 'allow_publishing' then
    if v_row.id is null then
      return query select 'closed_beta_not_enrolled'::text, null::uuid, null::text, null::text;
      return;
    end if;
    -- allow_publishing only from approved; resume handles paused -> prior status
    if v_row.status = 'publishing_allowed' then
      return query select 'conflict'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    if v_row.status is distinct from 'approved' then
      return query select 'invalid_transition'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    update public.social_closed_beta_enrollments as e
    set
      status = 'publishing_allowed',
      publishing_allowed_at = coalesce(e.publishing_allowed_at, pg_catalog.now()),
      paused_at = null,
      status_before_pause = null,
      reason = coalesce(v_reason, e.reason)
    where e.organization_id = p_organization_id
    returning e.id into v_enrollment_id;
    v_next := 'publishing_allowed';
    v_event_type := 'social_beta_publishing_allowed';

  elsif p_action = 'pause' then
    if v_row.id is null then
      return query select 'closed_beta_not_enrolled'::text, null::uuid, null::text, null::text;
      return;
    end if;
    if v_row.status not in ('approved', 'publishing_allowed') then
      return query select 'invalid_transition'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    update public.social_closed_beta_enrollments as e
    set
      status_before_pause = e.status,
      status = 'paused',
      paused_at = pg_catalog.now(),
      reason = coalesce(v_reason, e.reason)
    where e.organization_id = p_organization_id
    returning e.id into v_enrollment_id;
    v_next := 'paused';
    v_event_type := 'social_beta_paused';

  elsif p_action = 'resume' then
    if v_row.id is null then
      return query select 'closed_beta_not_enrolled'::text, null::uuid, null::text, null::text;
      return;
    end if;
    if v_row.status is distinct from 'paused'
       or v_row.status_before_pause is null
       or v_row.status_before_pause not in ('approved', 'publishing_allowed')
    then
      return query select 'invalid_transition'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    v_next := v_row.status_before_pause;
    update public.social_closed_beta_enrollments as e
    set
      status = v_next,
      paused_at = null,
      status_before_pause = null,
      reason = coalesce(v_reason, e.reason),
      publishing_allowed_at = case
        when v_next = 'publishing_allowed'
          then coalesce(e.publishing_allowed_at, pg_catalog.now())
        else e.publishing_allowed_at
      end
    where e.organization_id = p_organization_id
    returning e.id into v_enrollment_id;
    v_event_type := 'social_beta_resumed';

  elsif p_action = 'revoke' then
    if v_row.id is null then
      return query select 'closed_beta_not_enrolled'::text, null::uuid, null::text, null::text;
      return;
    end if;
    if v_row.status = 'revoked' then
      return query select 'conflict'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    if v_row.status not in ('approved', 'publishing_allowed', 'paused') then
      return query select 'invalid_transition'::text, v_row.id, v_prev, null::text;
      return;
    end if;
    update public.social_closed_beta_enrollments as e
    set
      status = 'revoked',
      revoked_at = pg_catalog.now(),
      paused_at = null,
      status_before_pause = null,
      reason = coalesce(v_reason, e.reason)
    where e.organization_id = p_organization_id
    returning e.id into v_enrollment_id;
    v_next := 'revoked';
    v_event_type := 'social_beta_revoked';

  else
    return query select 'invalid_input'::text, null::uuid, null::text, null::text;
    return;
  end if;

  perform private.insert_social_closed_beta_enrollment_event(
    p_organization_id,
    v_enrollment_id,
    v_event_type,
    v_prev,
    v_next,
    'platform_operator',
    p_actor_user_id,
    v_reason,
    jsonb_build_object(
      'action', p_action,
      'organization_id', p_organization_id,
      'enrollment_id', v_enrollment_id
    )
  );

  return query select 'success'::text, v_enrollment_id, v_prev, v_next;
end;
$$;

revoke all on function private.transition_social_closed_beta_enrollment(uuid, text, text, uuid) from public;
revoke all on function private.transition_social_closed_beta_enrollment(uuid, text, text, uuid) from anon;
revoke all on function private.transition_social_closed_beta_enrollment(uuid, text, text, uuid) from authenticated;
revoke all on function private.transition_social_closed_beta_enrollment(uuid, text, text, uuid) from service_role;

-- ---------------------------------------------------------------------------
-- Public operator RPCs -- NOT granted to authenticated (no self-promotion)
-- Narrow grant: service_role only + operator GUC required inside private core.
-- ---------------------------------------------------------------------------

create or replace function public.platform_enroll_social_closed_beta_organization(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'enroll_approved', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.platform_allow_social_closed_beta_publishing(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'allow_publishing', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.platform_pause_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'pause', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.platform_resume_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'resume', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.platform_revoke_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'revoke', p_reason, p_actor_user_id
  );
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select unnest(array[
      'platform_enroll_social_closed_beta_organization(uuid, text, uuid)',
      'platform_allow_social_closed_beta_publishing(uuid, text, uuid)',
      'platform_pause_social_closed_beta_enrollment(uuid, text, uuid)',
      'platform_resume_social_closed_beta_enrollment(uuid, text, uuid)',
      'platform_revoke_social_closed_beta_enrollment(uuid, text, uuid)'
    ]) as sig
  loop
    execute format('revoke all on function public.%s from public', r.sig);
    execute format('revoke all on function public.%s from anon', r.sig);
    execute format('revoke all on function public.%s from authenticated', r.sig);
    execute format('revoke all on function public.%s from service_role', r.sig);
    execute format('grant execute on function public.%s to service_role', r.sig);
  end loop;
end;
$$;

comment on function public.platform_enroll_social_closed_beta_organization(uuid, text, uuid) is
  'SMM-R1 platform operator only. Requires zyntix.social_closed_beta_operator=on. Not granted to authenticated.';

-- Customer-safe status read (Owner/Admin of that org)
create or replace function public.get_social_closed_beta_enrollment_status(
  p_organization_id uuid
)
returns table (
  result_code text,
  enrollment_status text,
  status_before_pause text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_status text;
  v_before text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;

  if p_organization_id is null then
    return query select 'invalid_input'::text, null::text, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null
     or not private.can_manage_social_connections(v_member_role)
  then
    return query select 'forbidden'::text, null::text, null::text;
    return;
  end if;

  select e.status, e.status_before_pause
  into v_status, v_before
  from public.social_closed_beta_enrollments as e
  where e.organization_id = p_organization_id;

  if v_status is null then
    return query select 'success'::text, 'not_enrolled'::text, null::text;
    return;
  end if;

  return query select 'success'::text, v_status, v_before;
end;
$$;

revoke all on function public.get_social_closed_beta_enrollment_status(uuid) from public;
revoke all on function public.get_social_closed_beta_enrollment_status(uuid) from anon;
revoke all on function public.get_social_closed_beta_enrollment_status(uuid) from authenticated;
revoke all on function public.get_social_closed_beta_enrollment_status(uuid) from service_role;
grant execute on function public.get_social_closed_beta_enrollment_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Authenticated assert RPCs (app prepare/execute gates; no provider write)
-- SQL CREATE OR REPLACE hardening of create_social_publication / b18_start is in
-- 20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql
-- ---------------------------------------------------------------------------

create or replace function public.assert_social_closed_beta_prepare_allowed(
  p_organization_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_code text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;
  if p_organization_id is null then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null
     or not private.can_manage_social_connections(v_member_role)
  then
    return query select 'forbidden'::text;
    return;
  end if;

  v_code := private.social_closed_beta_prepare_result_code(p_organization_id);
  return query select v_code;
end;
$$;

revoke all on function public.assert_social_closed_beta_prepare_allowed(uuid) from public;
revoke all on function public.assert_social_closed_beta_prepare_allowed(uuid) from anon;
revoke all on function public.assert_social_closed_beta_prepare_allowed(uuid) from authenticated;
revoke all on function public.assert_social_closed_beta_prepare_allowed(uuid) from service_role;
grant execute on function public.assert_social_closed_beta_prepare_allowed(uuid) to authenticated;

create or replace function public.assert_social_closed_beta_publish_allowed(
  p_organization_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_code text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;
  if p_organization_id is null then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null
     or not private.can_manage_social_connections(v_member_role)
  then
    return query select 'forbidden'::text;
    return;
  end if;

  v_code := private.social_closed_beta_publish_result_code(p_organization_id);
  return query select v_code;
end;
$$;

revoke all on function public.assert_social_closed_beta_publish_allowed(uuid) from public;
revoke all on function public.assert_social_closed_beta_publish_allowed(uuid) from anon;
revoke all on function public.assert_social_closed_beta_publish_allowed(uuid) from authenticated;
revoke all on function public.assert_social_closed_beta_publish_allowed(uuid) from service_role;
grant execute on function public.assert_social_closed_beta_publish_allowed(uuid) to authenticated;

comment on function public.assert_social_closed_beta_publish_allowed(uuid) is
  'SMM-R1-A: closed-beta publishing entitlement assert. Does not bypass SOCIAL_PUBLISHING_ENABLED.';
