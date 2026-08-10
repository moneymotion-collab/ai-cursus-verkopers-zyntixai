-- Invitations Acceptance RPC live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs only. No production data. No secrets.
--
-- HARD GUARDS:
-- 1) Run only against the local Docker Supabase DB (127.0.0.1).
-- 2) Never run against a linked/production project.
-- 3) Entire script is wrapped in BEGIN/ROLLBACK (no durable writes).
-- 4) Requires explicit per-transaction opt-in:
--      select set_config('zyntix.allow_invitation_acceptance_live_verify', 'on', true);

begin;

select set_config('zyntix.allow_invitation_acceptance_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc801';
  v_org_b uuid := 'dddddddd-dddd-4ddd-8ddd-ddddddddd801';
  v_user_owner uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc901';
  v_user_invitee uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc902';
  v_user_wrong uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc903';
  v_user_unverified uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc904';
  v_user_legacy uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc905';
  v_user_suspended uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc906';
  v_user_removed uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc907';
  v_user_active uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccc908';
  v_member_owner uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccca01';
  v_member_legacy uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccca02';
  v_member_suspended uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccca03';
  v_member_removed uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccca04';
  v_member_active uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccca05';
  v_result_code text;
  v_invitation_id uuid;
  v_organization_id uuid;
  v_membership_id uuid;
  v_expires_at timestamptz;
  v_raw_token text;
  v_raw_token_2 text;
  v_hash text;
  v_status text;
  v_cnt int;
  v_actor uuid;
  v_role text;
  v_joined timestamptz;
begin
  if current_setting('zyntix.allow_invitation_acceptance_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing invitation acceptance live verification: set zyntix.allow_invitation_acceptance_live_verify=on in this transaction only. Never run against production.';
  end if;

  if to_regprocedure('public.accept_organization_invitation(text)') is null then
    raise exception 'accept_organization_invitation missing';
  end if;

  if to_regprocedure('public.create_organization_invitation(uuid, text, text)') is null
     or to_regprocedure('public.resend_organization_invitation(uuid, uuid)') is null
     or to_regprocedure('public.revoke_organization_invitation(uuid, uuid)') is null
  then
    raise exception 'operator invitation RPCs missing (regression)';
  end if;

  if has_function_privilege(
       'service_role',
       'public.accept_organization_invitation(text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.accept_organization_invitation(text)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'public.accept_organization_invitation(text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'private.hash_organization_invitation_raw_token(text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'private.get_organization_invitation_accept_identity()',
       'EXECUTE'
     )
  then
    raise exception 'Accept RPC/helper EXECUTE privileges incorrect';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (
      v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-owner@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_invitee, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-invitee@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_wrong, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-wrong@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_unverified, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-unverified@example.test', crypt('x', gen_salt('bf')), null,
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_legacy, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-legacy@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_suspended, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-suspended@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_removed, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-removed@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_active, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'acc-active@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

  insert into public.organizations (id, name, slug, status)
  values
    (v_org, 'Accept Live Org', 'accept-live-org-a', 'active'),
    (v_org_b, 'Accept Live Org B', 'accept-live-org-b', 'active');

  insert into public.organization_members (
    id, organization_id, user_id, role, status, joined_at
  ) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active', now()),
    (v_member_legacy, v_org, v_user_legacy, 'staff', 'invited', null),
    (v_member_suspended, v_org, v_user_suspended, 'viewer', 'suspended', now()),
    (v_member_removed, v_org, v_user_removed, 'viewer', 'removed', now()),
    (v_member_active, v_org, v_user_active, 'staff', 'active', now());

  -- Anonymous / unauthenticated: auth.uid() null under authenticated role
  -- (anon lacks EXECUTE by design — privilege check above already asserts that).
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role authenticated';

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(
    repeat('a', 64)
  );

  if v_result_code <> 'invite_not_found_or_unavailable'
     or v_membership_id is not null
     or v_invitation_id is not null
     or v_organization_id is not null
  then
    raise exception 'unauthenticated accept must be denied with NULL ids: %', v_result_code;
  end if;

  -- Owner creates invitation for invitee
  execute 'reset role';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  execute 'set local role authenticated';

  select result_code, invitation_id, expires_at, raw_token
    into v_result_code, v_invitation_id, v_expires_at, v_raw_token
  from public.create_organization_invitation(
    v_org, 'acc-invitee@example.test', 'staff'
  );

  if v_result_code <> 'success' or v_raw_token is null then
    raise exception 'create for accept failed: %', v_result_code;
  end if;

  -- Malformed token
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_invitee::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_invitee::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation('not-a-token');

  if v_result_code <> 'invite_not_found_or_unavailable'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'malformed token must be unavailable with NULL ids: %', v_result_code;
  end if;

  -- Unknown token
  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('b', 64));

  if v_result_code <> 'invite_not_found_or_unavailable'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'unknown token must be unavailable with NULL ids: %', v_result_code;
  end if;

  -- Wrong authenticated email
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_wrong::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_wrong::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(v_raw_token);

  if v_result_code <> 'email_mismatch'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'wrong email must mismatch with NULL ids: %', v_result_code;
  end if;

  execute 'reset role';
  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where organization_id = v_org
    and email_normalized = 'acc-invitee@example.test'
    and status = 'pending'
  order by created_at desc
  limit 1;
  if v_status <> 'pending' or v_hash is null then
    raise exception 'email_mismatch must not mutate invitation';
  end if;

  -- Unverified matching email (create invite for unverified address)
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code, invitation_id, raw_token
    into v_result_code, v_invitation_id, v_raw_token_2
  from public.create_organization_invitation(
    v_org, 'acc-unverified@example.test', 'viewer'
  );
  if v_result_code <> 'success' then
    raise exception 'create unverified target failed: %', v_result_code;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_unverified::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_unverified::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(v_raw_token_2);

  if v_result_code <> 'forbidden'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'unverified accept must be forbidden with NULL ids: %', v_result_code;
  end if;

  -- Happy path: verified matching email, no membership
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  -- recreate primary invitee invite (still pending from mismatch tests)
  select result_code, invitation_id, raw_token
    into v_result_code, v_invitation_id, v_raw_token
  from public.create_organization_invitation(
    v_org, 'acc-invitee@example.test', 'staff'
  );
  -- may already be pending from earlier create
  if v_result_code = 'invite_already_pending' then
    execute 'reset role';
    select oi.id into v_invitation_id
    from public.organization_invitations as oi
    where oi.organization_id = v_org
      and oi.email_normalized = 'acc-invitee@example.test'
      and oi.status = 'pending'
    limit 1;
    execute 'set local role authenticated';
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
      true
    );
    perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
    -- need raw token: rotate via resend
    select result_code, invitation_id, raw_token
      into v_result_code, v_invitation_id, v_raw_token
    from public.resend_organization_invitation(v_org, v_invitation_id);
  end if;

  if v_result_code <> 'success' or v_raw_token is null then
    raise exception 'prepare invitee token failed: %', v_result_code;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_invitee::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_invitee::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(v_raw_token);

  if v_result_code <> 'success'
     or v_membership_id is null
     or v_organization_id is distinct from v_org
  then
    raise exception 'happy-path accept failed: %', v_result_code;
  end if;

  execute 'reset role';
  select om.role, om.status, om.joined_at
    into v_role, v_status, v_joined
  from public.organization_members as om
  where om.id = v_membership_id;

  if v_role <> 'staff' or v_status <> 'active' or v_joined is null then
    raise exception 'membership insert shape incorrect';
  end if;

  select status, token_hash, accepted_by_user_id
    into v_status, v_hash, v_actor
  from public.organization_invitations
  where id = v_invitation_id;

  if v_status <> 'accepted' or v_hash is not null or v_actor is distinct from v_user_invitee then
    raise exception 'invitation terminalization incorrect';
  end if;

  select count(*) into v_cnt
  from public.organization_invitation_events
  where invitation_id = v_invitation_id
    and event_type = 'invitation_accepted';

  select actor_member_id into v_actor
  from public.organization_invitation_events
  where invitation_id = v_invitation_id
    and event_type = 'invitation_accepted'
  limit 1;

  if v_cnt <> 1 or v_actor is distinct from v_membership_id then
    raise exception 'accepted event actor incorrect: cnt=% actor=%', v_cnt, v_actor;
  end if;

  -- Replay same token
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_invitee::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_invitee::text, true);

  select result_code into v_result_code
  from public.accept_organization_invitation(v_raw_token);

  if v_result_code <> 'invite_not_found_or_unavailable' then
    raise exception 'replay must be unavailable: %', v_result_code;
  end if;

  -- Active-member idempotent path (plant invitation; CREATE would deny already_member)
  execute 'reset role';
  v_hash := encode(
    extensions.digest(convert_to(repeat('9', 64), 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.organization_invitations (
    id, organization_id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb00',
    v_org, 'acc-active@example.test', 'viewer', 'pending',
    v_member_owner, v_hash, now() + interval '7 days'
  );
  v_invitation_id := 'cccccccc-cccc-4ccc-8ccc-cccccccccb00';
  v_raw_token := repeat('9', 64);

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_active::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_active::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(v_raw_token);

  if v_result_code <> 'already_member'
     or v_membership_id is distinct from v_member_active
  then
    raise exception 'active idempotent accept failed: % mem=%', v_result_code, v_membership_id;
  end if;

  execute 'reset role';
  select om.role into v_role
  from public.organization_members as om
  where om.id = v_member_active;
  if v_role <> 'staff' then
    raise exception 'active accept must not change existing membership role';
  end if;

  execute 'reset role';
  select count(*) into v_cnt
  from public.organization_members
  where organization_id = v_org
    and user_id = v_user_active;
  if v_cnt <> 1 then
    raise exception 'active accept must not duplicate membership';
  end if;

  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where id = v_invitation_id;
  if v_status <> 'accepted' or v_hash is not null then
    raise exception 'active accept must terminalize invitation';
  end if;

  select count(*) into v_cnt
  from public.organization_invitation_events
  where invitation_id = v_invitation_id
    and event_type = 'invitation_accepted';

  select actor_member_id into v_actor
  from public.organization_invitation_events
  where invitation_id = v_invitation_id
    and event_type = 'invitation_accepted'
  limit 1;

  if v_cnt <> 1 or v_actor is distinct from v_member_active then
    raise exception 'active accept event actor incorrect';
  end if;

  -- OD-ACC-1: legacy invited
  -- Create invitation while temporarily removing legacy collision via direct path:
  -- Operator CREATE denies invited collision, so insert invitation as DEFINER-bypass
  -- using service role reset + direct insert is not allowed for authenticated.
  -- Instead: delete legacy membership temporarily is forbidden in product;
  -- For live verify: insert invitation row via security definer path by
  -- first removing the legacy membership? That would mutate test fixture.
  -- Approach: set legacy user email invite while membership is invited —
  -- create is denied. So plant invitation with matching email via table write
  -- under reset role (table owner / postgres in live script).
  execute 'reset role';

  v_hash := encode(
    extensions.digest(convert_to(repeat('c', 64), 'UTF8'), 'sha256'),
    'hex'
  );

  insert into public.organization_invitations (
    id,
    organization_id,
    email_normalized,
    role,
    status,
    invited_by_member_id,
    token_hash,
    expires_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb01',
    v_org,
    'acc-legacy@example.test',
    'viewer',
    'pending',
    v_member_owner,
    v_hash,
    now() + interval '7 days'
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_legacy::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_legacy::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('c', 64));

  if v_result_code <> 'existing_membership_requires_admin_action'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'OD-ACC-1 failed with id leak: %', v_result_code;
  end if;

  execute 'reset role';
  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb01';
  if v_status <> 'pending' or v_hash is null then
    raise exception 'OD-ACC-1 must leave invitation pending with token';
  end if;

  select status into v_status
  from public.organization_members
  where id = v_member_legacy;
  if v_status <> 'invited' then
    raise exception 'OD-ACC-1 must not mutate legacy membership';
  end if;

  select count(*) into v_cnt
  from public.organization_invitation_events
  where invitation_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb01'
    and event_type = 'invitation_accepted';
  if v_cnt <> 0 then
    raise exception 'OD-ACC-1 must not emit accepted event';
  end if;

  -- OD-ACC-3 suspended
  v_hash := encode(
    extensions.digest(convert_to(repeat('d', 64), 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.organization_invitations (
    id, organization_id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb02',
    v_org, 'acc-suspended@example.test', 'viewer', 'pending',
    v_member_owner, v_hash, now() + interval '7 days'
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_suspended::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_suspended::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('d', 64));

  if v_result_code <> 'existing_membership_requires_admin_action'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'OD-ACC-3 suspended failed with id leak: %', v_result_code;
  end if;

  execute 'reset role';
  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb02';
  if v_status <> 'pending' or v_hash is null then
    raise exception 'OD-ACC-3 suspended must leave credential pending';
  end if;

  -- OD-ACC-3 removed
  v_hash := encode(
    extensions.digest(convert_to(repeat('e', 64), 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.organization_invitations (
    id, organization_id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb03',
    v_org, 'acc-removed@example.test', 'viewer', 'pending',
    v_member_owner, v_hash, now() + interval '7 days'
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_removed::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_removed::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('e', 64));

  if v_result_code <> 'existing_membership_requires_admin_action'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'OD-ACC-3 removed failed with id leak: %', v_result_code;
  end if;

  execute 'reset role';
  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb03';
  if v_status <> 'pending' or v_hash is null then
    raise exception 'OD-ACC-3 removed must leave credential pending';
  end if;

  -- OD-ACC-4 effective expiry materialization
  v_hash := encode(
    extensions.digest(convert_to(repeat('f', 64), 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.organization_invitations (
    id, organization_id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at, created_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb04',
    v_org, 'acc-invitee@example.test', 'viewer', 'pending',
    v_member_owner, v_hash, now() - interval '1 hour', now() - interval '8 days'
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_invitee::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_invitee::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('f', 64));

  if v_result_code <> 'invite_not_found_or_unavailable'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'OD-ACC-4 must return unavailable with NULL ids: %', v_result_code;
  end if;

  execute 'reset role';
  select status, token_hash into v_status, v_hash
  from public.organization_invitations
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb04';
  if v_status <> 'expired' or v_hash is not null then
    raise exception 'OD-ACC-4 must materialize expired and clear token';
  end if;

  select count(*) into v_cnt
  from public.organization_invitation_events
  where invitation_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb04';
  if v_cnt <> 0 then
    raise exception 'OD-ACC-4 must not emit events';
  end if;

  -- Org suspended deny
  update public.organizations set status = 'suspended' where id = v_org;

  v_hash := encode(
    extensions.digest(convert_to(repeat('1', 64), 'UTF8'), 'sha256'),
    'hex'
  );
  insert into public.organization_invitations (
    id, organization_id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccb05',
    v_org, 'acc-wrong@example.test', 'viewer', 'pending',
    v_member_owner, v_hash, now() + interval '7 days'
  );

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_wrong::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_wrong::text, true);

  select result_code, invitation_id, organization_id, membership_id
    into v_result_code, v_invitation_id, v_organization_id, v_membership_id
  from public.accept_organization_invitation(repeat('1', 64));

  if v_result_code <> 'invite_not_found_or_unavailable'
     or v_invitation_id is not null
     or v_organization_id is not null
     or v_membership_id is not null
  then
    raise exception 'suspended org accept must deny with NULL ids: %', v_result_code;
  end if;

  execute 'reset role';
  select status into v_status
  from public.organization_invitations
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccb05';
  if v_status <> 'pending' then
    raise exception 'suspended org deny must not terminalize invitation';
  end if;

  update public.organizations set status = 'archived' where id = v_org;

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_wrong::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_wrong::text, true);

  select result_code into v_result_code
  from public.accept_organization_invitation(repeat('1', 64));

  if v_result_code <> 'invite_not_found_or_unavailable' then
    raise exception 'archived org accept must deny: %', v_result_code;
  end if;

  execute 'reset role';
  update public.organizations set status = 'active' where id = v_org;

  -- Old token after resend
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  execute 'set local role authenticated';

  select result_code, invitation_id, raw_token
    into v_result_code, v_invitation_id, v_raw_token
  from public.create_organization_invitation(
    v_org, 'acc-wrong@example.test', 'viewer'
  );
  if v_result_code = 'invite_already_pending' then
    execute 'reset role';
    select oi.id into v_invitation_id
    from public.organization_invitations as oi
    where oi.organization_id = v_org
      and oi.email_normalized = 'acc-wrong@example.test'
      and oi.status = 'pending'
    order by oi.created_at desc
    limit 1;
    execute 'set local role authenticated';
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
      true
    );
    perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
    select result_code, invitation_id, raw_token
      into v_result_code, v_invitation_id, v_raw_token
    from public.resend_organization_invitation(v_org, v_invitation_id);
  end if;

  if v_result_code <> 'success' then
    raise exception 'create/resend for old-token test failed: %', v_result_code;
  end if;

  v_raw_token_2 := v_raw_token;
  select result_code, invitation_id, raw_token
    into v_result_code, v_invitation_id, v_raw_token
  from public.resend_organization_invitation(v_org, v_invitation_id);

  if v_result_code <> 'success' or v_raw_token = v_raw_token_2 then
    raise exception 'resend rotation failed';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_wrong::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_wrong::text, true);

  select result_code into v_result_code
  from public.accept_organization_invitation(v_raw_token_2);

  if v_result_code <> 'invite_not_found_or_unavailable' then
    raise exception 'old token after resend must fail: %', v_result_code;
  end if;

  -- Revoked token unavailable
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code
    into v_result_code
  from public.revoke_organization_invitation(v_org, v_invitation_id);

  if v_result_code <> 'success' then
    raise exception 'revoke for accept regression failed: %', v_result_code;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_wrong::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_wrong::text, true);

  select result_code into v_result_code
  from public.accept_organization_invitation(v_raw_token);

  if v_result_code <> 'invite_not_found_or_unavailable' then
    raise exception 'revoked token must be unavailable: %', v_result_code;
  end if;

  -- token_hash column still not granted to authenticated
  if exists (
    select 1
    from information_schema.role_column_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'organization_invitations'
      and column_name = 'token_hash'
      and privilege_type = 'SELECT'
  ) then
    raise exception 'token_hash must not be selectable by authenticated';
  end if;

  raise notice 'INVITATION ACCEPTANCE LIVE VERIFICATION: PASS';
end;
$$;

rollback;
