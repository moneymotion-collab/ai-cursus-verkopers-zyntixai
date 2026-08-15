-- Social Brand Brain / Campaign live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs. BEGIN/ROLLBACK. Requires:
--   select set_config('zyntix.allow_social_brand_brain_rpc_live_verify', 'on', true);

begin;
select set_config('zyntix.allow_social_brand_brain_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa831';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb831';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa931';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa933';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb931';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab31';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab33';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb31';
  v_brand uuid;
  v_workspace uuid;
  v_brand_b uuid;
  v_audience uuid;
  v_pillar uuid;
  v_goal uuid;
  v_campaign uuid;
  v_result text;
begin
  if current_setting('zyntix.allow_social_brand_brain_rpc_live_verify', true) is distinct from 'on' then
    raise exception 'Refusing brand brain live verify without opt-in GUC';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bb-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bb-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bb-b@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status) values
    (v_org, 'BB Org', 'bb-org-a', 'active'),
    (v_org_b, 'BB Org B', 'bb-org-b', 'active');
  insert into public.organization_members (id, organization_id, user_id, role, status) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select brand_id, workspace_id into v_brand, v_workspace
  from public.create_social_workspace(v_org, 'Brand Brain Brand', null);
  if v_brand is null then raise exception 'workspace create failed'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select brand_id into v_brand_b from public.create_social_workspace(v_org_b, 'Org B Brand', null);

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code into v_result from public.create_social_audience(v_org, v_brand, 'Staff Audience');
  if v_result <> 'forbidden' then raise exception 'staff audience must be forbidden: %', v_result; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code into v_result
  from public.upsert_social_brand_profile(
    v_org, v_brand, 'Summary', 'Positioning', 'en', 'https://example.test',
    '{"formality":"neutral","toneDescriptors":["clear"]}'::jsonb, 'user_entered'
  );
  if v_result <> 'success' then raise exception 'profile upsert failed: %', v_result; end if;

  select result_code into v_result
  from public.upsert_social_brand_profile(
    v_org, v_brand, 'Summary', 'Positioning', 'en', null, '{}'::jsonb, 'ai_inferred'
  );
  if v_result <> 'invalid_input' then raise exception 'ai_inferred profile must be invalid: %', v_result; end if;

  select result_code into v_result from public.create_social_audience(v_org, v_brand_b, 'Cross');
  if v_result not in ('not_found', 'forbidden', 'conflict') then
    raise exception 'cross-brand audience must fail: %', v_result;
  end if;

  select result_code, audience_id into v_result, v_audience
  from public.create_social_audience(v_org, v_brand, 'Founders');
  if v_result <> 'success' then raise exception 'audience create failed: %', v_result; end if;

  select result_code, pillar_id into v_result, v_pillar
  from public.create_social_content_pillar(v_org, v_brand, 'Education');
  if v_result <> 'success' then raise exception 'pillar create failed: %', v_result; end if;

  select result_code, goal_id into v_result, v_goal
  from public.create_social_goal(v_org, v_brand, 'lead_generation', 'Leads', null, 10, '{"metric":"qualified_leads"}'::jsonb);
  if v_result <> 'success' then raise exception 'goal create failed: %', v_result; end if;

  select result_code into v_result
  from public.upsert_social_platform_strategy(v_org, v_brand, 'tiktok', 'discovery', null, null, null);
  if v_result <> 'success' then raise exception 'tiktok strategy failed: %', v_result; end if;

  select result_code, campaign_id into v_result, v_campaign
  from public.create_social_campaign(v_org, v_brand, 'Launch', null, v_goal, 'draft', now(), now() + interval '30 days', '{}'::jsonb);
  if v_result <> 'success' then raise exception 'campaign create failed: %', v_result; end if;

  select result_code into v_result
  from public.set_social_campaign_assignments(
    v_org, v_campaign, array[v_audience], array['instagram','tiktok'], array[v_pillar]
  );
  if v_result <> 'success' then raise exception 'assignments failed: %', v_result; end if;

  select result_code into v_result
  from public.set_social_campaign_assignments(
    v_org, v_campaign, array[v_audience], array['not_a_provider'], array[v_pillar]
  );
  if v_result <> 'invalid_input' then raise exception 'unknown provider must fail: %', v_result; end if;

  -- TikTok strategy must not imply connection provider support changed
  if exists (
    select 1 from pg_constraint
    where conname = 'social_account_connections_provider_chk'
      and pg_get_constraintdef(oid) ilike '%tiktok%'
  ) then
    raise exception 'connection provider check must remain Instagram-only';
  end if;

  raise notice 'SMM-B1.3 brand brain live verification PASS';
end;
$$;

rollback;
