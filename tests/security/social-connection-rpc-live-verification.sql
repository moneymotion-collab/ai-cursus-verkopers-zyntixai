-- Social connection RPC live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs only. No production data. No real provider tokens.
--
-- HARD GUARDS:
-- 1) Run only against the local Docker Supabase DB (127.0.0.1).
-- 2) Never run against a linked/production project.
-- 3) Entire script is wrapped in BEGIN/ROLLBACK (no durable writes).
-- 4) Requires explicit per-transaction opt-in:
--      select set_config('zyntix.allow_social_connection_rpc_live_verify', 'on', true);

begin;

select set_config('zyntix.allow_social_connection_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa811';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb811';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa911';
  v_user_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa912';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa913';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa914';
  v_user_suspended uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa915';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb911';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab01';
  v_member_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab02';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab03';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab04';
  v_member_suspended uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab05';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01';
  v_workspace uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaac01';
  v_result_code text;
  v_connection_id uuid;
  v_intent_id uuid;
  v_expected_external text;
  v_credential_id uuid;
  v_credential_version integer;
  v_cnt int;
  v_fingerprint text := repeat('ab', 32);
  v_fingerprint_2 text := repeat('cd', 32);
  v_iv text := encode(decode('000000000000000000000000', 'hex'), 'base64');
  v_tag text := encode(decode('00000000000000000000000000000000', 'hex'), 'base64');
  v_ct text := encode(convert_to('synthetic-cipher-not-a-token', 'UTF8'), 'base64');
begin
  if current_setting('zyntix.allow_social_connection_rpc_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing social connection RPC live verification: set zyntix.allow_social_connection_rpc_live_verify=on in this transaction only. Never run against production.';
  end if;

  if to_regprocedure('public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz)') is null
     or to_regprocedure('public.consume_social_oauth_intent(uuid, text)') is null
     or to_regprocedure('public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz)') is null
  then
    raise exception 'social connection RPCs missing';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-admin@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-viewer@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_suspended, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-suspended@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-b-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status)
  values
    (v_org, 'SMM Live Org', 'smm-live-org-a', 'active'),
    (v_org_b, 'SMM Live Org B', 'smm-live-org-b', 'active');

  insert into public.organization_members (id, organization_id, user_id, role, status)
  values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_admin, v_org, v_user_admin, 'admin', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_viewer, v_org, v_user_viewer, 'viewer', 'active'),
    (v_member_suspended, v_org, v_user_suspended, 'owner', 'suspended'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  -- SMM-B1.2: physical workspace required before connection intents
  insert into public.social_brands (
    id, organization_id, display_name, created_by_member_id
  ) values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaad01',
    v_org,
    'SMM Live Brand',
    v_member_owner
  );

  insert into public.social_workspaces (
    id, organization_id, brand_id, display_name, created_by_member_id
  ) values (
    v_workspace,
    v_org,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaad01',
    'SMM Live Workspace',
    v_member_owner
  );

  -- Staff cannot manage connections
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);

  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'forbidden' then
    raise exception 'staff connect must be forbidden: %', v_result_code;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_viewer::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_viewer::text, true);
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'forbidden' then
    raise exception 'viewer connect must be forbidden: %', v_result_code;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_suspended::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_suspended::text, true);
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'forbidden' then
    raise exception 'suspended owner connect must be forbidden: %', v_result_code;
  end if;

  -- Cross-tenant create denied
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'forbidden' then
    raise exception 'cross-tenant connect must be forbidden: %', v_result_code;
  end if;

  -- Unsupported provider
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace, 'facebook', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'provider_unsupported' then
    raise exception 'unsupported provider must fail closed: %', v_result_code;
  end if;

  -- Owner create + consume single-use
  select result_code, connection_id, intent_id
    into v_result_code, v_connection_id, v_intent_id
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'success' then
    raise exception 'owner connect failed: %', v_result_code;
  end if;

  select result_code into v_result_code
  from public.consume_social_oauth_intent(v_intent_id, v_fingerprint);
  if v_result_code <> 'success' then
    raise exception 'oauth consume failed: %', v_result_code;
  end if;

  select result_code into v_result_code
  from public.consume_social_oauth_intent(v_intent_id, v_fingerprint);
  if v_result_code <> 'replayed_state' then
    raise exception 'oauth intent single-use failed: %', v_result_code;
  end if;

  -- Finalize + duplicate protection
  select result_code into v_result_code
  from public.finalize_social_connection(
    v_connection_id, '17841400000000001', 'Brand', 'business', '["publish_image"]'::jsonb
  );
  if v_result_code <> 'success' then
    raise exception 'finalize failed: %', v_result_code;
  end if;

  select result_code, connection_id, intent_id
    into v_result_code, v_connection_id, v_intent_id
  from public.create_social_connection_intent(
    v_org, v_workspace, 'instagram', 'social_workspace', v_fingerprint_2, now() + interval '10 minutes'
  );
  if v_result_code <> 'success' then
    raise exception 'second connect failed: %', v_result_code;
  end if;
  select result_code into v_result_code
  from public.consume_social_oauth_intent(v_intent_id, v_fingerprint_2);
  if v_result_code <> 'success' then
    raise exception 'second consume failed: %', v_result_code;
  end if;
  select result_code into v_result_code
  from public.finalize_social_connection(
    v_connection_id, '17841400000000001', 'Brand', 'business', '[]'::jsonb
  );
  if v_result_code <> 'duplicate_connection' then
    raise exception 'duplicate active connection failed: %', v_result_code;
  end if;

  -- CAS credential versions
  v_credential_id := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaad01';
  select sac.id into v_connection_id
  from public.social_account_connections as sac
  where sac.organization_id = v_org
    and sac.external_account_id = '17841400000000001'
    and sac.status = 'connected';

  select result_code, credential_version
    into v_result_code, v_credential_version
  from public.upsert_social_provider_credential(
    v_connection_id, v_credential_id, 0, 1, 'zyntixai.smm.credential.aes-v1', 1,
    v_ct, v_iv, v_tag, now() + interval '60 days'
  );
  if v_result_code <> 'success' or v_credential_version <> 1 then
    raise exception 'credential insert failed: % %', v_result_code, v_credential_version;
  end if;

  select result_code, credential_version
    into v_result_code, v_credential_version
  from public.upsert_social_provider_credential(
    v_connection_id, v_credential_id, 1, 1, 'zyntixai.smm.credential.aes-v1', 1,
    v_ct, v_iv, v_tag, now() + interval '60 days'
  );
  if v_result_code <> 'success' or v_credential_version <> 2 then
    raise exception 'credential cas update failed: % %', v_result_code, v_credential_version;
  end if;

  select result_code into v_result_code
  from public.upsert_social_provider_credential(
    v_connection_id, v_credential_id, 1, 1, 'zyntixai.smm.credential.aes-v1', 1,
    v_ct, v_iv, v_tag, now() + interval '60 days'
  );
  if v_result_code <> 'stale_version' then
    raise exception 'stale credential version failed: %', v_result_code;
  end if;

  execute 'reset role';
  select credential_version into v_credential_version
  from private.social_provider_credentials
  where connection_id = v_connection_id;
  if v_credential_version <> 2 then
    raise exception 'stored envelope must remain version 2';
  end if;

  -- Direct credential table access denied as authenticated
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  begin
    select count(*) into v_cnt from private.social_provider_credentials;
    raise exception 'direct credential SELECT must be denied';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm = 'direct credential SELECT must be denied' then
        raise;
      end if;
  end;

  -- Event fabrication denied
  begin
    insert into public.social_connection_events (
      organization_id, connection_id, event_type, actor_source, payload
    ) values (
      v_org, v_connection_id, 'social_connection_established', 'member', '{}'::jsonb
    );
    raise exception 'event fabrication must be denied';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm = 'event fabrication must be denied' then
        raise;
      end if;
  end;

  -- Connect rate limit (10 / hour)
  for v_cnt in 1..10 loop
    select result_code into v_result_code
    from public.create_social_connection_intent(
      v_org,
      v_workspace,
      'instagram',
      'social_workspace',
      encode(extensions.digest(convert_to(v_cnt::text, 'UTF8'), 'sha256'), 'hex'),
      now() + interval '10 minutes'
    );
  end loop;
  if v_result_code <> 'rate_limited' then
    raise exception 'connect rate limit failed: %', v_result_code;
  end if;
end;
$$;

rollback;
