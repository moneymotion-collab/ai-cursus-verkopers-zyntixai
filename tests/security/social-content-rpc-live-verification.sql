-- Social Master Content / Variants / Media live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs. BEGIN/ROLLBACK. Requires:
--   select set_config('zyntix.allow_social_content_rpc_live_verify', 'on', true);

begin;
select set_config('zyntix.allow_social_content_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa841';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb841';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa941';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa943';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa944';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb941';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab41';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab43';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab44';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb41';
  v_brand uuid;
  v_workspace uuid;
  v_brand_b uuid;
  v_campaign uuid;
  v_pillar uuid;
  v_content uuid;
  v_content_b uuid;
  v_source uuid;
  v_variant uuid;
  v_variant2 uuid;
  v_asset uuid;
  v_asset2 uuid;
  v_result text;
begin
  if current_setting('zyntix.allow_social_content_rpc_live_verify', true) is distinct from 'on' then
    raise exception 'Refusing content live verify without opt-in GUC';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-viewer@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-b@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status) values
    (v_org, 'Content Org', 'content-org-a', 'active'),
    (v_org_b, 'Content Org B', 'content-org-b', 'active');
  insert into public.organization_members (id, organization_id, user_id, role, status) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_viewer, v_org, v_user_viewer, 'viewer', 'active'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select brand_id, workspace_id into v_brand, v_workspace
  from public.create_social_workspace(v_org, 'Content Brand', null);
  if v_brand is null then raise exception 'workspace create failed'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select brand_id into v_brand_b from public.create_social_workspace(v_org_b, 'Org B Brand', null);

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select result_code, pillar_id into v_result, v_pillar
  from public.create_social_content_pillar(v_org, v_brand, 'Education');
  if v_result <> 'success' then raise exception 'pillar create failed: %', v_result; end if;

  select result_code, campaign_id into v_result, v_campaign
  from public.create_social_campaign(v_org, v_brand, 'Launch', null, null, 'draft', null, null);
  if v_result <> 'success' then raise exception 'campaign create failed: %', v_result; end if;

  -- Viewer cannot create content
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_viewer::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_viewer::text, true);
  select result_code into v_result from public.create_social_content_item(v_org, v_brand, 'Viewer blocked');
  if v_result <> 'forbidden' then raise exception 'viewer content must be forbidden: %', v_result; end if;

  -- Staff CAN create content (B1.4 operational domain)
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code, content_id into v_result, v_source
  from public.create_social_content_item(
    v_org, v_brand, 'Source story', 'concept', 'message', null, v_pillar, 'human_created', null, 'draft'
  );
  if v_result <> 'success' then raise exception 'staff content create failed: %', v_result; end if;

  select result_code into v_result from public.create_social_content_item(v_org, v_brand, '');
  if v_result <> 'invalid_input' then raise exception 'empty title must fail: %', v_result; end if;

  select result_code, content_id into v_result, v_content
  from public.create_social_content_item(
    v_org, v_brand, 'Derived story', null, null, v_campaign, v_pillar, 'repurposed', v_source, 'draft'
  );
  if v_result <> 'success' then raise exception 'lineage content failed: %', v_result; end if;

  -- Cross-tenant campaign attachment rejected
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code, campaign_id into v_result, v_content_b
  from public.create_social_campaign(v_org_b, v_brand_b, 'B Campaign', null, null, 'draft', null, null);
  if v_result <> 'success' then raise exception 'org b campaign failed: %', v_result; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code into v_result
  from public.create_social_content_item(
    v_org, v_brand, 'Foreign campaign', null, null, v_content_b, null, 'human_created', null, 'draft'
  );
  if v_result <> 'invalid_input' then raise exception 'foreign campaign must fail: %', v_result; end if;

  -- Variants: Instagram + TikTok planning (TikTok not runtime)
  select result_code, variant_id into v_result, v_variant
  from public.create_social_content_variant(
    v_org, v_content, 'instagram', 'short_video', 'Hook A', 'caption a', null, null, '#a', null,
    '{"aspect_ratio_hint":"9:16"}'::jsonb, 'draft'
  );
  if v_result <> 'success' then raise exception 'instagram variant failed: %', v_result; end if;

  select result_code, variant_id into v_result, v_variant2
  from public.create_social_content_variant(
    v_org, v_content, 'instagram', 'short_video', 'Hook B', 'caption b', null, null, null, null, '{}'::jsonb, 'draft'
  );
  if v_result <> 'success' then raise exception 'second instagram variant must be allowed: %', v_result; end if;

  select result_code into v_result
  from public.create_social_content_variant(
    v_org, v_content, 'tiktok', 'short_video', null, 'tiktok caption', null, null, null, null, '{}'::jsonb, 'draft'
  );
  if v_result <> 'success' then raise exception 'tiktok planning variant failed: %', v_result; end if;

  select result_code into v_result
  from public.create_social_content_variant(
    v_org, v_content, 'myspace', 'text', null, 'x', null, null, null, null, '{}'::jsonb, 'draft'
  );
  if v_result <> 'invalid_input' then raise exception 'unknown provider must fail: %', v_result; end if;

  select result_code into v_result
  from public.create_social_content_variant(
    v_org, v_content, 'instagram', 'short_video', null, 'bad', null, null, null, null,
    '{"raw_api":"nope"}'::jsonb, 'draft'
  );
  if v_result <> 'invalid_input' then raise exception 'bad provider_config must fail: %', v_result; end if;

  -- Media assets + ordered variant attachments
  select result_code, asset_id into v_result, v_asset
  from public.register_social_media_asset(
    v_org, v_brand, 'org/a/video-1.mp4', 'video/mp4', 'video', 1024, 1080, 1920, 15000, null, 'ready', null, null, null, 'human_created'
  );
  if v_result <> 'success' then raise exception 'asset register failed: %', v_result; end if;

  select result_code into v_result
  from public.register_social_media_asset(
    v_org, v_brand, 'bad', 'video/mp4', 'video', -1, null, null, null, null, 'ready', null, null, null, 'human_created'
  );
  if v_result <> 'invalid_input' then raise exception 'negative size must fail: %', v_result; end if;

  select result_code, asset_id into v_result, v_asset2
  from public.register_social_media_asset(
    v_org, v_brand, 'org/a/frame-1.jpg', 'image/jpeg', 'image', 200, 1080, 1920, null, null, 'ready', null, null, null, 'human_created'
  );
  if v_result <> 'success' then raise exception 'image asset failed: %', v_result; end if;

  select result_code into v_result
  from public.set_social_variant_media_attachments(
    v_org, v_variant,
    jsonb_build_array(
      jsonb_build_object('asset_id', v_asset, 'sort_order', 0, 'asset_role', 'primary'),
      jsonb_build_object('asset_id', v_asset2, 'sort_order', 1, 'asset_role', 'thumbnail')
    )
  );
  if v_result <> 'success' then raise exception 'variant media attach failed: %', v_result; end if;

  select result_code into v_result
  from public.set_social_variant_media_attachments(
    v_org, v_variant,
    jsonb_build_array(
      jsonb_build_object('asset_id', v_asset, 'sort_order', 0, 'asset_role', 'primary'),
      jsonb_build_object('asset_id', v_asset, 'sort_order', 1, 'asset_role', 'supporting')
    )
  );
  if v_result <> 'invalid_input' then raise exception 'duplicate asset attach must fail: %', v_result; end if;

  -- Cross-tenant media attach rejected
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code, content_id into v_result, v_content_b
  from public.create_social_content_item(v_org_b, v_brand_b, 'B Content');
  if v_result <> 'success' then raise exception 'org b content failed: %', v_result; end if;
  select result_code, variant_id into v_result, v_variant2
  from public.create_social_content_variant(v_org_b, v_content_b, 'linkedin', 'text', null, 'hello', null, null, null, null, '{}'::jsonb, 'draft');
  if v_result <> 'success' then raise exception 'org b variant failed: %', v_result; end if;
  select result_code into v_result
  from public.set_social_variant_media_attachments(
    v_org_b, v_variant2,
    jsonb_build_array(jsonb_build_object('asset_id', v_asset, 'sort_order', 0, 'asset_role', 'primary'))
  );
  if v_result <> 'invalid_input' then raise exception 'cross-tenant media must fail: %', v_result; end if;

  -- Archive content
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code into v_result from public.archive_social_content_item(v_org, v_content);
  if v_result <> 'success' then raise exception 'archive content failed: %', v_result; end if;
  select result_code into v_result
  from public.create_social_content_variant(v_org, v_content, 'x', 'text', null, 'nope', null, null, null, null, '{}'::jsonb, 'draft');
  if v_result <> 'conflict' then raise exception 'variant on archived content must conflict: %', v_result; end if;

  -- Runtime provider CHECK unchanged: only instagram in connection provider enum remains elsewhere
  if exists (
    select 1 from pg_constraint
    where conname = 'social_account_connections_provider_chk'
      and pg_get_constraintdef(oid) not like '%instagram%'
  ) then
    raise exception 'connection provider check unexpectedly changed';
  end if;

  raise notice 'SMM-B1.4 content live verification PASS';
end;
$$;

rollback;
