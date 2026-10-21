-- Social versioning / review / approval / calendar live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs. BEGIN/ROLLBACK. Requires:
--   select set_config('zyntix.allow_social_workflow_rpc_live_verify', 'on', true);

begin;
select set_config('zyntix.allow_social_workflow_rpc_live_verify', 'on', true);

do $$
declare
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa851';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb851';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa951';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa953';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa954';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb951';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab51';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab53';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaab54';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb51';
  v_brand uuid;
  v_workspace uuid;
  v_brand_b uuid;
  v_content uuid;
  v_variant uuid;
  v_version1 uuid;
  v_version2 uuid;
  v_review uuid;
  v_decision uuid;
  v_slot uuid;
  v_n integer;
  v_result text;
  v_ready boolean;
begin
  if current_setting('zyntix.allow_social_workflow_rpc_live_verify', true) is distinct from 'on' then
    raise exception 'Refusing workflow live verify without opt-in GUC';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'w-owner@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'w-staff@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'w-viewer@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'w-b@example.test', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.organizations (id, name, slug, status) values
    (v_org, 'Workflow Org', 'workflow-org-a', 'active'),
    (v_org_b, 'Workflow Org B', 'workflow-org-b', 'active');
  insert into public.organization_members (id, organization_id, user_id, role, status) values
    (v_member_owner, v_org, v_user_owner, 'owner', 'active'),
    (v_member_staff, v_org, v_user_staff, 'staff', 'active'),
    (v_member_viewer, v_org, v_user_viewer, 'viewer', 'active'),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active');

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  select brand_id, workspace_id into v_brand, v_workspace
  from public.create_social_workspace(v_org, 'Workflow Brand', null);
  if v_brand is null then raise exception 'workspace create failed'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select brand_id into v_brand_b from public.create_social_workspace(v_org_b, 'Org B Brand', null);

  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);

  select result_code, content_id into v_result, v_content
  from public.create_social_content_item(v_org, v_brand, 'Workflow story');
  if v_result <> 'success' then raise exception 'content create failed: %', v_result; end if;

  select result_code, variant_id into v_result, v_variant
  from public.create_social_content_variant(
    v_org, v_content, 'instagram', 'short_video', 'Hook', 'caption', null, null, null, null, '{}'::jsonb, 'draft'
  );
  if v_result <> 'success' then raise exception 'variant create failed: %', v_result; end if;

  select result_code, version_id, version_number into v_result, v_version1, v_n
  from public.create_social_content_variant_version(v_org, v_variant, 'v1');
  if v_result <> 'success' or v_n <> 1 then raise exception 'version1 failed: % %', v_result, v_n; end if;

  -- Viewer cannot approve
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_viewer::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_viewer::text, true);
  select result_code into v_result
  from public.submit_social_approval_decision(v_org, v_version1, 'approved', null, null);
  if v_result <> 'forbidden' then raise exception 'viewer approve must be forbidden: %', v_result; end if;

  -- Staff can request review + approve (self-approval allowed)
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code, review_request_id into v_result, v_review
  from public.create_social_review_request(v_org, v_version1, now() + interval '2 days', 'internal');
  if v_result <> 'success' then raise exception 'review request failed: %', v_result; end if;

  select result_code into v_result from public.add_social_review_comment(v_org, v_review, 'Looks good');
  if v_result <> 'success' then raise exception 'comment failed: %', v_result; end if;

  select result_code, decision_id into v_result, v_decision
  from public.submit_social_approval_decision(v_org, v_version1, 'approved', 'ship it', v_review);
  if v_result <> 'success' then raise exception 'approve failed: %', v_result; end if;

  select result_code, schedule_slot_id into v_result, v_slot
  from public.create_social_content_schedule_slot(
    v_org, v_version1, timestamptz '2026-08-20 12:00:00+02', 'Europe/Amsterdam'
  );
  if v_result <> 'success' then raise exception 'schedule create failed: %', v_result; end if;

  select result_code, workflow_ready into v_result, v_ready
  from public.evaluate_social_variant_version_workflow_readiness(v_org, v_version1);
  if v_result <> 'success' or v_ready is not true then
    raise exception 'version1 should be workflow_ready: % %', v_result, v_ready;
  end if;

  -- New version does not inherit approval; open review on old path superseded
  select result_code, version_id, version_number into v_result, v_version2, v_n
  from public.create_social_content_variant_version(v_org, v_variant, 'v2 edit');
  if v_result <> 'success' or v_n <> 2 then raise exception 'version2 failed: % %', v_result, v_n; end if;

  select result_code, workflow_ready into v_result, v_ready
  from public.evaluate_social_variant_version_workflow_readiness(v_org, v_version2);
  if v_result <> 'success' or v_ready is not false then
    raise exception 'version2 must not be workflow_ready without approval: % %', v_result, v_ready;
  end if;

  -- Schedule remains bound to version1 (no silent retarget)
  if exists (
    select 1 from public.social_content_schedule_slots
    where organization_id = v_org and id = v_slot and variant_version_id <> v_version1
  ) then
    raise exception 'schedule must remain bound to version1';
  end if;

  select result_code into v_result
  from public.move_social_content_schedule_slot(
    v_org, v_slot, timestamptz '2026-08-21 09:00:00+02', 'Europe/Amsterdam'
  );
  if v_result <> 'success' then raise exception 'schedule move failed: %', v_result; end if;

  -- Cross-tenant schedule rejected
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_b::text, true);
  select result_code into v_result
  from public.create_social_content_schedule_slot(
    v_org_b, v_version1, timestamptz '2026-08-22 12:00:00+02', 'Europe/Amsterdam'
  );
  if v_result not in ('not_found', 'forbidden', 'invalid_input') then
    raise exception 'cross-tenant schedule must fail: %', v_result;
  end if;

  -- Client context review rejected in B1.5
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  select result_code into v_result
  from public.create_social_review_request(v_org, v_version2, null, 'client');
  if v_result <> 'invalid_input' then raise exception 'client review must be deferred: %', v_result; end if;

  -- Immutability of version
  begin
    update public.social_content_variant_versions set caption = 'hacked' where id = v_version1;
    raise exception 'version update must be blocked';
  exception when raise_exception then
    if sqlerrm not like '%immutable%' then raise; end if;
  end;

  raise notice 'SMM-B1.5 workflow live verification PASS';
end;
$$;

rollback;
