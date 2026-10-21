-- SMM-B1.11-A — Publication scheduling domain (schedule / reschedule / cancel).
-- Execution source of truth remains public.social_publications
-- (execution_mode, intended_execute_at, next_attempt_at).
-- No social_schedules table. No worker/cron. No provider write.
-- Owner/Admin only. Staff/Viewer denied. Past/now instants fail closed.
-- 15-minute missed-grace is documented for B1.11-D and is NOT enforced here.

-- ---------------------------------------------------------------------------
-- 0) Event types
-- ---------------------------------------------------------------------------

alter table public.social_publication_events
  drop constraint social_publication_events_event_type_chk;

alter table public.social_publication_events
  add constraint social_publication_events_event_type_chk
  check (
    event_type in (
      'social_publication_created',
      'social_publication_queued',
      'social_publication_claimed',
      'social_publication_attempt_started',
      'social_publication_attempt_failed',
      'social_publication_attempt_succeeded',
      'social_publication_cancelled',
      'social_publication_manual_intervention',
      'social_publication_unknown_external_outcome',
      'social_publication_retry_requested',
      'social_publication_abandoned',
      'social_publication_stale_claim_reclaimed',
      'social_publication_stale_processing_reclaimed',
      'social_publication_unknown_resolved_not_published',
      'social_publication_unknown_retained_manual',
      'social_publication_unknown_resolved_published',
      'social_publication_scheduled',
      'social_publication_rescheduled'
    )
  );

-- ---------------------------------------------------------------------------
-- 1) Shared Owner/Admin actor gate (same as B1.9 connection mutations)
-- ---------------------------------------------------------------------------

create or replace function private.assert_social_publication_schedule_actor(
  p_organization_id uuid
)
returns table (
  result_code text,
  membership_id uuid,
  member_role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null then
    return query select 'invalid_input'::text, null::uuid, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::text;
    return;
  end if;

  return query select 'ok'::text, v_membership_id, v_member_role;
end;
$$;

revoke all on function private.assert_social_publication_schedule_actor(uuid) from public;
revoke all on function private.assert_social_publication_schedule_actor(uuid) from anon;
revoke all on function private.assert_social_publication_schedule_actor(uuid) from authenticated;
revoke all on function private.assert_social_publication_schedule_actor(uuid) from service_role;

comment on function private.assert_social_publication_schedule_actor(uuid) is
  'B1.11-A: Owner/Admin + active org membership required for publication execution-clock mutations. Staff/Viewer denied.';

-- Eligible pre-claim statuses for schedule/reschedule/cancel-scheduled:
-- pending | queued | failed_retryable.
-- Denied: 'claimed' | 'processing' | 'succeeded' | 'cancelled'
-- | 'failed_terminal' | 'manual_intervention' | 'unknown_external_outcome'.

-- ---------------------------------------------------------------------------
-- 2) schedule_social_publication
-- ---------------------------------------------------------------------------

create or replace function public.schedule_social_publication(
  p_organization_id uuid,
  p_publication_id uuid,
  p_intended_execute_at timestamptz
)
returns table (
  result_code text,
  publication_id uuid,
  intended_execute_at timestamptz,
  next_attempt_at timestamptz,
  execution_mode text,
  variant_version_id uuid,
  connection_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_pub public.social_publications;
  v_ready boolean;
  v_conn_status text;
  v_conn_health text;
  v_ws_archived timestamptz;
begin
  select * into v_actor
  from private.assert_social_publication_schedule_actor(p_organization_id);
  if v_actor.result_code <> 'ok' then
    return query select v_actor.result_code, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_publication_id is null or p_intended_execute_at is null then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_intended_execute_at <= pg_catalog.now() then
    return query select 'invalid_time'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if v_pub.status not in ('pending', 'queued', 'failed_retryable') then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  if exists (
    select 1
    from public.social_publication_attempts as a
    where a.organization_id = p_organization_id
      and a.publication_id = p_publication_id
      and a.outcome = 'processing'
  ) then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  if v_pub.execution_mode = 'scheduled'
     and v_pub.intended_execute_at is not distinct from p_intended_execute_at
     and v_pub.next_attempt_at is not distinct from p_intended_execute_at
  then
    return query select
      'already_scheduled'::text,
      v_pub.id,
      v_pub.intended_execute_at,
      v_pub.next_attempt_at,
      v_pub.execution_mode,
      v_pub.variant_version_id,
      v_pub.connection_id;
    return;
  end if;

  if v_pub.execution_mode = 'scheduled' then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  select w.archived_at into v_ws_archived
  from public.social_workspaces as w
  where w.organization_id = p_organization_id
    and w.id = v_pub.workspace_id;
  if not found or v_ws_archived is not null then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  select c.status, c.health into v_conn_status, v_conn_health
  from public.social_account_connections as c
  where c.organization_id = p_organization_id
    and c.id = v_pub.connection_id;
  if not found
     or v_conn_status is distinct from 'connected'
     or v_conn_health = 'provider_unavailable'
  then
    return query select 'connection_ineligible'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  select ev.workflow_ready into v_ready
  from public.evaluate_social_variant_version_workflow_readiness(
    p_organization_id,
    v_pub.variant_version_id
  ) as ev
  limit 1;
  if v_ready is not true then
    return query select 'workflow_not_ready'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  update public.social_publications as p
  set
    execution_mode = 'scheduled',
    intended_execute_at = p_intended_execute_at,
    next_attempt_at = p_intended_execute_at,
    updated_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
    and p.status in ('pending', 'queued', 'failed_retryable')
    and p.execution_mode is distinct from 'scheduled'
  returning p.* into v_pub;

  if not found then
    return query select 'conflict'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  perform private.insert_social_publication_event(
    p_organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    p_publication_id,
    null,
    'social_publication_scheduled',
    'member',
    v_actor.membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'intended_execute_at', p_intended_execute_at,
      'next_attempt_at', p_intended_execute_at,
      'execution_mode', 'scheduled',
      'variant_version_id', v_pub.variant_version_id,
      'connection_id', v_pub.connection_id
    )
  );

  return query select
    'success'::text,
    v_pub.id,
    v_pub.intended_execute_at,
    v_pub.next_attempt_at,
    v_pub.execution_mode,
    v_pub.variant_version_id,
    v_pub.connection_id;
end;
$$;

revoke all on function public.schedule_social_publication(uuid, uuid, timestamptz) from public;
revoke all on function public.schedule_social_publication(uuid, uuid, timestamptz) from anon;
revoke all on function public.schedule_social_publication(uuid, uuid, timestamptz) from authenticated;
revoke all on function public.schedule_social_publication(uuid, uuid, timestamptz) from service_role;
grant execute on function public.schedule_social_publication(uuid, uuid, timestamptz) to authenticated;

comment on function public.schedule_social_publication(uuid, uuid, timestamptz) is
  'B1.11-A Owner/Admin: bind an eligible publication to a future UTC intended_execute_at. Aligns next_attempt_at. Does not mutate version/connection. Does not execute.';

-- ---------------------------------------------------------------------------
-- 3) reschedule_social_publication
-- ---------------------------------------------------------------------------

create or replace function public.reschedule_social_publication(
  p_organization_id uuid,
  p_publication_id uuid,
  p_intended_execute_at timestamptz
)
returns table (
  result_code text,
  publication_id uuid,
  intended_execute_at timestamptz,
  next_attempt_at timestamptz,
  execution_mode text,
  variant_version_id uuid,
  connection_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_pub public.social_publications;
  v_previous_intended timestamptz;
  v_ready boolean;
  v_conn_status text;
  v_conn_health text;
  v_ws_archived timestamptz;
begin
  select * into v_actor
  from private.assert_social_publication_schedule_actor(p_organization_id);
  if v_actor.result_code <> 'ok' then
    return query select v_actor.result_code, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_publication_id is null or p_intended_execute_at is null then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_intended_execute_at <= pg_catalog.now() then
    return query select 'invalid_time'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if v_pub.execution_mode is distinct from 'scheduled' then
    return query select 'not_scheduled'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  if v_pub.status not in ('pending', 'queued', 'failed_retryable') then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  if exists (
    select 1
    from public.social_publication_attempts as a
    where a.organization_id = p_organization_id
      and a.publication_id = p_publication_id
      and a.outcome = 'processing'
  ) then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  if v_pub.intended_execute_at is not distinct from p_intended_execute_at
     and v_pub.next_attempt_at is not distinct from p_intended_execute_at
  then
    return query select
      'already_scheduled'::text,
      v_pub.id,
      v_pub.intended_execute_at,
      v_pub.next_attempt_at,
      v_pub.execution_mode,
      v_pub.variant_version_id,
      v_pub.connection_id;
    return;
  end if;

  select w.archived_at into v_ws_archived
  from public.social_workspaces as w
  where w.organization_id = p_organization_id
    and w.id = v_pub.workspace_id;
  if not found or v_ws_archived is not null then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  select c.status, c.health into v_conn_status, v_conn_health
  from public.social_account_connections as c
  where c.organization_id = p_organization_id
    and c.id = v_pub.connection_id;
  if not found
     or v_conn_status is distinct from 'connected'
     or v_conn_health = 'provider_unavailable'
  then
    return query select 'connection_ineligible'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  select ev.workflow_ready into v_ready
  from public.evaluate_social_variant_version_workflow_readiness(
    p_organization_id,
    v_pub.variant_version_id
  ) as ev
  limit 1;
  if v_ready is not true then
    return query select 'workflow_not_ready'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  v_previous_intended := v_pub.intended_execute_at;

  update public.social_publications as p
  set
    execution_mode = 'scheduled',
    intended_execute_at = p_intended_execute_at,
    next_attempt_at = p_intended_execute_at,
    updated_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
    and p.execution_mode = 'scheduled'
    and p.status in ('pending', 'queued', 'failed_retryable')
  returning p.* into v_pub;

  if not found then
    return query select 'conflict'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  perform private.insert_social_publication_event(
    p_organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    p_publication_id,
    null,
    'social_publication_rescheduled',
    'member',
    v_actor.membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'previous_intended_execute_at', v_previous_intended,
      'intended_execute_at', p_intended_execute_at,
      'next_attempt_at', p_intended_execute_at,
      'execution_mode', 'scheduled',
      'variant_version_id', v_pub.variant_version_id,
      'connection_id', v_pub.connection_id
    )
  );

  return query select
    'success'::text,
    v_pub.id,
    v_pub.intended_execute_at,
    v_pub.next_attempt_at,
    v_pub.execution_mode,
    v_pub.variant_version_id,
    v_pub.connection_id;
end;
$$;

revoke all on function public.reschedule_social_publication(uuid, uuid, timestamptz) from public;
revoke all on function public.reschedule_social_publication(uuid, uuid, timestamptz) from anon;
revoke all on function public.reschedule_social_publication(uuid, uuid, timestamptz) from authenticated;
revoke all on function public.reschedule_social_publication(uuid, uuid, timestamptz) from service_role;
grant execute on function public.reschedule_social_publication(uuid, uuid, timestamptz) to authenticated;

comment on function public.reschedule_social_publication(uuid, uuid, timestamptz) is
  'B1.11-A Owner/Admin: replace intended_execute_at and next_attempt_at on the same scheduled publication UUID. Claimed/processing fail closed.';

-- ---------------------------------------------------------------------------
-- 4) cancel_scheduled_social_publication
--     Owner/Admin only. Reuses cancelled lifecycle. Does not replace
--     cancel_social_publication for immediate Staff-eligible rows.
-- ---------------------------------------------------------------------------

create or replace function public.cancel_scheduled_social_publication(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_pub public.social_publications;
begin
  select * into v_actor
  from private.assert_social_publication_schedule_actor(p_organization_id);
  if v_actor.result_code <> 'ok' then
    return query select v_actor.result_code, null::uuid, null::text;
    return;
  end if;

  if p_publication_id is null then
    return query select 'invalid_input'::text, null::uuid, null::text;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if v_pub.execution_mode is distinct from 'scheduled' then
    return query select 'not_scheduled'::text, v_pub.id, v_pub.status;
    return;
  end if;

  if v_pub.status = 'cancelled' then
    return query select 'conflict'::text, v_pub.id, v_pub.status;
    return;
  end if;

  if v_pub.status not in ('pending', 'queued', 'failed_retryable') then
    return query select 'conflict'::text, v_pub.id, v_pub.status;
    return;
  end if;

  update public.social_publications as p
  set
    status = 'cancelled',
    cancelled_at = pg_catalog.now(),
    claimed_by = null,
    claim_lease_expires_at = null,
    completed_at = coalesce(completed_at, pg_catalog.now()),
    updated_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
    and p.execution_mode = 'scheduled'
    and p.status in ('pending', 'queued', 'failed_retryable')
  returning p.* into v_pub;

  if not found then
    return query select 'conflict'::text, null::uuid, null::text;
    return;
  end if;

  perform private.insert_social_publication_event(
    p_organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    p_publication_id,
    null,
    'social_publication_cancelled',
    'member',
    v_actor.membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'source', 'b111a_scheduled_cancel',
      'execution_mode', 'scheduled',
      'intended_execute_at', v_pub.intended_execute_at
    )
  );

  return query select 'success'::text, v_pub.id, v_pub.status;
end;
$$;

revoke all on function public.cancel_scheduled_social_publication(uuid, uuid) from public;
revoke all on function public.cancel_scheduled_social_publication(uuid, uuid) from anon;
revoke all on function public.cancel_scheduled_social_publication(uuid, uuid) from authenticated;
revoke all on function public.cancel_scheduled_social_publication(uuid, uuid) from service_role;
grant execute on function public.cancel_scheduled_social_publication(uuid, uuid) to authenticated;

comment on function public.cancel_scheduled_social_publication(uuid, uuid) is
  'B1.11-A Owner/Admin: cancel a scheduled publication before claim. Claimed/processing fail closed. Second cancel returns conflict.';
