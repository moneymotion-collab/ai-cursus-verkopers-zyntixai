-- SMM-R1-E-R2-P2 — Authorized publication binding & one-shot Execute lock
-- Additive. Operator-authorized controlled publish windows.
-- When an active window exists for an org, Execute may only target that publication.
-- Consumption occurs at b18_start claim/start boundary (one-shot regardless of outcome).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.social_controlled_publish_windows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  publication_id uuid not null references public.social_publications (id) on delete restrict,
  status text not null
    check (status in ('active', 'consumed', 'closed')),
  max_execute_count integer not null default 1
    check (max_execute_count >= 1 and max_execute_count <= 5),
  consumed_execute_count integer not null default 0
    check (consumed_execute_count >= 0),
  authorized_at timestamptz not null default pg_catalog.now(),
  consumed_at timestamptz null,
  closed_at timestamptz null,
  reason text null,
  created_by_actor_user_id uuid null,
  closed_by_actor_user_id uuid null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint social_controlled_publish_windows_consume_bounds_chk
    check (consumed_execute_count <= max_execute_count),
  constraint social_controlled_publish_windows_consumed_shape_chk
    check (
      (status = 'consumed' and consumed_at is not null and consumed_execute_count >= 1)
      or (status <> 'consumed')
    ),
  constraint social_controlled_publish_windows_closed_shape_chk
    check (
      (status = 'closed' and closed_at is not null)
      or (status <> 'closed')
    )
);

create unique index if not exists social_controlled_publish_windows_one_active_org_uidx
  on public.social_controlled_publish_windows (organization_id)
  where status = 'active';

create index if not exists social_controlled_publish_windows_org_status_idx
  on public.social_controlled_publish_windows (organization_id, status, authorized_at desc);

create index if not exists social_controlled_publish_windows_publication_idx
  on public.social_controlled_publish_windows (publication_id);

create table if not exists public.social_controlled_publish_window_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  window_id uuid not null references public.social_controlled_publish_windows (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'window_authorized',
      'execute_consumed',
      'window_closed',
      'execute_denied_mismatch'
    )),
  publication_id uuid null,
  requested_publication_id uuid null,
  actor_source text not null
    check (actor_source in ('platform_operator', 'system', 'member')),
  actor_user_id uuid null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists social_controlled_publish_window_events_window_idx
  on public.social_controlled_publish_window_events (window_id, created_at);

create index if not exists social_controlled_publish_window_events_org_idx
  on public.social_controlled_publish_window_events (organization_id, created_at desc);

alter table public.social_controlled_publish_windows enable row level security;
alter table public.social_controlled_publish_window_events enable row level security;

-- Members: read-only for own org (Owner/Admin need UI visibility). No writes.
create policy social_controlled_publish_windows_select_member
  on public.social_controlled_publish_windows
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = social_controlled_publish_windows.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

create policy social_controlled_publish_window_events_select_member
  on public.social_controlled_publish_window_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = social_controlled_publish_window_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );

revoke all on table public.social_controlled_publish_windows from public;
revoke all on table public.social_controlled_publish_windows from anon;
revoke all on table public.social_controlled_publish_windows from authenticated;
grant select on table public.social_controlled_publish_windows to authenticated;
grant all on table public.social_controlled_publish_windows to service_role;

revoke all on table public.social_controlled_publish_window_events from public;
revoke all on table public.social_controlled_publish_window_events from anon;
revoke all on table public.social_controlled_publish_window_events from authenticated;
grant select on table public.social_controlled_publish_window_events to authenticated;
grant all on table public.social_controlled_publish_window_events to service_role;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.insert_social_controlled_publish_window_event(
  p_organization_id uuid,
  p_window_id uuid,
  p_event_type text,
  p_publication_id uuid,
  p_requested_publication_id uuid,
  p_actor_source text,
  p_actor_user_id uuid,
  p_details jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.social_controlled_publish_window_events (
    organization_id, window_id, event_type, publication_id, requested_publication_id,
    actor_source, actor_user_id, details
  ) values (
    p_organization_id, p_window_id, p_event_type, p_publication_id, p_requested_publication_id,
    p_actor_source, p_actor_user_id, coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.insert_social_controlled_publish_window_event(uuid, uuid, text, uuid, uuid, text, uuid, jsonb) from public;
revoke all on function private.insert_social_controlled_publish_window_event(uuid, uuid, text, uuid, uuid, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_controlled_publish_window_event(uuid, uuid, text, uuid, uuid, text, uuid, jsonb) from authenticated;

-- Returns ok | publication_not_authorized_for_window | controlled_window_exhausted | controlled_window_inactive
-- When an active window exists: requires exact publication match and consumes one slot.
-- When no active window: returns ok (existing closed-beta + global gate still apply).
create or replace function private.assert_and_consume_controlled_publish_window(
  p_organization_id uuid,
  p_publication_id uuid,
  p_actor_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window public.social_controlled_publish_windows;
begin
  select w.* into v_window
  from public.social_controlled_publish_windows as w
  where w.organization_id = p_organization_id
    and w.status = 'active'
  for update;

  if not found then
    return 'ok';
  end if;

  if v_window.publication_id is distinct from p_publication_id then
    perform private.insert_social_controlled_publish_window_event(
      p_organization_id,
      v_window.id,
      'execute_denied_mismatch',
      v_window.publication_id,
      p_publication_id,
      'member',
      p_actor_user_id,
      jsonb_build_object(
        'authorized_publication_id', v_window.publication_id,
        'requested_publication_id', p_publication_id
      )
    );
    return 'publication_not_authorized_for_window';
  end if;

  if v_window.consumed_execute_count >= v_window.max_execute_count then
    return 'controlled_window_exhausted';
  end if;

  update public.social_controlled_publish_windows as w
  set
    consumed_execute_count = w.consumed_execute_count + 1,
    status = case
      when w.consumed_execute_count + 1 >= w.max_execute_count then 'consumed'
      else w.status
    end,
    consumed_at = case
      when w.consumed_execute_count + 1 >= w.max_execute_count then pg_catalog.now()
      else w.consumed_at
    end,
    updated_at = pg_catalog.now()
  where w.id = v_window.id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id,
    v_window.id,
    'execute_consumed',
    p_publication_id,
    p_publication_id,
    'member',
    p_actor_user_id,
    jsonb_build_object(
      'max_execute_count', v_window.max_execute_count,
      'consumed_execute_count', v_window.consumed_execute_count + 1
    )
  );

  return 'ok';
end;
$$;

revoke all on function private.assert_and_consume_controlled_publish_window(uuid, uuid, uuid) from public;
revoke all on function private.assert_and_consume_controlled_publish_window(uuid, uuid, uuid) from anon;
revoke all on function private.assert_and_consume_controlled_publish_window(uuid, uuid, uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- Operator RPCs (service_role + operator GUC)
-- ---------------------------------------------------------------------------

create or replace function public.operator_open_social_controlled_publish_window(
  p_organization_id uuid,
  p_publication_id uuid,
  p_max_execute_count integer default 1,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  window_id uuid,
  publication_id uuid,
  max_execute_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_id uuid;
  v_max integer := coalesce(p_max_execute_count, 1);
begin
  -- Service-role / operator path: arm GUC in-transaction (PostgREST-safe).
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;
  if v_max < 1 or v_max > 5 then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  if exists (
    select 1 from public.social_controlled_publish_windows w
    where w.organization_id = p_organization_id and w.status = 'active'
  ) then
    return query select 'conflict'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications p
  where p.organization_id = p_organization_id and p.id = p_publication_id;
  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;
  if v_pub.status not in ('pending', 'queued', 'failed_retryable') then
    return query select 'conflict'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  insert into public.social_controlled_publish_windows (
    organization_id, publication_id, status, max_execute_count, reason, created_by_actor_user_id
  ) values (
    p_organization_id, p_publication_id, 'active', v_max, nullif(btrim(coalesce(p_reason, '')), ''), p_actor_user_id
  ) returning id into v_id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id, v_id, 'window_authorized', p_publication_id, null,
    'platform_operator', p_actor_user_id,
    jsonb_build_object('max_execute_count', v_max)
  );

  return query select 'success'::text, v_id, p_publication_id, v_max;
end;
$$;

create or replace function public.operator_close_social_controlled_publish_window(
  p_organization_id uuid,
  p_window_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (result_code text, window_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window public.social_controlled_publish_windows;
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);

  select w.* into v_window
  from public.social_controlled_publish_windows w
  where w.organization_id = p_organization_id and w.id = p_window_id
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;
  if v_window.status <> 'active' then
    return query select 'conflict'::text, p_window_id;
    return;
  end if;

  update public.social_controlled_publish_windows
  set status = 'closed',
      closed_at = pg_catalog.now(),
      closed_by_actor_user_id = p_actor_user_id,
      reason = coalesce(nullif(btrim(coalesce(p_reason, '')), ''), reason),
      updated_at = pg_catalog.now()
  where id = p_window_id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id, p_window_id, 'window_closed', v_window.publication_id, null,
    'platform_operator', p_actor_user_id, '{}'::jsonb
  );

  return query select 'success'::text, p_window_id;
end;
$$;

-- Authenticated wrappers that arm operator GUC (same pattern as R1-B).
create or replace function public.operator_open_social_controlled_publish_window_for_session(
  p_organization_id uuid,
  p_publication_id uuid,
  p_max_execute_count integer default 1,
  p_reason text default null
)
returns table (
  result_code text,
  window_id uuid,
  publication_id uuid,
  max_execute_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from public.operator_open_social_controlled_publish_window(
    p_organization_id, p_publication_id, p_max_execute_count, p_reason, auth.uid()
  );
end;
$$;

create or replace function public.operator_close_social_controlled_publish_window_for_session(
  p_organization_id uuid,
  p_window_id uuid,
  p_reason text default null
)
returns table (result_code text, window_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from public.operator_close_social_controlled_publish_window(
    p_organization_id, p_window_id, p_reason, auth.uid()
  );
end;
$$;

-- Member-readable active window (Owner/Admin membership enforced).
create or replace function public.get_active_social_controlled_publish_window(
  p_organization_id uuid
)
returns table (
  result_code text,
  window_id uuid,
  publication_id uuid,
  status text,
  max_execute_count integer,
  consumed_execute_count integer,
  authorized_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_window public.social_controlled_publish_windows;
begin
  if v_actor_user_id is null then
    return query select 'forbidden'::text, null::uuid, null::uuid, null::text, null::integer, null::integer, null::timestamptz;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::uuid, null::text, null::integer, null::integer, null::timestamptz;
    return;
  end if;

  select w.* into v_window
  from public.social_controlled_publish_windows w
  where w.organization_id = p_organization_id and w.status = 'active'
  order by w.authorized_at desc
  limit 1;

  if not found then
    return query select 'success'::text, null::uuid, null::uuid, null::text, null::integer, null::integer, null::timestamptz;
    return;
  end if;

  return query select
    'success'::text,
    v_window.id,
    v_window.publication_id,
    v_window.status,
    v_window.max_execute_count,
    v_window.consumed_execute_count,
    v_window.authorized_at;
end;
$$;

revoke all on function public.operator_open_social_controlled_publish_window(uuid, uuid, integer, text, uuid) from public;
revoke all on function public.operator_open_social_controlled_publish_window(uuid, uuid, integer, text, uuid) from anon;
revoke all on function public.operator_open_social_controlled_publish_window(uuid, uuid, integer, text, uuid) from authenticated;
grant execute on function public.operator_open_social_controlled_publish_window(uuid, uuid, integer, text, uuid) to service_role;

revoke all on function public.operator_close_social_controlled_publish_window(uuid, uuid, text, uuid) from public;
revoke all on function public.operator_close_social_controlled_publish_window(uuid, uuid, text, uuid) from anon;
revoke all on function public.operator_close_social_controlled_publish_window(uuid, uuid, text, uuid) from authenticated;
grant execute on function public.operator_close_social_controlled_publish_window(uuid, uuid, text, uuid) to service_role;

revoke all on function public.operator_open_social_controlled_publish_window_for_session(uuid, uuid, integer, text) from public;
revoke all on function public.operator_open_social_controlled_publish_window_for_session(uuid, uuid, integer, text) from anon;
revoke all on function public.operator_open_social_controlled_publish_window_for_session(uuid, uuid, integer, text) from authenticated;
-- Not granted to authenticated — only platform operator path via service_role session client.
grant execute on function public.operator_open_social_controlled_publish_window_for_session(uuid, uuid, integer, text) to service_role;

revoke all on function public.operator_close_social_controlled_publish_window_for_session(uuid, uuid, text) from public;
revoke all on function public.operator_close_social_controlled_publish_window_for_session(uuid, uuid, text) from anon;
revoke all on function public.operator_close_social_controlled_publish_window_for_session(uuid, uuid, text) from authenticated;
grant execute on function public.operator_close_social_controlled_publish_window_for_session(uuid, uuid, text) to service_role;

revoke all on function public.get_active_social_controlled_publish_window(uuid) from public;
revoke all on function public.get_active_social_controlled_publish_window(uuid) from anon;
grant execute on function public.get_active_social_controlled_publish_window(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Harden b18_start: bind/consume controlled window before claim/provider arm
-- ---------------------------------------------------------------------------

create or replace function public.b18_start_controlled_publication_attempt(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  attempt_id uuid,
  attempt_number integer,
  claim_generation integer,
  worker_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_pub public.social_publications;
  v_worker text;
  v_lease integer := 120;
  v_claim_gen integer;
  v_start_code text;
  v_attempt_id uuid;
  v_attempt_number integer;
  v_claimable boolean := false;
  v_beta text;
  v_window_code text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_publication_id is null then
    return query select
      'invalid_input'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select
      'forbidden'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select
        'forbidden'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select
      'forbidden'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_beta := private.social_closed_beta_publish_result_code(p_organization_id);
  if v_beta <> 'ok' then
    return query select
      v_beta, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- Global kill-switch arming before window consumption so OFF does not burn quota.
  perform set_config('zyntix.social_publication_worker', 'on', true);
  perform set_config('zyntix.social_publishing_enabled', 'true', true);

  if not private.social_publishing_execution_enabled() then
    return query select
      'feature_disabled'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- R1-E-R2-P2: active window → exact publication match + one-shot consume
  -- before claim (serialized FOR UPDATE). Mismatch creates zero attempt.
  v_window_code := private.assert_and_consume_controlled_publish_window(
    p_organization_id, p_publication_id, v_actor_user_id
  );
  if v_window_code <> 'ok' then
    return query select
      v_window_code, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;

  if not found then
    return query select
      'not_found'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.status in (
    'succeeded',
    'cancelled',
    'unknown_external_outcome',
    'manual_intervention',
    'failed_terminal',
    'processing'
  ) then
    return query select
      'conflict'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.status in ('pending', 'queued', 'failed_retryable') then
    v_claimable := true;
  elsif v_pub.status = 'claimed'
     and v_pub.claim_lease_expires_at is not null
     and v_pub.claim_lease_expires_at < pg_catalog.now()
  then
    v_claimable := true;
  end if;

  if not v_claimable then
    return query select
      'conflict'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if coalesce(v_pub.next_attempt_at, v_pub.intended_execute_at) > pg_catalog.now() then
    return query select
      'none_due'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if exists (
    select 1 from public.social_publication_attempts as a
    where a.organization_id = p_organization_id
      and a.publication_id = p_publication_id
      and a.outcome = 'processing'
  ) then
    return query select
      'conflict'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_worker := 'b18_' || left(replace(gen_random_uuid()::text, '-', ''), 16);

  update public.social_publications as p
  set
    status = 'claimed',
    claimed_at = pg_catalog.now(),
    claim_lease_expires_at = pg_catalog.now() + make_interval(secs => v_lease),
    claimed_by = v_worker,
    claim_generation = p.claim_generation + 1
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  returning p.claim_generation into v_claim_gen;

  perform private.insert_social_publication_event(
    p_organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    p_publication_id,
    null,
    'social_publication_claimed',
    'system',
    null,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'worker_id', v_worker,
      'claim_generation', v_claim_gen,
      'source', 'b18_controlled'
    )
  );

  select s.result_code, s.attempt_id, s.attempt_number
  into v_start_code, v_attempt_id, v_attempt_number
  from private.start_social_publication_attempt(
    p_organization_id,
    p_publication_id,
    v_worker,
    v_claim_gen
  ) as s;

  if v_start_code is distinct from 'success' then
    return query select
      coalesce(v_start_code, 'unexpected')::text,
      p_publication_id,
      null::uuid,
      null::integer,
      v_claim_gen,
      v_worker;
    return;
  end if;

  return query select
    'success'::text,
    p_publication_id,
    v_attempt_id,
    v_attempt_number,
    v_claim_gen,
    v_worker;
end;
$$;

comment on function public.b18_start_controlled_publication_attempt(uuid, uuid) is
  'B1.8/B1.9/R1-A-R1/R1-E-R2-P2 claim+start. Requires publishing_allowed; when an active controlled window exists, requires exact publication match and consumes one-shot quota before claim.';

revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from public;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from anon;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from authenticated;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from service_role;
grant execute on function public.b18_start_controlled_publication_attempt(uuid, uuid) to authenticated;
