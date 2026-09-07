-- ENG-ONB-1H-C — Database authority for V2 onboarding transitions.
--
-- This migration is deploy-safe before application cutover:
-- - V1 retains its legacy questionnaire completion requirements.
-- - NULL-version organizations remain historically compatible.
-- - V2 completion depends on Setup Ready, not legacy questionnaire fields.
-- - Lifecycle timestamps are writable only through governed functions.

-- ---------------------------------------------------------------------------
-- Version-aware completion integrity
-- ---------------------------------------------------------------------------

alter table public.organizations
  drop constraint organizations_onboarding_complete_requires_fields,
  add constraint organizations_onboarding_complete_requires_fields
    check (
      onboarding_completed_at is null
      or onboarding_flow_version is null
      or (
        onboarding_flow_version = 1
        and business_type is not null
        and primary_audience is not null
        and primary_offering is not null
        and primary_goal is not null
        and char_length(trim(name)) > 0
      )
      or (
        onboarding_flow_version = 2
        and onboarding_setup_ready_at is not null
      )
    );

-- ---------------------------------------------------------------------------
-- Lifecycle-column privilege boundary
-- ---------------------------------------------------------------------------

-- Remove any table-wide UPDATE capability, then preserve the exact unrelated
-- organization columns previously available to authenticated Owner/Admin rows.
-- SECURITY DEFINER provisioning and transition functions retain their authority.
revoke update on table public.organizations from authenticated;
revoke update (
  onboarding_flow_version,
  onboarding_setup_ready_at,
  onboarding_completed_at
) on table public.organizations from authenticated;
grant update (
  id,
  name,
  slug,
  status,
  timezone,
  locale,
  created_by,
  created_at,
  updated_at,
  archived_at,
  business_type,
  primary_audience,
  primary_offering,
  primary_goal,
  team_size_band,
  first_run_checklist_dismissed_at
) on table public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- Legacy V1 onboarding apply, isolated from V2 completion
-- ---------------------------------------------------------------------------

create or replace function public.apply_organization_onboarding(
  p_organization_id uuid,
  p_mode text,
  p_organization_name text default null,
  p_display_name text default null,
  p_business_type text default null,
  p_primary_audience text default null,
  p_primary_offering text default null,
  p_primary_goal text default null,
  p_team_size_band text default null,
  p_clear_team_size_band boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_mode text;
  v_org public.organizations%rowtype;
  v_name text;
  v_display_name text;
  v_business_type text;
  v_primary_audience text;
  v_primary_offering text;
  v_primary_goal text;
  v_team_size_band text;
  v_completed_at timestamptz;
  v_profile_display text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;

  v_mode := nullif(trim(both from coalesce(p_mode, '')), '');
  if v_mode is null or v_mode not in ('draft', 'complete') then
    raise exception 'invalid onboarding mode' using errcode = 'P0001';
  end if;

  if p_organization_id is null then
    raise exception 'organization required' using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872002,
    pg_catalog.hashtext(p_organization_id::text)
  );

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = v_user_id
      and om.status = 'active'
      and om.role = 'owner'
  ) then
    raise exception 'owner membership required' using errcode = 'P0001';
  end if;

  select *
    into v_org
  from public.organizations as o
  where o.id = p_organization_id
  for update;

  if not found then
    raise exception 'organization not found' using errcode = 'P0001';
  end if;

  if v_mode = 'complete' and v_org.onboarding_flow_version = 2 then
    raise exception 'legacy onboarding cannot complete V2 organizations'
      using errcode = 'P0001';
  end if;

  if p_organization_name is not null then
    v_name := nullif(trim(both from p_organization_name), '');
    if v_name is null then
      raise exception 'invalid organization name' using errcode = 'P0001';
    end if;
    if char_length(v_name) > 100 then
      raise exception 'invalid organization name' using errcode = 'P0001';
    end if;
  else
    v_name := v_org.name;
  end if;

  if p_business_type is not null then
    v_business_type := nullif(trim(both from p_business_type), '');
  else
    v_business_type := v_org.business_type;
  end if;

  if p_primary_audience is not null then
    v_primary_audience := nullif(trim(both from p_primary_audience), '');
  else
    v_primary_audience := v_org.primary_audience;
  end if;

  if p_primary_offering is not null then
    v_primary_offering := nullif(trim(both from p_primary_offering), '');
  else
    v_primary_offering := v_org.primary_offering;
  end if;

  if p_primary_goal is not null then
    v_primary_goal := nullif(trim(both from p_primary_goal), '');
  else
    v_primary_goal := v_org.primary_goal;
  end if;

  if p_clear_team_size_band then
    v_team_size_band := null;
  elsif p_team_size_band is not null then
    v_team_size_band := nullif(trim(both from p_team_size_band), '');
  else
    v_team_size_band := v_org.team_size_band;
  end if;

  if p_display_name is not null then
    v_display_name := nullif(trim(both from p_display_name), '');
    if v_display_name is null then
      raise exception 'invalid display name' using errcode = 'P0001';
    end if;
    if char_length(v_display_name) > 80 then
      raise exception 'invalid display name' using errcode = 'P0001';
    end if;

    update public.profiles as p
    set display_name = v_display_name
    where p.id = v_user_id;
  end if;

  select nullif(trim(both from coalesce(p.display_name, '')), '')
    into v_profile_display
  from public.profiles as p
  where p.id = v_user_id;

  if v_mode = 'complete' then
    if v_profile_display is null then
      raise exception 'display name required' using errcode = 'P0001';
    end if;
    if v_name is null or char_length(trim(v_name)) = 0 then
      raise exception 'organization name required' using errcode = 'P0001';
    end if;
    if v_business_type is null
      or v_primary_audience is null
      or v_primary_offering is null
      or v_primary_goal is null then
      raise exception 'onboarding fields incomplete' using errcode = 'P0001';
    end if;
  end if;

  v_completed_at := v_org.onboarding_completed_at;
  if v_mode = 'complete' and v_completed_at is null then
    v_completed_at := pg_catalog.now();
  end if;

  update public.organizations as o
  set
    name = v_name,
    business_type = v_business_type,
    primary_audience = v_primary_audience,
    primary_offering = v_primary_offering,
    primary_goal = v_primary_goal,
    team_size_band = v_team_size_band,
    onboarding_completed_at = v_completed_at
  where o.id = p_organization_id;

  select *
    into v_org
  from public.organizations as o
  where o.id = p_organization_id;

  return jsonb_build_object(
    'organization_id', v_org.id,
    'name', v_org.name,
    'business_type', v_org.business_type,
    'primary_audience', v_org.primary_audience,
    'primary_offering', v_org.primary_offering,
    'primary_goal', v_org.primary_goal,
    'team_size_band', v_org.team_size_band,
    'onboarding_completed_at', v_org.onboarding_completed_at,
    'first_run_checklist_dismissed_at', v_org.first_run_checklist_dismissed_at,
    'display_name', v_profile_display,
    'is_complete', v_org.onboarding_completed_at is not null
  );
end;
$$;

comment on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) is
  'V1 legacy owner-only draft/complete onboarding apply. V2 completion is explicitly rejected.';

revoke all on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) from public;
revoke all on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) from anon;
grant execute on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- V2 Setup Ready transition
-- ---------------------------------------------------------------------------

create or replace function public.mark_organization_onboarding_setup_ready(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actor_member_id uuid;
  v_org public.organizations%rowtype;
  v_display_name text;
  v_pack_key text;
  v_ready_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHENTICATED'
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872002,
    pg_catalog.hashtext(p_organization_id::text)
  );

  -- Lock the authoritative membership row so role revocation cannot race the
  -- privileged lifecycle write in this transaction.
  select om.id
    into v_actor_member_id
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
    and om.status = 'active'
    and om.role = 'owner'
  limit 1
  for update;

  if v_actor_member_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHORIZED'
    );
  end if;

  select *
    into v_org
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  if v_org.onboarding_flow_version is distinct from 2 then
    return jsonb_build_object(
      'ok', false,
      'code', 'WRONG_FLOW_VERSION'
    );
  end if;

  if v_org.onboarding_completed_at is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ALREADY_COMPLETED',
      'organization_id', v_org.id,
      'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
      'onboarding_completed_at', v_org.onboarding_completed_at
    );
  end if;

  if v_org.onboarding_setup_ready_at is not null then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'state', 'ready',
      'organization_id', v_org.id,
      'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
      'onboarding_completed_at', v_org.onboarding_completed_at
    );
  end if;

  select nullif(trim(both from coalesce(p.display_name, '')), '')
    into v_display_name
  from public.profiles as p
  where p.id = v_user_id
  for share;

  if v_display_name is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'DISPLAY_NAME_REQUIRED'
    );
  end if;

  if nullif(trim(both from coalesce(v_org.name, '')), '') is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NAME_REQUIRED'
    );
  end if;

  if v_org.team_size_band is null
    or v_org.team_size_band not in ('solo', '2_5', '6_20', '21_plus') then
    return jsonb_build_object(
      'ok', false,
      'code', 'TEAM_SIZE_REQUIRED'
    );
  end if;

  -- DB trust boundary for "configured": the same immutable active primary
  -- Activity + active pinned published Context version used by the resolver,
  -- restricted to the four governed V2 target packs and accepted readiness.
  select p.pack_key
    into v_pack_key
  from public.organization_business_activities as a
  inner join public.organization_context_assignments as c
    on c.organization_id = a.organization_id
    and c.business_activity_id = a.id
    and c.status = 'active'
  inner join public.context_pack_versions as v
    on v.id = c.context_pack_version_id
    and v.publication_status = 'published'
  inner join public.context_packs as p
    on p.id = v.pack_id
    and p.lifecycle_status = 'active'
  inner join public.context_pack_readiness as r
    on r.version_id = v.id
    and r.readiness_status in (
      'context_ready',
      'beta_supported',
      'production_verified'
    )
  where a.organization_id = p_organization_id
    and a.status = 'active'
    and a.is_primary = true
    and p.pack_key in (
      'niche.online-course-business',
      'foundation.knowledge',
      'foundation.service',
      'foundation.field-operations',
      'foundation.product-operations'
    )
  limit 1
  for share of a, c, v, p, r;

  if v_pack_key is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONFIGURED_CONTEXT_REQUIRED'
    );
  end if;

  v_ready_at := pg_catalog.now();

  update public.organizations as o
  set onboarding_setup_ready_at = v_ready_at
  where o.id = p_organization_id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'state', 'ready',
    'organization_id', v_org.id,
    'resolved_pack', v_pack_key,
    'onboarding_setup_ready_at', v_ready_at,
    'onboarding_completed_at', null
  );
end;
$$;

comment on function public.mark_organization_onboarding_setup_ready(uuid) is
  'Owner-only atomic V2 Setup Ready transition. Validates core identity, team size, and governed persisted Context assignment.';

revoke all on function public.mark_organization_onboarding_setup_ready(uuid) from public;
revoke all on function public.mark_organization_onboarding_setup_ready(uuid) from anon;
grant execute on function public.mark_organization_onboarding_setup_ready(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- V2 Complete transition
-- ---------------------------------------------------------------------------

create or replace function public.complete_organization_v2_onboarding(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actor_member_id uuid;
  v_org public.organizations%rowtype;
  v_completed_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHENTICATED'
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872002,
    pg_catalog.hashtext(p_organization_id::text)
  );

  select om.id
    into v_actor_member_id
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
    and om.status = 'active'
    and om.role = 'owner'
  limit 1
  for update;

  if v_actor_member_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHORIZED'
    );
  end if;

  select *
    into v_org
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  if v_org.onboarding_flow_version is distinct from 2 then
    return jsonb_build_object(
      'ok', false,
      'code', 'WRONG_FLOW_VERSION'
    );
  end if;

  if v_org.onboarding_setup_ready_at is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SETUP_NOT_READY'
    );
  end if;

  if v_org.onboarding_completed_at is not null then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'state', 'completed',
      'organization_id', v_org.id,
      'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
      'onboarding_completed_at', v_org.onboarding_completed_at
    );
  end if;

  v_completed_at := pg_catalog.now();

  update public.organizations as o
  set onboarding_completed_at = v_completed_at
  where o.id = p_organization_id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'state', 'completed',
    'organization_id', v_org.id,
    'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
    'onboarding_completed_at', v_completed_at
  );
end;
$$;

comment on function public.complete_organization_v2_onboarding(uuid) is
  'Owner-only atomic V2 completion transition. Requires persisted Setup Ready and preserves both first-success timestamps.';

revoke all on function public.complete_organization_v2_onboarding(uuid) from public;
revoke all on function public.complete_organization_v2_onboarding(uuid) from anon;
grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated;
