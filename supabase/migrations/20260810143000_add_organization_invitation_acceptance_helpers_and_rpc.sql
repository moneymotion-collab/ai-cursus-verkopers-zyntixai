-- ZyntixAI Invitations / Member Administration:
-- Acceptance & Membership Activation helpers + SECURITY DEFINER RPC
-- OD-ACC-1 OPTION B: legacy membership status 'invited' → admin_action (no activate)
-- OD-ACC-3 OPTION A: suspended/removed → admin_action (credential remains pending)
-- OD-ACC-4 OPTION B: effective-expired pending → materialize expired + clear token

-- ---------------------------------------------------------------------------
-- Private helpers (Acceptance-specific; do not modify operator helpers)
-- ---------------------------------------------------------------------------

-- Exact operator hash formula reused bit-for-bit:
-- encode(extensions.digest(convert_to(raw, 'UTF8'), 'sha256'), 'hex')
create or replace function private.hash_organization_invitation_raw_token(
  p_raw_token text
)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select encode(
    extensions.digest(convert_to(p_raw_token, 'UTF8'), 'sha256'),
    'hex'
  );
$$;

revoke all on function private.hash_organization_invitation_raw_token(text) from public;
revoke all on function private.hash_organization_invitation_raw_token(text) from anon;
revoke all on function private.hash_organization_invitation_raw_token(text) from authenticated;

-- Authoritative identity for Acceptance: auth.users by auth.uid() only.
-- Never trusts JWT email claim or client-supplied email/user id.
create or replace function private.get_organization_invitation_accept_identity()
returns table (
  user_id uuid,
  email_normalized text,
  email_confirmed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed_at timestamptz;
begin
  if v_uid is null then
    return;
  end if;

  select u.email, u.email_confirmed_at
  into v_email, v_confirmed_at
  from auth.users as u
  where u.id = v_uid
  limit 1;

  if not found then
    return;
  end if;

  user_id := v_uid;
  email_normalized := lower(btrim(coalesce(v_email, '')));
  email_confirmed := (v_confirmed_at is not null);
  return next;
end;
$$;

revoke all on function private.get_organization_invitation_accept_identity() from public;
revoke all on function private.get_organization_invitation_accept_identity() from anon;
revoke all on function private.get_organization_invitation_accept_identity() from authenticated;

-- ---------------------------------------------------------------------------
-- Public Acceptance RPC
-- ---------------------------------------------------------------------------

create or replace function public.accept_organization_invitation(
  p_raw_token text
)
returns table (
  result_code text,
  invitation_id uuid,
  organization_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_email_normalized text;
  v_email_confirmed boolean;
  v_raw text;
  v_computed_hash text;
  v_invitation public.organization_invitations;
  v_now timestamptz := pg_catalog.now();
  v_membership_id uuid;
  v_membership_status text;
  v_constraint text;
  v_created_membership boolean := false;
  v_had_active_membership boolean := false;
begin
  -- 1) Authenticated caller required (no anonymous membership mutation).
  if auth.uid() is null then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 2) Authoritative auth.users email + confirmation.
  select
    ident.user_id,
    ident.email_normalized,
    ident.email_confirmed
  into
    v_user_id,
    v_email_normalized,
    v_email_confirmed
  from private.get_organization_invitation_accept_identity() as ident;

  if v_user_id is null
     or v_email_normalized is null
     or char_length(v_email_normalized) = 0
  then
    return query
      select
        'forbidden'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  if not coalesce(v_email_confirmed, false) then
    return query
      select
        'forbidden'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- Profile FK required for accepted_by_user_id / organization_members.user_id.
  if not exists (
    select 1
    from public.profiles as p
    where p.id = v_user_id
  ) then
    return query
      select
        'unexpected'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 3) Raw-token shape: 64 lowercase hex (256-bit) before digest.
  v_raw := coalesce(p_raw_token, '');
  if v_raw !~ '^[0-9a-f]{64}$' then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 4) Exact operator SHA-256 hex of UTF-8 raw token string.
  v_computed_hash := private.hash_organization_invitation_raw_token(v_raw);

  -- 5) Lookup by token_hash + row lock.
  select oi.*
  into v_invitation
  from public.organization_invitations as oi
  where oi.token_hash = v_computed_hash
  for update;

  if not found then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 6) CRITICAL post-lock token revalidation (accept vs resend).
  if v_invitation.token_hash is distinct from v_computed_hash then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 7) Re-check state under lock.
  if v_invitation.status is distinct from 'pending' then
    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  if v_invitation.expires_at is null or v_now >= v_invitation.expires_at then
    -- OD-ACC-4 OPTION B: materialize expired + clear token; no expiry event.
    update public.organization_invitations as oi
    set
      status = 'expired',
      token_hash = null
    where oi.organization_id = v_invitation.organization_id
      and oi.id = v_invitation.id
      and oi.status = 'pending';

    return query
      select
        'invite_not_found_or_unavailable'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  if v_invitation.role is null
     or v_invitation.role not in ('admin', 'staff', 'viewer')
  then
    return query
      select
        'unexpected'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 8) Organization must be active (reuse published assert helper).
  begin
    perform private.assert_active_organization_for_invitation_mutation(
      v_invitation.organization_id
    );
  exception
    when raise_exception then
      return query
        select
          'invite_not_found_or_unavailable'::text,
          null::uuid,
          null::uuid,
          null::uuid;
      return;
  end;

  -- 9) Exact normalized email match (after token proof under lock).
  if v_email_normalized is distinct from v_invitation.email_normalized then
    return query
      select
        'email_mismatch'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 10) Target-org membership by auth.uid() (lock when present).
  select om.id, om.status
  into v_membership_id, v_membership_status
  from public.organization_members as om
  where om.organization_id = v_invitation.organization_id
    and om.user_id = v_user_id
  for update;

  if found then
    if v_membership_status = 'active' then
      -- Idempotent fulfillment: terminalize invitation; use existing membership.
      -- Do NOT update existing active membership role/status from Invitation.
      v_had_active_membership := true;
    elsif v_membership_status = 'invited' then
      -- OD-ACC-1 OPTION B: do not activate; leave invitation pending.
      return query
        select
          'existing_membership_requires_admin_action'::text,
          null::uuid,
          null::uuid,
          null::uuid;
      return;
    elsif v_membership_status in ('suspended', 'removed') then
      -- OD-ACC-3 OPTION A: deny; leave invitation pending / token unchanged.
      return query
        select
          'existing_membership_requires_admin_action'::text,
          null::uuid,
          null::uuid,
          null::uuid;
      return;
    else
      return query
        select
          'unexpected'::text,
          null::uuid,
          null::uuid,
          null::uuid;
      return;
    end if;
  else
    -- No membership: insert active row; role solely from invitation.
    begin
      insert into public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        joined_at
      )
      values (
        v_invitation.organization_id,
        v_user_id,
        v_invitation.role,
        'active',
        v_now
      )
      returning id into v_membership_id;

      v_membership_status := 'active';
      v_created_membership := true;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint is distinct from 'organization_members_org_user_unique' then
          return query
            select
              'unexpected'::text,
              null::uuid,
              null::uuid,
              null::uuid;
          return;
        end if;

        -- Concurrent membership create: re-read and apply same collision matrix.
        select om.id, om.status
        into v_membership_id, v_membership_status
        from public.organization_members as om
        where om.organization_id = v_invitation.organization_id
          and om.user_id = v_user_id
        for update;

        if not found then
          return query
            select
              'unexpected'::text,
              null::uuid,
              null::uuid,
              null::uuid;
          return;
        end if;

        if v_membership_status = 'invited' then
          return query
            select
              'existing_membership_requires_admin_action'::text,
              null::uuid,
              null::uuid,
              null::uuid;
          return;
        elsif v_membership_status in ('suspended', 'removed') then
          return query
            select
              'existing_membership_requires_admin_action'::text,
              null::uuid,
              null::uuid,
              null::uuid;
          return;
        elsif v_membership_status is distinct from 'active' then
          return query
            select
              'unexpected'::text,
              null::uuid,
              null::uuid,
              null::uuid;
          return;
        end if;

        -- Concurrent insert lost to an active membership → idempotent path.
        v_had_active_membership := true;
        v_created_membership := false;
    end;
  end if;

  if v_membership_id is null or v_membership_status is distinct from 'active' then
    return query
      select
        'unexpected'::text,
        null::uuid,
        null::uuid,
        null::uuid;
    return;
  end if;

  -- 11–13) Terminalize invitation + clear token + accepted event (atomic).
  -- Post-lock hash already validated; still require pending + matching hash.
  update public.organization_invitations as oi
  set
    status = 'accepted',
    accepted_at = v_now,
    accepted_by_user_id = v_user_id,
    token_hash = null
  where oi.organization_id = v_invitation.organization_id
    and oi.id = v_invitation.id
    and oi.status = 'pending'
    and oi.token_hash = v_computed_hash;

  -- Atomicity: never return success/unavailable after a membership write while
  -- leaving the invitation credential live. Raise to roll back the whole
  -- transaction (including any membership insert in this call).
  if not found then
    raise exception 'invitation accept terminalization race'
      using errcode = 'P0001';
  end if;

  -- Actor = resulting invitee membership id (locked engineering decision).
  perform private.insert_organization_invitation_event(
    v_invitation.organization_id,
    v_invitation.id,
    'invitation_accepted',
    v_membership_id,
    '{}'::jsonb
  );

  return query
    select
      case
        when v_created_membership then 'success'::text
        when v_had_active_membership then 'already_member'::text
        else 'success'::text
      end,
      v_invitation.id,
      v_invitation.organization_id,
      v_membership_id;
end;
$$;

comment on function public.accept_organization_invitation(text) is
  'Authenticated Acceptance: binds raw invitation token to auth.uid()+verified auth.users email; creates/uses active membership; terminalizes invitation; clears token; emits invitation_accepted. OD-ACC-1B/3A/4B locked.';

revoke all on function public.accept_organization_invitation(text) from public;
revoke all on function public.accept_organization_invitation(text) from anon;
grant execute on function public.accept_organization_invitation(text) to authenticated;
