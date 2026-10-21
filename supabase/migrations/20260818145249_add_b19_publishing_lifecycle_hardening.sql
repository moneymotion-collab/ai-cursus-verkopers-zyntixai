-- SMM-B1.9 — Publishing lifecycle & operational hardening.
-- Additive Owner/Admin RPCs only. No provider HTTP. No hard deletes of audit rows.
-- Preserves existing Production evidence; does not auto-mutate historical leftovers.

-- ---------------------------------------------------------------------------
-- 0) Expand event-type allowlists (additive)
-- ---------------------------------------------------------------------------

alter table public.social_connection_events
  drop constraint social_connection_events_event_type_chk;

alter table public.social_connection_events
  add constraint social_connection_events_event_type_chk
  check (
    event_type in (
      'social_connection_initiated',
      'social_connection_established',
      'social_connection_reauthorization_required',
      'social_connection_reauthorized',
      'social_connection_permission_missing',
      'social_connection_revoked',
      'social_connection_disconnected',
      'social_connection_health_changed',
      'social_connection_abandoned_pending'
    )
  );

create or replace function private.insert_social_connection_event(
  p_organization_id uuid,
  p_connection_id uuid,
  p_event_type text,
  p_actor_source text,
  p_actor_member_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_event_type not in (
    'social_connection_initiated',
    'social_connection_established',
    'social_connection_reauthorization_required',
    'social_connection_reauthorized',
    'social_connection_permission_missing',
    'social_connection_revoked',
    'social_connection_disconnected',
    'social_connection_health_changed',
    'social_connection_abandoned_pending'
  ) then
    raise exception 'invalid social connection event type'
      using errcode = 'P0001';
  end if;

  if p_actor_source not in ('member', 'system') then
    raise exception 'invalid social connection event actor source'
      using errcode = 'P0001';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid social connection event payload'
      using errcode = 'P0001';
  end if;

  if p_payload ? 'token'
     or p_payload ? 'accessToken'
     or p_payload ? 'access_token'
     or p_payload ? 'refreshToken'
     or p_payload ? 'refresh_token'
     or p_payload ? 'authorizationCode'
     or p_payload ? 'clientSecret'
     or p_payload ? 'ciphertext'
     or p_payload ? 'iv'
     or p_payload ? 'authTag'
     or p_payload ? 'auth_tag'
     or p_payload ? 'rawOAuthState'
     or p_payload ? 'state_secret'
  then
    raise exception 'social connection event payload must not contain secrets'
      using errcode = 'P0001';
  end if;

  insert into public.social_connection_events (
    organization_id,
    connection_id,
    event_type,
    actor_source,
    actor_member_id,
    payload
  )
  values (
    p_organization_id,
    p_connection_id,
    p_event_type,
    p_actor_source,
    p_actor_member_id,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

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
      'social_publication_unknown_resolved_published'
    )
  );

-- ---------------------------------------------------------------------------
-- 1) Abandon authorization_pending connection shells (not connected accounts)
-- ---------------------------------------------------------------------------

create or replace function public.abandon_authorization_pending_social_connection(
  p_connection_id uuid
)
returns table (
  result_code text,
  connection_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_connection public.social_account_connections;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(
      v_connection.organization_id
    );
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  -- Hard guard: never abandon a connected/live credentialed account via this path.
  if v_connection.status is distinct from 'authorization_pending' then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  if not private.try_consume_social_connection_rate_limit(
    v_connection.organization_id,
    v_actor_user_id,
    'abandon_pending',
    '',
    30,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  -- Pending shells should not hold credentials; delete any orphan envelope defensively.
  delete from private.social_provider_credentials as cred
  where cred.organization_id = v_connection.organization_id
    and cred.connection_id = v_connection.id;

  update public.social_account_connections as sac
  set
    status = 'disconnected',
    credential_ref_id = null,
    last_refreshed_at = null
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id;

  perform private.insert_social_connection_event(
    v_connection.organization_id,
    v_connection.id,
    'social_connection_abandoned_pending',
    'member',
    v_membership_id,
    jsonb_build_object(
      'provider', v_connection.provider,
      'prior_status', 'authorization_pending',
      'source', 'b19_lifecycle'
    )
  );

  return query select 'abandoned'::text, v_connection.id;
end;
$$;

revoke all on function public.abandon_authorization_pending_social_connection(uuid) from public;
revoke all on function public.abandon_authorization_pending_social_connection(uuid) from anon;
revoke all on function public.abandon_authorization_pending_social_connection(uuid) from authenticated;
revoke all on function public.abandon_authorization_pending_social_connection(uuid) from service_role;
grant execute on function public.abandon_authorization_pending_social_connection(uuid) to authenticated;

comment on function public.abandon_authorization_pending_social_connection(uuid) is
  'B1.9 Owner/Admin: operationally abandon authorization_pending shells only. Row retained as disconnected. Never touches connected accounts.';

-- ---------------------------------------------------------------------------
-- 2) Abandon / expire stale OAuth intents (single-use model preserved)
-- ---------------------------------------------------------------------------

create or replace function public.abandon_stale_social_oauth_intent(
  p_organization_id uuid,
  p_intent_id uuid
)
returns table (
  result_code text,
  intent_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_intent private.social_oauth_authorization_intents;
  v_next_status text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_intent_id is null then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  select i.*
  into v_intent
  from private.social_oauth_authorization_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if v_intent.status in ('consumed', 'expired', 'abandoned') then
    return query select 'already_terminal'::text, v_intent.id;
    return;
  end if;

  if v_intent.status is distinct from 'pending' then
    return query select 'conflict'::text, v_intent.id;
    return;
  end if;

  if v_intent.expires_at <= pg_catalog.now() then
    v_next_status := 'expired';
  else
    v_next_status := 'abandoned';
  end if;

  update private.social_oauth_authorization_intents as i
  set status = v_next_status
  where i.id = v_intent.id
    and i.organization_id = p_organization_id;

  return query select v_next_status::text, v_intent.id;
end;
$$;

revoke all on function public.abandon_stale_social_oauth_intent(uuid, uuid) from public;
revoke all on function public.abandon_stale_social_oauth_intent(uuid, uuid) from anon;
revoke all on function public.abandon_stale_social_oauth_intent(uuid, uuid) from authenticated;
revoke all on function public.abandon_stale_social_oauth_intent(uuid, uuid) from service_role;
grant execute on function public.abandon_stale_social_oauth_intent(uuid, uuid) to authenticated;

comment on function public.abandon_stale_social_oauth_intent(uuid, uuid) is
  'B1.9 Owner/Admin: mark pending OAuth intents expired (past expires_at) or abandoned. Never reopens consumed intents.';

-- ---------------------------------------------------------------------------
-- 3) Abandon queued/pending publications (operational cancel with audit reason)
-- ---------------------------------------------------------------------------

create or replace function public.abandon_queued_social_publication(
  p_organization_id uuid,
  p_publication_id uuid
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
  v_pub public.social_publications;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text;
    return;
  end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;

  -- Only pre-execution leftovers. Never touch succeeded / ambiguous / in-flight.
  if v_pub.status not in ('pending', 'queued') then
    return query select 'conflict'::text; return;
  end if;

  update public.social_publications
  set
    status = 'cancelled',
    cancelled_at = pg_catalog.now(),
    claimed_by = null,
    claim_lease_expires_at = null,
    completed_at = coalesce(completed_at, pg_catalog.now())
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id, null,
    'social_publication_abandoned', 'member', v_membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'prior_status', v_pub.status,
      'source', 'b19_lifecycle'
    )
  );
  return query select 'abandoned'::text;
end;
$$;

revoke all on function public.abandon_queued_social_publication(uuid, uuid) from public;
revoke all on function public.abandon_queued_social_publication(uuid, uuid) from anon;
revoke all on function public.abandon_queued_social_publication(uuid, uuid) from authenticated;
revoke all on function public.abandon_queued_social_publication(uuid, uuid) from service_role;
grant execute on function public.abandon_queued_social_publication(uuid, uuid) to authenticated;

comment on function public.abandon_queued_social_publication(uuid, uuid) is
  'B1.9 Owner/Admin: operationally abandon pending/queued publications. Row retained as cancelled. No provider write.';

-- ---------------------------------------------------------------------------
-- 4) Reclaim stale execution leases (fail-closed for processing ambiguity)
-- ---------------------------------------------------------------------------

create or replace function public.reclaim_stale_social_publication_execution(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (result_code text, next_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_pub public.social_publications;
  v_attempt public.social_publication_attempts;
  v_attempt_id uuid := null;
  v_next text;
  v_outcome text;
  v_failure text;
  v_event text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::text;
    return;
  end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text, null::text; return; end if;

  if v_pub.claim_lease_expires_at is null or v_pub.claim_lease_expires_at >= pg_catalog.now() then
    return query select 'lease_active'::text, v_pub.status; return;
  end if;

  if v_pub.status = 'claimed' then
    -- Claimed but lease expired before/without confirmed provider write → safe retryable.
    v_next := 'failed_retryable';
    v_outcome := 'failed_retryable';
    v_failure := 'timeout';
    v_event := 'social_publication_stale_claim_reclaimed';
  elsif v_pub.status = 'processing' then
    -- Processing + expired lease: provider write may have occurred → fail closed.
    v_next := 'unknown_external_outcome';
    v_outcome := 'unknown_external_outcome';
    v_failure := 'unknown_external_outcome';
    v_event := 'social_publication_stale_processing_reclaimed';
  else
    return query select 'conflict'::text, v_pub.status; return;
  end if;

  select a.* into v_attempt
  from public.social_publication_attempts as a
  where a.organization_id = p_organization_id
    and a.publication_id = p_publication_id
    and a.outcome = 'processing'
  order by a.attempt_number desc
  limit 1
  for update;

  if found then
    v_attempt_id := v_attempt.id;
    update public.social_publication_attempts as a
    set
      outcome = v_outcome,
      failure_class = v_failure,
      retryable = (v_outcome = 'failed_retryable'),
      safe_error_code = 'stale_execution_lease',
      finished_at = pg_catalog.now()
    where a.id = v_attempt.id
      and a.organization_id = p_organization_id;
  end if;

  update public.social_publications
  set
    status = v_next,
    claimed_by = null,
    claim_lease_expires_at = null,
    last_failure_class = v_failure,
    completed_at = case
      when v_next = 'unknown_external_outcome' then coalesce(completed_at, pg_catalog.now())
      else completed_at
    end,
    next_attempt_at = case
      when v_next = 'failed_retryable'
        then pg_catalog.now() + private.compute_social_publication_backoff(greatest(v_pub.attempt_count, 1))
      else null
    end
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id,
    v_attempt_id,
    v_event, 'member', v_membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'prior_status', v_pub.status,
      'next_status', v_next,
      'source', 'b19_lifecycle',
      'provider_write_safe_to_retry', (v_next = 'failed_retryable')
    )
  );

  return query select 'reclaimed'::text, v_next;
end;
$$;

revoke all on function public.reclaim_stale_social_publication_execution(uuid, uuid) from public;
revoke all on function public.reclaim_stale_social_publication_execution(uuid, uuid) from anon;
revoke all on function public.reclaim_stale_social_publication_execution(uuid, uuid) from authenticated;
revoke all on function public.reclaim_stale_social_publication_execution(uuid, uuid) from service_role;
grant execute on function public.reclaim_stale_social_publication_execution(uuid, uuid) to authenticated;

comment on function public.reclaim_stale_social_publication_execution(uuid, uuid) is
  'B1.9 Owner/Admin: reclaim expired claimed→failed_retryable; expired processing→unknown_external_outcome (no auto provider retry).';

-- ---------------------------------------------------------------------------
-- 5) Resolve unknown_external_outcome without Meta writes
-- ---------------------------------------------------------------------------

create or replace function public.resolve_unknown_external_social_publication(
  p_organization_id uuid,
  p_publication_id uuid,
  p_resolution text
)
returns table (result_code text, next_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_pub public.social_publications;
  v_resolution text := btrim(coalesce(p_resolution, ''));
  v_next text;
  v_event text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::text;
    return;
  end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text, null::text; return; end if;

  if v_pub.status is distinct from 'unknown_external_outcome' then
    return query select 'conflict'::text, v_pub.status; return;
  end if;

  if v_resolution = 'confirm_not_published' then
    v_next := 'failed_terminal';
    v_event := 'social_publication_unknown_resolved_not_published';
  elsif v_resolution = 'retain_manual_intervention' then
    v_next := 'manual_intervention';
    v_event := 'social_publication_unknown_retained_manual';
  elsif v_resolution = 'confirm_published_existing_external_id' then
    if v_pub.external_publication_id is null or btrim(v_pub.external_publication_id) = '' then
      return query select 'external_id_required'::text, v_pub.status; return;
    end if;
    v_next := 'succeeded';
    v_event := 'social_publication_unknown_resolved_published';
  else
    return query select 'invalid_input'::text, null::text; return;
  end if;

  update public.social_publications
  set
    status = v_next,
    claimed_by = null,
    claim_lease_expires_at = null,
    completed_at = coalesce(completed_at, pg_catalog.now()),
    last_failure_class = case
      when v_next = 'succeeded' then null
      when v_next = 'failed_terminal' then coalesce(last_failure_class, 'unknown_external_outcome')
      else last_failure_class
    end
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id, null,
    v_event, 'member', v_membership_id,
    jsonb_build_object(
      'publication_id', p_publication_id,
      'resolution', v_resolution,
      'next_status', v_next,
      'has_external_publication_id', (v_pub.external_publication_id is not null),
      'source', 'b19_lifecycle'
    )
  );

  return query select 'resolved'::text, v_next;
end;
$$;

revoke all on function public.resolve_unknown_external_social_publication(uuid, uuid, text) from public;
revoke all on function public.resolve_unknown_external_social_publication(uuid, uuid, text) from anon;
revoke all on function public.resolve_unknown_external_social_publication(uuid, uuid, text) from authenticated;
revoke all on function public.resolve_unknown_external_social_publication(uuid, uuid, text) from service_role;
grant execute on function public.resolve_unknown_external_social_publication(uuid, uuid, text) to authenticated;

comment on function public.resolve_unknown_external_social_publication(uuid, uuid, text) is
  'B1.9 Owner/Admin: resolve unknown_external_outcome without Meta calls. Succeeded only when external_publication_id already present.';

-- ---------------------------------------------------------------------------
-- 6) Harden B1.8 start: refuse terminal / ambiguous / processing without reclaim
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

  perform set_config('zyntix.social_publication_worker', 'on', true);
  perform set_config('zyntix.social_publishing_enabled', 'true', true);

  if not private.social_publishing_execution_enabled() then
    return query select
      'feature_disabled'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
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

  -- Terminal / ambiguous protections (B1.9 hardening).
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

  -- Concurrent / duplicate in-flight attempt guard.
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
  'B1.8/B1.9 controlled Owner/Admin claim+start. Refuses terminal/ambiguous/processing. App must still check SOCIAL_PUBLISHING_ENABLED.';
