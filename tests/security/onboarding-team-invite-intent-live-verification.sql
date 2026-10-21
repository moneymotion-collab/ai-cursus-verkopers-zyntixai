\set ON_ERROR_STOP on

begin;

do $$
declare
  v_org_id uuid := pg_catalog.gen_random_uuid();
  v_owner_user_id uuid := pg_catalog.gen_random_uuid();
  v_owner_member_id uuid := pg_catalog.gen_random_uuid();
  v_owner_email text := 'owner.team-intent@example.test';
  v_member_user_id uuid := pg_catalog.gen_random_uuid();
  v_member_email text := 'member.team-intent@example.test';
  v_tenant_b_id uuid := pg_catalog.gen_random_uuid();
  v_tenant_b_intent_id uuid;
  v_activity_id uuid;
  v_foundation_id uuid;
  v_context_version_id uuid;
  v_admin_id uuid;
  v_staff_id uuid;
  v_viewer_id uuid;
  v_revoked_id uuid;
  v_expired_id uuid;
  v_result jsonb;
  v_before_invitations bigint;
  v_before_deliveries bigint;
  v_before_events bigint;
  v_before_memberships bigint;
  v_before_assignments bigint;
  v_original_flow integer;
  v_original_team_size text;
  v_original_ready_at timestamptz;
  v_original_completed_at timestamptz;
  v_case text;
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_owner_user_id,
    'authenticated',
    'authenticated',
    v_owner_email,
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

  update public.profiles
  set display_name = 'Synthetic Team Intent Owner'
  where id = v_owner_user_id;

  insert into public.organizations (
    id,
    name,
    slug,
    created_by,
    onboarding_flow_version,
    team_size_band
  )
  values (
    v_org_id,
    'Synthetic Configured Team Intent Organization',
    'synthetic-team-intent-' || pg_catalog.replace(v_org_id::text, '-', ''),
    v_owner_user_id,
    2,
    '2_5'
  );

  insert into public.organization_members (
    id,
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_owner_member_id,
    v_org_id,
    v_owner_user_id,
    'owner',
    'active',
    pg_catalog.now()
  );

  select f.id
  into v_foundation_id
  from public.taxonomy_foundations as f
  where f.key = 'service'
    and f.lifecycle_status = 'active';

  select cv.id
  into v_context_version_id
  from public.context_packs as cp
  inner join public.context_pack_versions as cv
    on cv.pack_id = cp.id
    and cv.publication_status = 'published'
  inner join public.context_pack_readiness as cr
    on cr.version_id = cv.id
    and cr.readiness_status in (
      'context_ready',
      'beta_supported',
      'production_verified'
    )
  where cp.pack_key = 'foundation.service'
    and cp.lifecycle_status = 'active'
  order by cv.version_number desc
  limit 1;

  insert into public.organization_business_activities (
    organization_id,
    activity_key,
    display_name,
    status,
    is_primary,
    classification_kind,
    foundation_id
  )
  values (
    v_org_id,
    'primary_operating_model',
    'Agency & Business Services',
    'active',
    true,
    'foundation',
    v_foundation_id
  )
  returning id into v_activity_id;

  insert into public.organization_context_assignments (
    organization_id,
    business_activity_id,
    context_pack_version_id,
    status,
    source,
    actor_user_id,
    actor_member_id,
    reason
  )
  values (
    v_org_id,
    v_activity_id,
    v_context_version_id,
    'active',
    'onboarding',
    v_owner_user_id,
    v_owner_member_id,
    'ENG-ONB-1G-A1 synthetic live verification'
  );

  select
    o.onboarding_flow_version,
    o.team_size_band,
    o.onboarding_setup_ready_at,
    o.onboarding_completed_at
  into
    v_original_flow,
    v_original_team_size,
    v_original_ready_at,
    v_original_completed_at
  from public.organizations as o
  where o.id = v_org_id;

  select a.id
  into v_activity_id
  from public.organization_business_activities as a
  where a.organization_id = v_org_id
    and a.status = 'active'
    and a.is_primary = true
  limit 1;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_member_user_id,
    'authenticated',
    'authenticated',
    v_member_email,
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (v_org_id, v_member_user_id, 'staff', 'active', pg_catalog.now());

  insert into public.organizations (id, name, slug)
  values (
    v_tenant_b_id,
    'Synthetic Team Intent Tenant B',
    'synthetic-team-intent-b-' || pg_catalog.replace(v_tenant_b_id::text, '-', '')
  );

  insert into public.organization_onboarding_team_invite_intents (
    organization_id,
    email_normalized,
    role
  )
  values (v_tenant_b_id, 'tenant-b@example.test', 'viewer')
  returning id into v_tenant_b_intent_id;

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
    v_org_id,
    'pending-existing@example.test',
    'staff',
    'pending',
    v_owner_member_id,
    'synthetic-team-intent-pending-token-hash',
    pg_catalog.now() + interval '1 day'
  );

  insert into public.organization_invitations (
    organization_id,
    email_normalized,
    role,
    status,
    invited_by_member_id,
    revoked_at
  )
  values (
    v_org_id,
    'revoked-eligible@example.test',
    'viewer',
    'revoked',
    v_owner_member_id,
    pg_catalog.now()
  );

  insert into public.organization_invitations (
    organization_id,
    email_normalized,
    role,
    status,
    invited_by_member_id
  )
  values (
    v_org_id,
    'expired-eligible@example.test',
    'viewer',
    'expired',
    v_owner_member_id
  );

  select pg_catalog.count(*) into v_before_invitations
  from public.organization_invitations;
  select pg_catalog.count(*) into v_before_deliveries
  from private.organization_invitation_delivery_attempts;
  select pg_catalog.count(*) into v_before_events
  from public.organization_invitation_events;
  select pg_catalog.count(*) into v_before_memberships
  from public.organization_members;
  select pg_catalog.count(*) into v_before_assignments
  from public.organization_context_assignments;

  if pg_catalog.has_table_privilege(
    'authenticated',
    'public.organization_onboarding_team_invite_intents',
    'SELECT'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.organization_onboarding_team_invite_intents',
    'INSERT'
  ) or pg_catalog.has_table_privilege(
    'anon',
    'public.organization_onboarding_team_invite_intents',
    'SELECT'
  ) then
    raise exception 'Direct Team intent table privileges are too broad';
  end if;

  if pg_catalog.has_function_privilege(
    'anon',
    'public.create_organization_onboarding_team_invite_intent(uuid,text,text)',
    'EXECUTE'
  ) then
    raise exception 'Anonymous role can execute Team intent create RPC';
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('role', 'anon')::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'anonymous@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'NOT_AUTHENTICATED' then
    raise exception 'Anonymous mutation was not rejected: %', v_result;
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_member_user_id::text,
      'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_member_user_id::text,
    true
  );
  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'non-owner@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'Non-Owner mutation was not rejected: %', v_result;
  end if;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner_user_id::text,
      'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub',
    v_owner_user_id::text,
    true
  );

  v_result := public.list_organization_onboarding_team_invite_intents(v_org_id);
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Configured Owner list failed: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    '  Teammate.Admin@Example.Test  ',
    'admin'
  );
  if v_result ->> 'code' <> 'OK'
    or v_result #>> '{intent,email_normalized}' <> 'teammate.admin@example.test'
    or (v_result #>> '{intent,revision}')::bigint <> 1 then
    raise exception 'Admin create/normalization failed: %', v_result;
  end if;
  v_admin_id := (v_result #>> '{intent,id}')::uuid;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'teammate.staff@example.test',
    'staff'
  );
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Staff create failed: %', v_result;
  end if;
  v_staff_id := (v_result #>> '{intent,id}')::uuid;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'teammate.viewer@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Viewer create failed: %', v_result;
  end if;
  v_viewer_id := (v_result #>> '{intent,id}')::uuid;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'TEAMMATE.ADMIN@example.test',
    'admin'
  );
  if v_result ->> 'code' <> 'DUPLICATE_INTENT' then
    raise exception 'Normalized duplicate was not rejected: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'invalid-email',
    'viewer'
  );
  if v_result ->> 'code' <> 'INVALID_EMAIL' then
    raise exception 'Invalid email was not rejected: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    pg_catalog.repeat('a', 245) || '@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'INVALID_EMAIL' then
    raise exception 'Overlong email was not rejected: %', v_result;
  end if;

  foreach v_case in array array['owner', 'unknown'] loop
    v_result := public.create_organization_onboarding_team_invite_intent(
      v_org_id,
      'invalid-role-' || v_case || '@example.test',
      v_case
    );
    if v_result ->> 'code' <> 'INVALID_ROLE' then
      raise exception 'Invalid role % was not rejected: %', v_case, v_result;
    end if;
  end loop;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    pg_catalog.upper(v_owner_email),
    'viewer'
  );
  if v_result ->> 'code' <> 'SELF_INVITE' then
    raise exception 'Case-varied self invite was not rejected: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    pg_catalog.upper(v_member_email),
    'viewer'
  );
  if v_result ->> 'code' <> 'EXISTING_MEMBER' then
    raise exception 'Existing member collision was not rejected: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'PENDING-EXISTING@EXAMPLE.TEST',
    'staff'
  );
  if v_result ->> 'code' <> 'PENDING_INVITATION' then
    raise exception 'Pending invitation collision was not rejected: %', v_result;
  end if;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'revoked-eligible@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Revoked invitation should be eligible: %', v_result;
  end if;
  v_revoked_id := (v_result #>> '{intent,id}')::uuid;

  v_result := public.create_organization_onboarding_team_invite_intent(
    v_org_id,
    'expired-eligible@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Expired invitation should be eligible: %', v_result;
  end if;
  v_expired_id := (v_result #>> '{intent,id}')::uuid;

  v_result := public.update_organization_onboarding_team_invite_intent(
    v_org_id,
    v_admin_id,
    1,
    'updated.admin@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'OK'
    or (v_result #>> '{intent,revision}')::bigint <> 2 then
    raise exception 'Current revision update failed: %', v_result;
  end if;

  v_result := public.update_organization_onboarding_team_invite_intent(
    v_org_id,
    v_admin_id,
    1,
    'stale-overwrite@example.test',
    'admin'
  );
  if v_result ->> 'code' <> 'STALE_REVISION' then
    raise exception 'Stale update was not rejected: %', v_result;
  end if;
  if not exists (
    select 1
    from public.organization_onboarding_team_invite_intents as i
    where i.id = v_admin_id
      and i.email_normalized = 'updated.admin@example.test'
      and i.role = 'viewer'
      and i.revision = 2
  ) then
    raise exception 'Stale update changed current intent';
  end if;

  v_result := public.list_organization_onboarding_team_invite_intents(v_org_id);
  if v_result ->> 'code' <> 'OK'
    or pg_catalog.jsonb_array_length(v_result -> 'intents') <> 5 then
    raise exception 'Reload-authoritative list failed: %', v_result;
  end if;

  foreach v_case in array array[
    'v2_core_incomplete',
    'v2_context_required',
    'v2_ready',
    'v2_completed',
    'legacy',
    'grandfathered'
  ] loop
    if v_case = 'v2_core_incomplete' then
      update public.organizations set team_size_band = null where id = v_org_id;
    elsif v_case = 'v2_context_required' then
      update public.organization_business_activities
      set is_primary = false
      where id = v_activity_id;
    elsif v_case = 'v2_ready' then
      update public.organizations
      set onboarding_setup_ready_at = pg_catalog.now()
      where id = v_org_id;
    elsif v_case = 'v2_completed' then
      update public.organizations
      set onboarding_setup_ready_at = pg_catalog.now(),
          onboarding_completed_at = pg_catalog.now()
      where id = v_org_id;
    elsif v_case = 'legacy' then
      update public.organizations
      set onboarding_flow_version = 1
      where id = v_org_id;
    else
      update public.organizations
      set onboarding_flow_version = null
      where id = v_org_id;
    end if;

    v_result :=
      public.list_organization_onboarding_team_invite_intents(v_org_id);
    if v_result ->> 'code' <> 'INVALID_LIFECYCLE' then
      raise exception 'Lifecycle % was not rejected: %', v_case, v_result;
    end if;

    update public.organizations
    set onboarding_flow_version = v_original_flow,
        team_size_band = v_original_team_size,
        onboarding_setup_ready_at = v_original_ready_at,
        onboarding_completed_at = v_original_completed_at
    where id = v_org_id;
    update public.organization_business_activities
    set is_primary = true
    where id = v_activity_id;
  end loop;

  v_result := public.list_organization_onboarding_team_invite_intents(v_org_id);
  if v_result ->> 'code' <> 'OK' then
    raise exception 'v2_configured lifecycle was not restored: %', v_result;
  end if;

  v_result := public.list_organization_onboarding_team_invite_intents(v_tenant_b_id);
  if v_result ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'Cross-tenant list leaked authority: %', v_result;
  end if;
  v_result := public.create_organization_onboarding_team_invite_intent(
    v_tenant_b_id,
    'cross-tenant-create@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'Cross-tenant create leaked authority: %', v_result;
  end if;
  v_result := public.update_organization_onboarding_team_invite_intent(
    v_tenant_b_id,
    v_tenant_b_intent_id,
    1,
    'cross-tenant-update@example.test',
    'viewer'
  );
  if v_result ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'Cross-tenant update leaked authority: %', v_result;
  end if;
  v_result := public.delete_organization_onboarding_team_invite_intent(
    v_tenant_b_id,
    v_tenant_b_intent_id,
    1
  );
  if v_result ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'Cross-tenant delete leaked authority: %', v_result;
  end if;
  if not exists (
    select 1
    from public.organization_onboarding_team_invite_intents
    where id = v_tenant_b_intent_id
  ) then
    raise exception 'Cross-tenant mutation changed Tenant B row';
  end if;

  v_result := public.delete_organization_onboarding_team_invite_intent(
    v_org_id,
    v_admin_id,
    1
  );
  if v_result ->> 'code' <> 'STALE_REVISION' then
    raise exception 'Stale delete was not rejected: %', v_result;
  end if;

  v_result := public.delete_organization_onboarding_team_invite_intent(
    v_org_id,
    v_admin_id,
    2
  );
  if v_result ->> 'code' <> 'OK' then
    raise exception 'Current delete failed: %', v_result;
  end if;

  foreach v_admin_id in array array[
    v_staff_id,
    v_viewer_id,
    v_revoked_id,
    v_expired_id
  ] loop
    v_result := public.delete_organization_onboarding_team_invite_intent(
      v_org_id,
      v_admin_id,
      1
    );
    if v_result ->> 'code' <> 'OK' then
      raise exception 'Intent cleanup delete failed: %', v_result;
    end if;
  end loop;

  if exists (
    select 1
    from public.organization_onboarding_team_invite_intents
    where organization_id = v_org_id
  ) then
    raise exception 'Delete contract left Team intents behind';
  end if;

  if (select pg_catalog.count(*) from public.organization_invitations)
      <> v_before_invitations
    or (
      select pg_catalog.count(*)
      from private.organization_invitation_delivery_attempts
    ) <> v_before_deliveries
    or (select pg_catalog.count(*) from public.organization_invitation_events)
      <> v_before_events
    or (select pg_catalog.count(*) from public.organization_members)
      <> v_before_memberships
    or (
      select pg_catalog.count(*)
      from public.organization_context_assignments
    ) <> v_before_assignments then
    raise exception 'Team intent operations changed invitation, delivery, event, membership, or Context state';
  end if;

  if not exists (
    select 1
    from public.organizations
    where id = v_org_id
      and onboarding_flow_version = v_original_flow
      and team_size_band = v_original_team_size
      and onboarding_setup_ready_at is not distinct from v_original_ready_at
      and onboarding_completed_at is not distinct from v_original_completed_at
  ) then
    raise exception 'Delete/lifecycle verification changed organization authority';
  end if;

  raise notice 'ENG-ONB-1G-A1 LIVE PASS: 17 rejection/authorization checks; 5 creates; 1 update; 5 deletes; 0 invitation side effects';
end;
$$;

rollback;
