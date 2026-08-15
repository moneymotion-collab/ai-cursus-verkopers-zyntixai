-- Social publishing infrastructure live verification (LOCAL / SAFE DB ONLY).
-- BEGIN/ROLLBACK. Requires:
--   select set_config('zyntix.allow_social_publishing_rpc_live_verify', 'on', true);

begin;
select set_config('zyntix.allow_social_publishing_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa861';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa961';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa963';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa964';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab61';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab63';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab64';
  v_brand uuid;
  v_workspace uuid;
  v_content uuid;
  v_variant uuid;
  v_version uuid;
  v_connection uuid;
  v_pub uuid;
  v_pub2 uuid;
  v_attempt uuid;
  v_claim_gen integer;
  v_n integer;
  v_result text;
begin
  if current_setting('zyntix.allow_social_publishing_rpc_live_verify', true) is distinct from 'on' then
    raise exception 'Refusing publishing live verify without opt-in GUC';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p-viewer@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status)
  values (v_org, 'Publish Org', 'publish-org-a', 'active');
  insert into public.organization_members (id, organization_id, user_id, role, status) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_viewer, v_org, v_user_viewer, 'viewer', 'active');

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select brand_id, workspace_id into v_brand, v_workspace
  from public.create_social_workspace(v_org, 'Publish Brand', null);

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);

  select result_code, content_id into v_result, v_content
  from public.create_social_content_item(v_org, v_brand, 'Publish story');
  select result_code, variant_id into v_result, v_variant
  from public.create_social_content_variant(
    v_org, v_content, 'instagram', 'image', null, 'caption', null, null, null, null, '{}'::jsonb, 'draft'
  );
  select result_code, version_id into v_result, v_version
  from public.create_social_content_variant_version(v_org, v_variant, 'v1');
  select result_code into v_result
  from public.submit_social_approval_decision(v_org, v_version, 'approved', null, null);
  if v_result <> 'success' then raise exception 'approve failed: %', v_result; end if;

  -- Minimal connected row for binding tests (no OAuth). Direct insert as postgres.
  reset role;
  insert into public.social_account_connections (
    id, organization_id, workspace_id, provider, login_product,
    external_account_id, professional_account_type, status, health,
    capability_snapshot, credential_ref_id, connected_by_member_id, connected_at
  ) values (
    gen_random_uuid(), v_org, v_workspace, 'instagram', 'instagram_login',
    'ig_ext_1', 'business', 'connected', 'healthy',
    '["publish_image"]'::jsonb, gen_random_uuid(), v_member_staff, now()
  ) returning id into v_connection;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);

  select result_code, publication_id into v_result, v_pub
  from public.create_social_publication(
    v_org, v_version, v_connection, 'immediate', null, now(), 'idem_pub_1_unique'
  );
  if v_result <> 'success' then raise exception 'create publication failed: %', v_result; end if;

  -- Idempotent recreate
  select result_code, publication_id into v_result, v_pub2
  from public.create_social_publication(
    v_org, v_version, v_connection, 'immediate', null, now(), 'idem_pub_1_unique'
  );
  if v_result <> 'success' or v_pub2 <> v_pub then
    raise exception 'idempotent create mismatch: % % %', v_result, v_pub, v_pub2;
  end if;

  -- Viewer cannot create
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_viewer::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_viewer::text, true);
  select result_code into v_result
  from public.create_social_publication(
    v_org, v_version, v_connection, 'immediate', null, now(), 'idem_viewer'
  );
  if v_result <> 'forbidden' then raise exception 'viewer create must be forbidden: %', v_result; end if;

  -- Browser cannot complete attempts (EXECUTE not granted to authenticated)
  begin
    perform private.complete_social_publication_attempt(
      v_org, gen_random_uuid(), 'w1', 1, 'succeeded', null, null, 'ext'
    );
    raise exception 'authenticated must not execute complete attempt';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm like '%permission denied%' then
        null;
      else
        raise;
      end if;
  end;

  -- Even privileged DB role requires worker GUC
  reset role;
  begin
    perform private.complete_social_publication_attempt(
      v_org, gen_random_uuid(), 'w1', 1, 'succeeded', null, null, 'ext'
    );
    raise exception 'worker complete without GUC must fail';
  exception when raise_exception then
    if sqlerrm not like '%worker%' then raise; end if;
  end;

  -- Gate OFF blocks claim
  perform set_config('zyntix.social_publication_worker', 'on', true);
  perform set_config('zyntix.social_publishing_enabled', 'false', true);
  select result_code into v_result
  from private.claim_due_social_publications(v_org, 'worker-a', 1, 60);
  if v_result <> 'feature_disabled' then raise exception 'gate off must block claim: %', v_result; end if;

  -- Gate ON allows claim + start; complete with adapter_unavailable style terminal
  perform set_config('zyntix.social_publishing_enabled', 'true', true);
  select result_code, publication_id, claim_generation into v_result, v_pub2, v_claim_gen
  from private.claim_due_social_publications(v_org, 'worker-a', 1, 60);
  if v_result <> 'success' then raise exception 'claim failed: %', v_result; end if;

  select result_code, attempt_id, attempt_number into v_result, v_attempt, v_n
  from private.start_social_publication_attempt(v_org, v_pub2, 'worker-a', v_claim_gen);
  if v_result <> 'success' or v_n <> 1 then raise exception 'start attempt failed: % %', v_result, v_n; end if;

  -- Stale claim completion rejected
  select result_code into v_result
  from private.complete_social_publication_attempt(
    v_org, v_attempt, 'worker-b', v_claim_gen, 'succeeded', null, null, 'ext-1'
  );
  if v_result <> 'stale_claim' then raise exception 'stale claim must fail: %', v_result; end if;

  select result_code into v_result
  from private.complete_social_publication_attempt(
    v_org, v_attempt, 'worker-a', v_claim_gen, 'failed_terminal', 'adapter_unavailable', 'provider_adapter_unavailable', null
  );
  if v_result <> 'success' then raise exception 'complete failed: %', v_result; end if;

  if exists (
    select 1 from public.social_publications
    where id = v_pub2 and external_publication_id is not null
  ) then
    raise exception 'failed attempt must not set external id';
  end if;

  raise notice 'SMM-B1.6 publishing live verification PASS';
end;
$$;

rollback;
