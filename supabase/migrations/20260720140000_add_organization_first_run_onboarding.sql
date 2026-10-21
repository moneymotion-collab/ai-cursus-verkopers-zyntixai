-- B1.2 — First-run onboarding data foundation on organizations
--
-- Additive only: existing organization rows remain valid with NULL onboarding fields.
-- Completion is authoritative via onboarding_completed_at (set by owner-only RPC).
-- Prefer text + CHECK (repository convention; no Postgres enums).

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column business_type text,
  add column primary_audience text,
  add column primary_offering text,
  add column primary_goal text,
  add column team_size_band text,
  add column onboarding_completed_at timestamptz,
  add column first_run_checklist_dismissed_at timestamptz;

comment on column public.organizations.business_type is
  'B1.2 stable business-type value; required before onboarding completion.';
comment on column public.organizations.primary_audience is
  'B1.2 stable primary-audience value; required before onboarding completion.';
comment on column public.organizations.primary_offering is
  'B1.2 stable primary offering value; required before onboarding completion.';
comment on column public.organizations.primary_goal is
  'B1.2 stable primary product goal; required before onboarding completion.';
comment on column public.organizations.team_size_band is
  'B1.2 optional team-size band; not required for completion.';
comment on column public.organizations.onboarding_completed_at is
  'Authoritative first-run product onboarding completion timestamp; null means incomplete.';
comment on column public.organizations.first_run_checklist_dismissed_at is
  'Optional first-value checklist dismiss timestamp; unused by UI until a later B1 phase.';

alter table public.organizations
  add constraint organizations_business_type_check
    check (
      business_type is null
      or business_type in (
        'course_seller',
        'trading_mentor',
        'business_coach',
        'online_coach',
        'membership_owner',
        'other'
      )
    ),
  add constraint organizations_primary_audience_check
    check (
      primary_audience is null
      or primary_audience in (
        'beginners',
        'professionals',
        'business_owners',
        'students',
        'mixed',
        'other'
      )
    ),
  add constraint organizations_primary_offering_check
    check (
      primary_offering is null
      or primary_offering in (
        'online_course',
        'coaching_program',
        'mentorship',
        'community',
        'membership',
        'hybrid',
        'other'
      )
    ),
  add constraint organizations_primary_goal_check
    check (
      primary_goal is null
      or primary_goal in (
        'organize_leads',
        'convert_more',
        'track_customers',
        'save_time',
        'other'
      )
    ),
  add constraint organizations_team_size_band_check
    check (
      team_size_band is null
      or team_size_band in (
        'solo',
        '2_5',
        '6_20',
        '21_plus'
      )
    ),
  add constraint organizations_onboarding_complete_requires_fields
    check (
      onboarding_completed_at is null
      or (
        business_type is not null
        and primary_audience is not null
        and primary_offering is not null
        and primary_goal is not null
        and char_length(trim(name)) > 0
      )
    );

-- ---------------------------------------------------------------------------
-- Owner-only onboarding apply (draft | complete)
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

  -- Serialize per organization to keep concurrent completes idempotent.
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

  -- Draft: only overwrite fields that were explicitly provided (null arg = leave unchanged).
  -- Complete: require full required set after merge.
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
  'B1.2 owner-only draft/complete onboarding apply. Derives caller from auth.uid(); preserves first onboarding_completed_at.';

revoke all on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) from public;
revoke all on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) from anon;
grant execute on function public.apply_organization_onboarding(
  uuid, text, text, text, text, text, text, text, text, boolean
) to authenticated;
