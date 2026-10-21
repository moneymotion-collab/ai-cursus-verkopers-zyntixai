-- Social Workspace RPC live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs only. No production data. No real provider tokens.
--
-- HARD GUARDS:
-- 1) Run only against the local Docker Supabase DB (127.0.0.1).
-- 2) Never run against a linked/production project.
-- 3) Entire script is wrapped in BEGIN/ROLLBACK (no durable writes).
-- 4) Requires explicit per-transaction opt-in:
--      select set_config('zyntix.allow_social_workspace_rpc_live_verify', 'on', true);

begin;

select set_config('zyntix.allow_social_workspace_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa821';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb821';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa921';
  v_user_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa922';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa923';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa924';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb921';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab21';
  v_member_admin uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab22';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab23';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab24';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb21';
  v_brand_id uuid;
  v_workspace_id uuid;
  v_workspace_b uuid;
  v_result_code text;
  v_cnt int;
  v_fingerprint text := repeat('ef', 32);
  v_connection_id uuid;
  v_intent_id uuid;
begin
  if current_setting('zyntix.allow_social_workspace_rpc_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing social workspace RPC live verification: set zyntix.allow_social_workspace_rpc_live_verify=on in this transaction only. Never run against production.';
  end if;

  if to_regprocedure('public.create_social_workspace(uuid, text, uuid)') is null
     or to_regprocedure('public.archive_social_workspace(uuid, uuid)') is null
  then
    raise exception 'social workspace RPCs missing';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-ws-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-ws-admin@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-ws-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-ws-viewer@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'smm-ws-b@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status)
  values
    (v_org, 'SMM WS Org', 'smm-ws-org-a', 'active'),
    (v_org_b, 'SMM WS Org B', 'smm-ws-org-b', 'active');

  insert into public.organization_members (id, organization_id, user_id, role, status)
  values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_admin, v_org, v_user_admin, 'admin', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_viewer, v_org, v_user_viewer, 'viewer', 'active'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  execute 'set local role authenticated';

  -- Staff cannot create workspace
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code into v_result_code
  from public.create_social_workspace(v_org, 'Staff Brand', null);
  if v_result_code <> 'forbidden' then
    raise exception 'staff create workspace must be forbidden: %', v_result_code;
  end if;

  -- Cross-tenant create denied
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code into v_result_code
  from public.create_social_workspace(v_org, 'Foreign Brand', null);
  if v_result_code <> 'forbidden' then
    raise exception 'cross-tenant create workspace must be forbidden: %', v_result_code;
  end if;

  -- Owner creates workspace
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  select result_code, brand_id, workspace_id
    into v_result_code, v_brand_id, v_workspace_id
  from public.create_social_workspace(v_org, 'Agency Client A', null);
  if v_result_code <> 'success' then
    raise exception 'owner create workspace failed: %', v_result_code;
  end if;

  -- Org B workspace for foreign FK proof
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code, workspace_id
    into v_result_code, v_workspace_b
  from public.create_social_workspace(v_org_b, 'Org B Brand', null);
  if v_result_code <> 'success' then
    raise exception 'org b create workspace failed: %', v_result_code;
  end if;

  -- Foreign workspace cannot be used for Org A connection
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace_b, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'workspace_not_found' then
    raise exception 'foreign workspace connect must be workspace_not_found: %', v_result_code;
  end if;

  -- Missing workspace rejected
  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'workspace_not_found' then
    raise exception 'missing workspace connect must be workspace_not_found: %', v_result_code;
  end if;

  -- Valid workspace connect succeeds
  select result_code, connection_id, intent_id
    into v_result_code, v_connection_id, v_intent_id
  from public.create_social_connection_intent(
    v_org, v_workspace_id, 'instagram', 'social_workspace', v_fingerprint, now() + interval '10 minutes'
  );
  if v_result_code <> 'success' then
    raise exception 'valid workspace connect failed: %', v_result_code;
  end if;

  -- Archive workspace then reject new connect
  select result_code into v_result_code
  from public.archive_social_workspace(v_org, v_workspace_id);
  if v_result_code <> 'success' then
    raise exception 'archive workspace failed: %', v_result_code;
  end if;

  select result_code into v_result_code
  from public.create_social_connection_intent(
    v_org, v_workspace_id, 'instagram', 'social_workspace', repeat('aa', 32), now() + interval '10 minutes'
  );
  if v_result_code <> 'workspace_not_found' then
    raise exception 'archived workspace connect must be workspace_not_found: %', v_result_code;
  end if;

  -- Cross-tenant read denied via RLS
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select count(*) into v_cnt
  from public.social_workspaces
  where organization_id = v_org;
  if v_cnt <> 0 then
    raise exception 'cross-tenant workspace select leaked rows: %', v_cnt;
  end if;

  raise notice 'SMM-B1.2 social workspace RPC live verification PASS';
end;
$$;

rollback;
