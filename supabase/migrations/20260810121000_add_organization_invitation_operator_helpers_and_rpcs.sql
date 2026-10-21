-- ZyntixAI Invitations / Member Administration:
-- operator CREATE / RESEND / REVOKE helpers + SECURITY DEFINER RPCs
-- OD-RPC-1 OPTION B: no accept RPC in this slice
-- OD-RPC-3 OPTION A: legacy membership status 'invited' → existing_membership_requires_admin_action

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.get_organization_invitation_actor_membership(
  p_organization_id uuid
)
returns table (
  membership_id uuid,
  member_role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select om.id, om.role
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
  limit 1;
$$;

revoke all on function private.get_organization_invitation_actor_membership(uuid) from public;
revoke all on function private.get_organization_invitation_actor_membership(uuid) from anon;
revoke all on function private.get_organization_invitation_actor_membership(uuid) from authenticated;

create or replace function private.assert_active_organization_for_invitation_mutation(
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from public;
revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from anon;
revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from authenticated;

create or replace function private.can_create_organization_invitation_target(
  p_actor_role text,
  p_target_role text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_target_role not in ('admin', 'staff', 'viewer') then false
    when p_actor_role = 'owner' and p_target_role in ('admin', 'staff', 'viewer') then true
    when p_actor_role = 'admin' and p_target_role in ('staff', 'viewer') then true
    else false
  end;
$$;

revoke all on function private.can_create_organization_invitation_target(text, text) from public;
revoke all on function private.can_create_organization_invitation_target(text, text) from anon;
revoke all on function private.can_create_organization_invitation_target(text, text) from authenticated;

create or replace function private.can_manage_organization_invitation_target(
  p_actor_role text,
  p_target_role text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_target_role not in ('admin', 'staff', 'viewer') then false
    when p_actor_role = 'owner' and p_target_role in ('admin', 'staff', 'viewer') then true
    when p_actor_role = 'admin' and p_target_role in ('staff', 'viewer') then true
    else false
  end;
$$;

revoke all on function private.can_manage_organization_invitation_target(text, text) from public;
revoke all on function private.can_manage_organization_invitation_target(text, text) from anon;
revoke all on function private.can_manage_organization_invitation_target(text, text) from authenticated;

-- Returns internal collision class only:
-- none | active | suspended | removed | invited
-- Never exposes global registration status to callers.
create or replace function private.resolve_organization_invitation_membership_collision(
  p_organization_id uuid,
  p_email_normalized text
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_membership_status text;
begin
  select u.id
  into v_user_id
  from auth.users as u
  where lower(btrim(u.email)) = p_email_normalized
  limit 1;

  if v_user_id is null then
    return 'none';
  end if;

  select om.status
  into v_membership_status
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
  limit 1;

  if v_membership_status is null then
    return 'none';
  end if;

  if v_membership_status in ('active', 'suspended', 'removed', 'invited') then
    return v_membership_status;
  end if;

  -- Fail closed on unexpected membership status values.
  return 'suspended';
end;
$$;

revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from public;
revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from anon;
revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from authenticated;

-- 256-bit CSPRNG → lowercase hex raw token (64 chars)
-- token_hash = lowercase hex SHA-256 over UTF-8 bytes of that exact raw token string
create or replace function private.generate_organization_invitation_token_pair()
returns table (
  raw_token text,
  token_hash text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_raw text;
  v_hash text;
begin
  v_raw := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(
    extensions.digest(convert_to(v_raw, 'UTF8'), 'sha256'),
    'hex'
  );

  raw_token := v_raw;
  token_hash := v_hash;
  return next;
end;
$$;

revoke all on function private.generate_organization_invitation_token_pair() from public;
revoke all on function private.generate_organization_invitation_token_pair() from anon;
revoke all on function private.generate_organization_invitation_token_pair() from authenticated;

create or replace function private.insert_organization_invitation_event(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_event_type text,
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
    'invitation_created',
    'invitation_resent',
    'invitation_revoked',
    'invitation_accepted'
  ) then
    raise exception 'invalid invitation event type'
      using errcode = 'P0001';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid invitation event payload'
      using errcode = 'P0001';
  end if;

  -- Reject accidental credential fields in payload.
  if p_payload ? 'token'
     or p_payload ? 'raw_token'
     or p_payload ? 'token_hash'
  then
    raise exception 'invitation event payload must not contain credentials'
      using errcode = 'P0001';
  end if;

  insert into public.organization_invitation_events (
    organization_id,
    invitation_id,
    event_type,
    actor_member_id,
    payload
  )
  values (
    p_organization_id,
    p_invitation_id,
    p_event_type,
    p_actor_member_id,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from public;
revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from anon;
revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from authenticated;

-- ---------------------------------------------------------------------------
-- Public operator RPCs
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
  if auth.uid() is null then
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

  -- Insert with specific unique-violation handling:
  -- pending org+email unique → invite_already_pending
  -- token_hash unique → bounded regenerate/retry
  -- any other unique → unexpected (never mislabel as pending)
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
          -- Extremely unlikely 256-bit collision: regenerate and retry.
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
grant execute on function public.create_organization_invitation(uuid, text, text) to authenticated;

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
  v_invitation public.organization_invitations;
  v_raw_token text;
  v_token_hash text;
  v_expires_at timestamptz;
  v_now timestamptz := pg_catalog.now();
  v_attempt int;
  v_constraint text;
  v_updated boolean := false;
begin
  if auth.uid() is null then
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

  -- Concurrent resend: FOR UPDATE serializes; last committed token wins.
  -- token_hash unique collisions regenerate boundedly; never map to pending.
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
grant execute on function public.resend_organization_invitation(uuid, uuid) to authenticated;

create or replace function public.revoke_organization_invitation(
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
  v_invitation public.organization_invitations;
  v_now timestamptz := pg_catalog.now();
begin
  if auth.uid() is null then
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

  -- Idempotent second revoke: no second transition / event.
  if v_invitation.status = 'revoked' then
    return query
      select 'invite_revoked'::text, v_invitation.id, null::timestamptz, null::text;
    return;
  end if;

  if v_invitation.status <> 'pending' then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::timestamptz,
        null::text;
    return;
  end if;

  -- Physical pending may be effective-expired; revoke still allowed (contract §19/§43).
  update public.organization_invitations as oi
  set
    status = 'revoked',
    revoked_at = v_now,
    token_hash = null,
    accepted_at = null,
    accepted_by_user_id = null
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

  perform private.insert_organization_invitation_event(
    p_organization_id,
    p_invitation_id,
    'invitation_revoked',
    v_membership_id,
    '{}'::jsonb
  );

  return query
    select
      'success'::text,
      p_invitation_id,
      null::timestamptz,
      null::text;
end;
$$;

revoke all on function public.revoke_organization_invitation(uuid, uuid) from public;
revoke all on function public.revoke_organization_invitation(uuid, uuid) from anon;
grant execute on function public.revoke_organization_invitation(uuid, uuid) to authenticated;

comment on function public.create_organization_invitation(uuid, text, text) is
  'Owner/Admin create pending organization invitation. Returns one-time raw token only on success. No accept path.';

comment on function public.resend_organization_invitation(uuid, uuid) is
  'Owner/Admin resend: rotates token_hash and refreshes 7-day expiry under row lock. Concurrent resends serialize; last committed token wins.';

comment on function public.revoke_organization_invitation(uuid, uuid) is
  'Owner/Admin revoke pending invitation (including effective-expired pending). Idempotent second revoke returns invite_revoked without a second event.';
