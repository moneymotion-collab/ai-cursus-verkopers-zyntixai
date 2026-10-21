-- ZyntixAI Invitations CB-R1:
-- Fail-closed invitation create/resend mutation abuse protection (rate limiting).
--
-- Enforcement layer: private counters consumed inside public SECURITY DEFINER
-- create/resend RPCs after authorization and before mutation.
-- Direct authenticated RPC callers cannot bypass this layer.
--
-- CB-R1 closed-beta defaults (documented; not previously owner-approved numerics):
--   create: 10 attempts per (organization_id, actor_user_id) per 1-hour window
--   resend:  3 attempts per (organization_id, actor_user_id, invitation_id) per 1-hour window
-- Revoke and acceptance are intentionally not rate-limited in this slice.

create table if not exists private.organization_invitation_mutation_rate_limits (
  organization_id uuid not null,
  actor_user_id uuid not null,
  action text not null,
  scope_key text not null default '',
  window_started_at timestamptz not null,
  attempt_count integer not null,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_invitation_mutation_rate_limits_pkey
    primary key (organization_id, actor_user_id, action, scope_key),
  constraint organization_invitation_mutation_rate_limits_action_chk
    check (action in ('create', 'resend')),
  constraint organization_invitation_mutation_rate_limits_count_chk
    check (attempt_count >= 0),
  constraint organization_invitation_mutation_rate_limits_scope_chk
    check (char_length(scope_key) <= 64)
);

comment on table private.organization_invitation_mutation_rate_limits is
  'CB-R1 invitation create/resend rate-limit windows. No emails, tokens, or secrets.';

create index if not exists organization_invitation_mutation_rate_limits_updated_idx
  on private.organization_invitation_mutation_rate_limits (updated_at);

revoke all on table private.organization_invitation_mutation_rate_limits from public;
revoke all on table private.organization_invitation_mutation_rate_limits from anon;
revoke all on table private.organization_invitation_mutation_rate_limits from authenticated;
revoke all on table private.organization_invitation_mutation_rate_limits from service_role;

-- Returns true when the attempt is allowed (and counted). False = rate limited.
-- Concurrency-safe via primary-key upsert + row lock.
create or replace function private.consume_organization_invitation_mutation_rate_limit(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_scope_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope text := coalesce(p_scope_key, '');
  v_now timestamptz := pg_catalog.now();
  v_window_started_at timestamptz;
  v_attempt_count integer;
begin
  if p_organization_id is null
     or p_actor_user_id is null
     or p_action is null
     or p_action not in ('create', 'resend')
     or p_max_attempts is null
     or p_max_attempts < 1
     or p_window_seconds is null
     or p_window_seconds < 1
     or char_length(v_scope) > 64
  then
    return false;
  end if;

  -- Bounded retention for this actor/org (no email/token material stored).
  delete from private.organization_invitation_mutation_rate_limits as rl
  where rl.organization_id = p_organization_id
    and rl.actor_user_id = p_actor_user_id
    and rl.updated_at < v_now - interval '7 days';

  loop
    insert into private.organization_invitation_mutation_rate_limits (
      organization_id,
      actor_user_id,
      action,
      scope_key,
      window_started_at,
      attempt_count,
      updated_at
    )
    values (
      p_organization_id,
      p_actor_user_id,
      p_action,
      v_scope,
      v_now,
      1,
      v_now
    )
    on conflict do nothing
    returning attempt_count into v_attempt_count;

    if found then
      return true;
    end if;

    select rl.window_started_at, rl.attempt_count
    into v_window_started_at, v_attempt_count
    from private.organization_invitation_mutation_rate_limits as rl
    where rl.organization_id = p_organization_id
      and rl.actor_user_id = p_actor_user_id
      and rl.action = p_action
      and rl.scope_key = v_scope
    for update;

    if not found then
      -- Concurrent delete/race: retry insert.
      continue;
    end if;

    if v_now >= v_window_started_at + make_interval(secs => p_window_seconds) then
      update private.organization_invitation_mutation_rate_limits as rl
      set
        window_started_at = v_now,
        attempt_count = 1,
        updated_at = v_now
      where rl.organization_id = p_organization_id
        and rl.actor_user_id = p_actor_user_id
        and rl.action = p_action
        and rl.scope_key = v_scope;
      return true;
    end if;

    if v_attempt_count >= p_max_attempts then
      raise log
        'zyntix.invitation_mutation_rate_limited action=% organization_id=% actor_user_id=% scope_key=%',
        p_action,
        p_organization_id,
        p_actor_user_id,
        v_scope;
      return false;
    end if;

    update private.organization_invitation_mutation_rate_limits as rl
    set
      attempt_count = rl.attempt_count + 1,
      updated_at = v_now
    where rl.organization_id = p_organization_id
      and rl.actor_user_id = p_actor_user_id
      and rl.action = p_action
      and rl.scope_key = v_scope;

    return true;
  end loop;
end;
$$;

comment on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) is
  'CB-R1 atomic invitation mutation rate-limit consume. Returns false when denied.';

revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from public;
revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from anon;
revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from authenticated;
revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from service_role;

-- ---------------------------------------------------------------------------
-- Recreate create RPC with rate_limited after authz, before business mutation
-- ---------------------------------------------------------------------------

create or replace function public.create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_target_role text
)
returns table (
  result_code text,
  invitation_id uuid,
  expires_at timestamptz,
  raw_token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_actor_user_id uuid := auth.uid();
  v_email_normalized text;
  v_target_role text;
  v_collision text;
  v_pending public.organization_invitations;
  v_raw_token text;
  v_token_hash text;
  v_invitation_id uuid;
  v_expires_at timestamptz;
  v_now timestamptz := pg_catalog.now();
  v_attempt int;
  v_constraint text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  v_email_normalized := lower(btrim(coalesce(p_email, '')));
  if char_length(v_email_normalized) = 0
     or char_length(v_email_normalized) > 254
  then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  v_target_role := nullif(btrim(coalesce(p_target_role, '')), '');
  if v_target_role is null
     or v_target_role not in ('admin', 'staff', 'viewer')
  then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_organization_invitation_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_invitation_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::timestamptz, null::text;
      return;
  end;

  if not private.can_create_organization_invitation_target(v_member_role, v_target_role) then
    return query select 'forbidden'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  -- CB-R1: after authorization, before collision/lifecycle mutation.
  -- Defaults: 10 create attempts / actor+org / 3600 seconds.
  if not private.consume_organization_invitation_mutation_rate_limit(
    p_organization_id,
    v_actor_user_id,
    'create',
    '',
    10,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  v_collision := private.resolve_organization_invitation_membership_collision(
    p_organization_id,
    v_email_normalized
  );

  if v_collision = 'active' then
    return query select 'already_member'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  -- OD-RPC-3 OPTION A: invited treated like suspended/removed.
  if v_collision in ('suspended', 'removed', 'invited') then
    return query
      select
        'existing_membership_requires_admin_action'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  select oi.*
  into v_pending
  from public.organization_invitations as oi
  where oi.organization_id = p_organization_id
    and oi.email_normalized = v_email_normalized
    and oi.status = 'pending'
  for update;

  if found then
    if v_pending.expires_at is not null and v_now < v_pending.expires_at then
      return query
        select
          'invite_already_pending'::text,
          v_pending.id,
          v_pending.expires_at,
          null::text;
      return;
    end if;

    -- Lazy expiry materialization (no dedicated expiry audit event).
    update public.organization_invitations as oi
    set
      status = 'expired',
      token_hash = null
    where oi.id = v_pending.id
      and oi.organization_id = p_organization_id
      and oi.status = 'pending';
  end if;

  v_expires_at := v_now + interval '7 days';

  for v_attempt in 1..3 loop
    select t.raw_token, t.token_hash
    into v_raw_token, v_token_hash
    from private.generate_organization_invitation_token_pair() as t;

    begin
      insert into public.organization_invitations (
        organization_id,
        email_normalized,
        role,
        status,
        invited_by_member_id,
        token_hash,
        expires_at
      )
      values (
        p_organization_id,
        v_email_normalized,
        v_target_role,
        'pending',
        v_membership_id,
        v_token_hash,
        v_expires_at
      )
      returning id into v_invitation_id;

      exit;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'organization_invitations_pending_org_email_uidx' then
          select oi.id, oi.expires_at
          into v_invitation_id, v_expires_at
          from public.organization_invitations as oi
          where oi.organization_id = p_organization_id
            and oi.email_normalized = v_email_normalized
            and oi.status = 'pending'
          limit 1;

          if found then
            return query
              select
                'invite_already_pending'::text,
                v_invitation_id,
                v_expires_at,
                null::text;
            return;
          end if;

          return query
            select
              'unexpected'::text,
              null::uuid,
              null::timestamptz,
              null::text;
          return;
        end if;

        if v_constraint = 'organization_invitations_token_hash_uidx' then
          continue;
        end if;

        return query
          select
            'unexpected'::text,
            null::uuid,
            null::timestamptz,
            null::text;
        return;
    end;
  end loop;

  if v_invitation_id is null then
    return query
      select
        'unexpected'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  perform private.insert_organization_invitation_event(
    p_organization_id,
    v_invitation_id,
    'invitation_created',
    v_membership_id,
    jsonb_build_object('target_role', v_target_role)
  );

  return query
    select
      'success'::text,
      v_invitation_id,
      v_expires_at,
      v_raw_token;
end;
$$;

revoke all on function public.create_organization_invitation(uuid, text, text) from public;
revoke all on function public.create_organization_invitation(uuid, text, text) from anon;
revoke all on function public.create_organization_invitation(uuid, text, text) from authenticated;
revoke all on function public.create_organization_invitation(uuid, text, text) from service_role;
grant execute on function public.create_organization_invitation(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Recreate resend RPC with rate_limited after pending authz, before token rotate
-- ---------------------------------------------------------------------------

create or replace function public.resend_organization_invitation(
  p_organization_id uuid,
  p_invitation_id uuid
)
returns table (
  result_code text,
  invitation_id uuid,
  expires_at timestamptz,
  raw_token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_actor_user_id uuid := auth.uid();
  v_invitation public.organization_invitations;
  v_raw_token text;
  v_token_hash text;
  v_expires_at timestamptz;
  v_now timestamptz := pg_catalog.now();
  v_attempt int;
  v_constraint text;
  v_updated boolean := false;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_invitation_id is null then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_organization_invitation_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_invitation_mutation(p_organization_id);
  exception
    when raise_exception then
      return query
        select
          'invite_not_found_or_unavailable'::text,
          null::uuid,
          null::timestamptz,
          null::text;
      return;
  end;

  select oi.*
  into v_invitation
  from public.organization_invitations as oi
  where oi.organization_id = p_organization_id
    and oi.id = p_invitation_id
  for update;

  if not found then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  if not private.can_manage_organization_invitation_target(
    v_member_role,
    v_invitation.role
  ) then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  if v_invitation.status = 'revoked' then
    return query
      select 'invite_revoked'::text, v_invitation.id, null::timestamptz, null::text;
    return;
  end if;

  if v_invitation.status = 'accepted' then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  if v_invitation.status = 'expired'
     or v_invitation.status <> 'pending'
     or v_invitation.expires_at is null
     or v_now >= v_invitation.expires_at
  then
    return query
      select 'invite_expired'::text, v_invitation.id, v_invitation.expires_at, null::text;
    return;
  end if;

  -- CB-R1: after pending/manage authorization, before token rotation.
  -- Defaults: 3 resend attempts / invitation+actor+org / 3600 seconds.
  if not private.consume_organization_invitation_mutation_rate_limit(
    p_organization_id,
    v_actor_user_id,
    'resend',
    p_invitation_id::text,
    3,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  v_expires_at := v_now + interval '7 days';

  for v_attempt in 1..3 loop
    select t.raw_token, t.token_hash
    into v_raw_token, v_token_hash
    from private.generate_organization_invitation_token_pair() as t;

    begin
      update public.organization_invitations as oi
      set
        token_hash = v_token_hash,
        expires_at = v_expires_at
      where oi.organization_id = p_organization_id
        and oi.id = p_invitation_id
        and oi.status = 'pending';

      if not found then
        return query
          select
            'invite_not_found_or_unavailable'::text,
            null::uuid,
            null::timestamptz,
            null::text;
        return;
      end if;

      v_updated := true;
      exit;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'organization_invitations_token_hash_uidx' then
          continue;
        end if;

        return query
          select
            'unexpected'::text,
            null::uuid,
            null::timestamptz,
            null::text;
        return;
    end;
  end loop;

  if not v_updated then
    return query
      select
        'unexpected'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  perform private.insert_organization_invitation_event(
    p_organization_id,
    p_invitation_id,
    'invitation_resent',
    v_membership_id,
    '{}'::jsonb
  );

  return query
    select
      'success'::text,
      p_invitation_id,
      v_expires_at,
      v_raw_token;
end;
$$;

revoke all on function public.resend_organization_invitation(uuid, uuid) from public;
revoke all on function public.resend_organization_invitation(uuid, uuid) from anon;
revoke all on function public.resend_organization_invitation(uuid, uuid) from authenticated;
revoke all on function public.resend_organization_invitation(uuid, uuid) from service_role;
grant execute on function public.resend_organization_invitation(uuid, uuid) to authenticated;
