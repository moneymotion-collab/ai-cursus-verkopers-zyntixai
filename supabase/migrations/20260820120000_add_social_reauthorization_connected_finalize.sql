-- SMM-B1.1-R A2-FIX — Explicit reauthorization finalization
-- Additive. Does not replace finalize_social_connection.
-- Ordinary connect finalization remains authorization_pending-only.
-- A healthy connected row may complete ONLY through a consumed
-- reauthorize intent bound to that same connection, identity, actor,
-- and a credential refresh that occurred after consume.

create or replace function public.finalize_social_reauthorization(
  p_intent_id uuid,
  p_external_account_id text,
  p_display_name text,
  p_professional_account_type text,
  p_capabilities jsonb
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
  v_intent private.social_oauth_authorization_intents;
  v_connection public.social_account_connections;
  v_now timestamptz := pg_catalog.now();
  v_capabilities jsonb := coalesce(p_capabilities, '[]'::jsonb);
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_intent_id is null
     or p_external_account_id is null
     or char_length(btrim(p_external_account_id)) = 0
     or char_length(p_external_account_id) > 128
     or p_external_account_id <> btrim(p_external_account_id)
     or position(' ' in p_external_account_id) > 0
     or not private.social_beta1_capabilities_are_valid(v_capabilities)
  then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  if p_professional_account_type is null
     or p_professional_account_type not in ('business', 'creator')
  then
    return query select 'unsupported_account'::text, null::uuid;
    return;
  end if;

  select i.*
  into v_intent
  from private.social_oauth_authorization_intents as i
  where i.id = p_intent_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if v_intent.initiating_actor_user_id <> v_actor_user_id then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  if v_intent.intent_kind <> 'reauthorize'
     or v_intent.status <> 'consumed'
     or v_intent.consumed_at is null
     or v_intent.provider <> 'instagram'
     or v_intent.consumed_at <= v_now - interval '30 minutes'
  then
    return query select 'conflict'::text, null::uuid;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = v_intent.connection_id
    and sac.organization_id = v_intent.organization_id
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

  if v_connection.provider <> 'instagram'
     or v_connection.status not in (
       'connected',
       'reauthorization_required',
       'permission_missing'
     )
  then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  if v_intent.expected_external_account_id is null
     or v_intent.expected_external_account_id <> p_external_account_id
     or v_connection.external_account_id is null
     or v_connection.external_account_id <> p_external_account_id
  then
    return query select 'identity_mismatch'::text, v_connection.id;
    return;
  end if;

  if v_connection.last_refreshed_at is null
     or v_connection.last_refreshed_at < v_intent.consumed_at
  then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  if exists (
    select 1
    from public.social_connection_events as ev
    where ev.organization_id = v_connection.organization_id
      and ev.connection_id = v_connection.id
      and ev.event_type = 'social_connection_reauthorized'
      and ev.created_at >= v_intent.consumed_at
  ) then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  if exists (
    select 1
    from public.social_account_connections as other
    where other.organization_id = v_connection.organization_id
      and other.provider = v_connection.provider
      and other.external_account_id = p_external_account_id
      and other.status <> 'disconnected'
      and other.id <> v_connection.id
  ) then
    return query select 'duplicate_connection'::text, v_connection.id;
    return;
  end if;

  update public.social_account_connections as sac
  set
    display_name = nullif(btrim(coalesce(p_display_name, '')), ''),
    professional_account_type = p_professional_account_type,
    status = 'connected',
    health = 'healthy',
    capability_snapshot = v_capabilities,
    capability_snapshot_at = v_now,
    connected_at = coalesce(sac.connected_at, v_now),
    reauthorization_required_at = null
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id
    and sac.external_account_id = p_external_account_id;

  if not found then
    return query select 'identity_mismatch'::text, v_connection.id;
    return;
  end if;

  perform private.insert_social_connection_event(
    v_connection.organization_id,
    v_connection.id,
    'social_connection_reauthorized',
    'member',
    v_membership_id,
    jsonb_build_object(
      'provider', v_connection.provider,
      'intent_kind', 'reauthorize'
    )
  );

  return query select 'success'::text, v_connection.id;
end;
$$;

comment on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) is
  'Completes Instagram reauthorization for reconnectable statuses. Requires a recently consumed reauthorize intent, matching expected identity, Owner/Admin actor, and credential refresh after consume. Does not accept ordinary connect intents or generic connected-row finalization. Never returns tokens.';

revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from public;
revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from anon;
revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from authenticated;
revoke all on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) from service_role;
grant execute on function public.finalize_social_reauthorization(uuid, text, text, text, jsonb) to authenticated;
