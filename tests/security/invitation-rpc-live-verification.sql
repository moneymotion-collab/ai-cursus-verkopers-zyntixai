-- Invitations operator RPC live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs only. No production data. No secrets.
--
-- HARD GUARDS:
-- 1) Run only against the local Docker Supabase DB (127.0.0.1).
-- 2) Never run against a linked/production project.
-- 3) Entire script is wrapped in BEGIN/ROLLBACK (no durable writes).
-- 4) Requires explicit per-transaction opt-in:
--      select set_config('zyntix.allow_invitation_rpc_live_verify', 'on', true);

begin;

select set_config('zyntix.allow_invitation_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa801';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb801';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa901';
  v_user_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa902';
  v_user_invited uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa903';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
  v_member_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';
  v_member_invited uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbba01';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb901';
  v_result_code text;
  v_invitation_id uuid;
  v_expires_at timestamptz;
  v_raw_token text;
  v_hash text;
  v_expected_hash text;
  v_cnt int;
  v_constraint text;
  v_err text;
begin
  if current_setting('zyntix.allow_invitation_rpc_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing invitation RPC live verification: set zyntix.allow_invitation_rpc_live_verify=on in this transaction only. Never run against production.';
  end if;

  if exists (
    select 1
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'accept_organization_invitation'
  ) then
    raise exception 'accept_organization_invitation must not exist in this slice';
  end if;

  if to_regprocedure('public.create_organization_invitation(uuid, text, text)') is null
     or to_regprocedure('public.resend_organization_invitation(uuid, uuid)') is null
     or to_regprocedure('public.revoke_organization_invitation(uuid, uuid)') is null
  then
    raise exception 'operator invitation RPCs missing';
  end if;

  if has_function_privilege(
       'service_role',
       'public.create_organization_invitation(uuid, text, text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.create_organization_invitation(uuid, text, text)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'public.create_organization_invitation(uuid, text, text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'private.resolve_organization_invitation_membership_collision(uuid, text)',
       'EXECUTE'
     )
  then
    raise exception 'RPC/helper EXECUTE privileges incorrect';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (
      v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'live-owner@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_admin, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'live-admin@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_invited, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'live-legacy-invited@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'authenticated', 'live-b-owner@example.test', crypt('x', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

  insert into public.organizations (id, name, slug, status)
  values
    (v_org, 'Live RPC Org', 'live-rpc-org-a', 'active'),
    (v_org_b, 'Live RPC Org B', 'live-rpc-org-b', 'active');

  insert into public.organization_members (
    id, organization_id, user_id, role, status
  ) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_admin, v_org, v_user_admin, 'admin', 'active'),
    (v_member_invited, v_org, v_user_invited, 'staff', 'invited'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  execute 'set local role authenticated';

  -- Token/hash relationship
  select result_code, invitation_id, expires_at, raw_token
    into v_result_code, v_invitation_id, v_expires_at, v_raw_token
  from public.create_organization_invitation(
    v_org, 'live-new@example.test', 'staff'
  );

  if v_result_code <> 'success'
     or v_raw_token is null
     or char_length(v_raw_token) <> 64
     or v_raw_token !~ '^[0-9a-f]{64}$'
  then
    raise exception 'create token contract failed: %', v_result_code;
  end if;

  execute 'reset role';
  v_expected_hash := encode(
    extensions.digest(convert_to(v_raw_token, 'UTF8'), 'sha256'),
    'hex'
  );
  select token_hash into v_hash
  from public.organization_invitations
  where id = v_invitation_id;

  if v_hash is distinct from v_expected_hash or v_hash = v_raw_token then
    raise exception 'persisted token_hash does not match SHA-256 of returned raw token';
  end if;

  -- OD-RPC-3A: legacy invited collision
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code, raw_token
    into v_result_code, v_raw_token
  from public.create_organization_invitation(
    v_org, 'live-legacy-invited@example.test', 'viewer'
  );

  if v_result_code <> 'existing_membership_requires_admin_action'
     or v_raw_token is not null
  then
    raise exception 'OD-RPC-3 invited collision failed: %', v_result_code;
  end if;

  execute 'reset role';
  select count(*) into v_cnt
  from public.organization_invitations
  where organization_id = v_org
    and email_normalized = 'live-legacy-invited@example.test';
  if v_cnt <> 0 then
    raise exception 'OD-RPC-3 must not create invitation row';
  end if;

  select status into v_result_code
  from public.organization_members
  where id = v_member_invited;
  if v_result_code <> 'invited' then
    raise exception 'OD-RPC-3 must not mutate legacy invited membership';
  end if;

  -- Pending unique → invite_already_pending (not token-hash mislabel)
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code, raw_token
    into v_result_code, v_raw_token
  from public.create_organization_invitation(
    v_org, 'live-new@example.test', 'viewer'
  );
  if v_result_code <> 'invite_already_pending' or v_raw_token is not null then
    raise exception 'pending duplicate failed: %', v_result_code;
  end if;

  -- Prove token_hash unique does NOT map to invite_already_pending
  execute 'reset role';
  begin
    insert into public.organization_invitations (
      organization_id,
      email_normalized,
      role,
      status,
      invited_by_member_id,
      token_hash,
      expires_at
    ) values (
      v_org,
      'hash-collision-probe@example.test',
      'viewer',
      'pending',
      v_member_owner,
      v_hash,
      now() + interval '1 day'
    );
    raise exception 'expected token_hash unique violation';
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint is distinct from 'organization_invitations_token_hash_uidx' then
        raise exception 'unexpected constraint for token_hash probe: %', v_constraint;
      end if;
  end;

  -- Admin cannot create admin; foreign create denied before collision oracle
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_admin::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_admin::text, true);
  select result_code into v_result_code
  from public.create_organization_invitation(v_org, 'admin-admin@example.test', 'admin');
  if v_result_code <> 'forbidden' then
    raise exception 'admin create admin: %', v_result_code;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code into v_result_code
  from public.create_organization_invitation(
    v_org, 'live-legacy-invited@example.test', 'viewer'
  );
  if v_result_code <> 'forbidden' then
    raise exception 'foreign actor must not learn collision codes: %', v_result_code;
  end if;

  -- Resend rotation hash relationship
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  select result_code, raw_token
    into v_result_code, v_raw_token
  from public.resend_organization_invitation(v_org, v_invitation_id);
  if v_result_code <> 'success' or char_length(v_raw_token) <> 64 then
    raise exception 'resend failed: %', v_result_code;
  end if;
  execute 'reset role';
  v_expected_hash := encode(
    extensions.digest(convert_to(v_raw_token, 'UTF8'), 'sha256'),
    'hex'
  );
  select token_hash into v_hash
  from public.organization_invitations
  where id = v_invitation_id;
  if v_hash is distinct from v_expected_hash then
    raise exception 'resend token_hash mismatch';
  end if;

  -- Revoke clears hash; double revoke safe
  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  select result_code into v_result_code
  from public.revoke_organization_invitation(v_org, v_invitation_id);
  if v_result_code <> 'success' then
    raise exception 'revoke failed: %', v_result_code;
  end if;
  select result_code into v_result_code
  from public.revoke_organization_invitation(v_org, v_invitation_id);
  if v_result_code <> 'invite_revoked' then
    raise exception 'double revoke failed: %', v_result_code;
  end if;
  execute 'reset role';
  select count(*) into v_cnt
  from public.organization_invitation_events
  where invitation_id = v_invitation_id
    and event_type = 'invitation_revoked';
  if v_cnt <> 1 then
    raise exception 'double revoke event count %', v_cnt;
  end if;

  execute 'set local role authenticated';
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  begin
    execute format(
      'select token_hash from public.organization_invitations where id = %L',
      v_invitation_id
    );
    raise exception 'token_hash still selectable by authenticated';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      get stacked diagnostics v_err = message_text;
      if v_err like '%token_hash still selectable%' then
        raise;
      end if;
      raise;
  end;

  execute 'reset role';
  raise notice 'INVITATION_RPC_LIVE_VERIFY_PASS';
end;
$$;

rollback;
