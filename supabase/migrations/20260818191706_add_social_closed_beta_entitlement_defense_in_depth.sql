-- SMM-R1-A-R1: SQL entitlement defense-in-depth for prepare/execute
-- Depends on 20260818190346_add_social_closed_beta_enrollment_foundation.sql
-- Additive CREATE OR REPLACE only. No enrollments. No historical row mutation. No Meta.

-- ---------------------------------------------------------------------------
-- Composed gate helper for tests/ops: GUC first, then enrollment.
-- Does not arm GUC. Used to prove GLOBAL OFF > entitlement.
-- ---------------------------------------------------------------------------

create or replace function private.social_provider_write_gate_result_code(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.social_publishing_execution_enabled() then
    return 'feature_disabled';
  end if;
  return private.social_closed_beta_publish_result_code(p_organization_id);
end;
$$;

revoke all on function private.social_provider_write_gate_result_code(uuid) from public;
revoke all on function private.social_provider_write_gate_result_code(uuid) from anon;
revoke all on function private.social_provider_write_gate_result_code(uuid) from authenticated;
revoke all on function private.social_provider_write_gate_result_code(uuid) from service_role;

-- Authenticated probe for Owner/Admin (read-only gate evaluation; no arming, no Meta)
create or replace function public.evaluate_social_provider_write_gates(
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

  return query select private.social_provider_write_gate_result_code(p_organization_id);
end;
$$;

revoke all on function public.evaluate_social_provider_write_gates(uuid) from public;
revoke all on function public.evaluate_social_provider_write_gates(uuid) from anon;
revoke all on function public.evaluate_social_provider_write_gates(uuid) from authenticated;
revoke all on function public.evaluate_social_provider_write_gates(uuid) from service_role;
grant execute on function public.evaluate_social_provider_write_gates(uuid) to authenticated;

-- Harden create_social_publication with prepare entitlement

create or replace function public.create_social_publication(
  p_organization_id uuid,
  p_variant_version_id uuid,
  p_connection_id uuid,
  p_execution_mode text,
  p_schedule_slot_id uuid default null,
  p_intended_execute_at timestamptz default null,
  p_idempotency_key text default null
)
returns table (result_code text, publication_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_connection public.social_account_connections;
  v_slot public.social_content_schedule_slots;
  v_ctx record;
  v_ready record;
  v_mode text := btrim(coalesce(p_execution_mode, ''));
  v_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_execute_at timestamptz;
  v_required_cap text;
  v_id uuid;
  v_existing uuid;
  v_beta text;
begin
  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_version.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  v_beta := private.social_closed_beta_prepare_result_code(p_organization_id);
  if v_beta <> 'ok' then
    return query select v_beta, null::uuid;
    return;
  end if;

  if v_mode not in ('scheduled', 'immediate') then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if v_key is null then
    v_key := 'pub_' || replace(gen_random_uuid()::text, '-', '');
  end if;
  if char_length(v_key) < 8 or char_length(v_key) > 128 then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  select p.id into v_existing
  from public.social_publications as p
  where p.organization_id = p_organization_id and p.idempotency_key = v_key;
  if found then
    return query select 'success'::text, v_existing;
    return;
  end if;

  select c.* into v_connection from public.social_account_connections as c
  where c.organization_id = p_organization_id and c.id = p_connection_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  -- Workspace + provider consistency
  if v_connection.workspace_id is distinct from v_version.workspace_id then
    return query select 'workspace_mismatch'::text, null::uuid; return;
  end if;
  if v_connection.provider is distinct from v_version.planned_provider then
    return query select 'provider_mismatch'::text, null::uuid; return;
  end if;
  if v_version.planned_provider <> 'instagram' or v_connection.provider <> 'instagram' then
    return query select 'provider_unsupported'::text, null::uuid; return;
  end if;

  if p_schedule_slot_id is not null then
    select s.* into v_slot from public.social_content_schedule_slots as s
    where s.organization_id = p_organization_id and s.id = p_schedule_slot_id;
    if not found then return query select 'not_found'::text, null::uuid; return; end if;
    if v_slot.status <> 'active' then return query select 'conflict'::text, null::uuid; return; end if;
    if v_slot.variant_version_id is distinct from p_variant_version_id then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    if v_slot.workspace_id is distinct from v_version.workspace_id then
      return query select 'workspace_mismatch'::text, null::uuid; return;
    end if;
    if v_mode <> 'scheduled' then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    v_execute_at := coalesce(p_intended_execute_at, v_slot.planned_at);
  else
    if v_mode <> 'immediate' then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    v_execute_at := coalesce(p_intended_execute_at, pg_catalog.now());
  end if;

  select * into v_ready
  from public.evaluate_social_variant_version_workflow_readiness(p_organization_id, p_variant_version_id);
  if v_ready.result_code <> 'success' or v_ready.workflow_ready is not true then
    return query select 'workflow_not_ready'::text, null::uuid; return;
  end if;

  if v_connection.status <> 'connected'
     or v_connection.health = 'provider_unavailable'
     or v_connection.reauthorization_required_at is not null
  then
    return query select 'connection_ineligible'::text, null::uuid; return;
  end if;

  if v_connection.credential_ref_id is null then
    return query select 'credential_unavailable'::text, null::uuid; return;
  end if;

  v_required_cap := private.capability_required_for_social_content_format(v_version.content_format);
  if v_required_cap is null then
    return query select 'capability_missing'::text, null::uuid; return;
  end if;
  if not exists (
    select 1
    from jsonb_array_elements_text(coalesce(v_connection.capability_snapshot, '[]'::jsonb)) as cap(value)
    where cap.value = v_required_cap
  ) then
    return query select 'capability_missing'::text, null::uuid; return;
  end if;

  insert into public.social_publications (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    connection_id, provider, schedule_slot_id, execution_mode, status, idempotency_key,
    intended_execute_at, queued_at, next_attempt_at, created_by_member_id
  ) values (
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, p_connection_id, v_connection.provider,
    p_schedule_slot_id, v_mode, 'queued', v_key, v_execute_at, pg_catalog.now(),
    v_execute_at, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_id, null,
    'social_publication_created', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', v_id, 'execution_mode', v_mode)
  );
  perform private.insert_social_publication_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_id, null,
    'social_publication_queued', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', v_id)
  );

  return query select 'success'::text, v_id;
exception
  when unique_violation then
    select p.id into v_existing
    from public.social_publications as p
    where p.organization_id = p_organization_id and p.idempotency_key = v_key;
    if found then
      return query select 'success'::text, v_existing;
    else
      return query select 'conflict'::text, null::uuid;
    end if;
end;
$$;

revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from public;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from anon;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from authenticated;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from service_role;
grant execute on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) to authenticated;


-- Harden b18_start: entitlement before GUC arm / claim

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

  -- R1-A-R1: enrollment must be publishing_allowed before claim/start or GUC arming.
  v_beta := private.social_closed_beta_publish_result_code(p_organization_id);
  if v_beta <> 'ok' then
    return query select
      v_beta, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- Preserve B1.8/B1.9 in-transaction arming for private.start_* (transaction-local).
  -- App SOCIAL_PUBLISHING_ENABLED remains the operational global kill switch before RPC.
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
  'B1.8/B1.9/R1-A-R1 claim+start. Requires closed-beta publishing_allowed before in-transaction publishing GUC arm. App must still check SOCIAL_PUBLISHING_ENABLED.';

revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from public;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from anon;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from authenticated;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from service_role;
grant execute on function public.b18_start_controlled_publication_attempt(uuid, uuid) to authenticated;
