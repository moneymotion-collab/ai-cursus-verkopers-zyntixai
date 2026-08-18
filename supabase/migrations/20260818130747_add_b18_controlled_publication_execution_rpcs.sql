-- SMM-B1.8 — Controlled Owner/Admin wrappers for single-publication claim/start/complete.
-- App must still check SOCIAL_PUBLISHING_ENABLED before calling start.
-- No live provider HTTP in SQL. No service_role EXECUTE grants.

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

revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from public;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from anon;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from authenticated;
revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from service_role;
grant execute on function public.b18_start_controlled_publication_attempt(uuid, uuid) to authenticated;

comment on function public.b18_start_controlled_publication_attempt(uuid, uuid) is
  'B1.8 controlled Owner/Admin claim+start wrapper. App must still check SOCIAL_PUBLISHING_ENABLED before calling.';

create or replace function public.b18_complete_controlled_publication_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_worker_id text,
  p_claim_generation integer,
  p_outcome text,
  p_failure_class text default null,
  p_safe_error_code text default null,
  p_external_publication_id text default null
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
  v_complete_code text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null
     or p_attempt_id is null
     or p_claim_generation is null
     or nullif(btrim(coalesce(p_worker_id, '')), '') is null
  then
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

  perform set_config('zyntix.social_publication_worker', 'on', true);

  select c.result_code
  into v_complete_code
  from private.complete_social_publication_attempt(
    p_organization_id,
    p_attempt_id,
    p_worker_id,
    p_claim_generation,
    p_outcome,
    p_failure_class,
    p_safe_error_code,
    p_external_publication_id
  ) as c;

  return query select coalesce(v_complete_code, 'unexpected')::text;
end;
$$;

revoke all on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from public;
revoke all on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from anon;
revoke all on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from authenticated;
revoke all on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from service_role;
grant execute on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) to authenticated;

comment on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) is
  'B1.8 controlled Owner/Admin completion wrapper over private.complete_social_publication_attempt.';
