-- ENG-ONB-1H-A — Versioned organization onboarding state.
--
-- Schema-first rollout: NULL remains the grandfathered/not-enrolled state.
-- This migration classifies only rows carrying positive legacy-flow evidence
-- and enrolls only genuinely new owner-provisioned organizations into V2.

alter table public.organizations
  add column onboarding_flow_version smallint,
  add column onboarding_setup_ready_at timestamptz;

comment on column public.organizations.onboarding_flow_version is
  'Governed onboarding cohort: NULL = grandfathered/not enrolled, 1 = verified legacy flow, 2 = four-target flow.';
comment on column public.organizations.onboarding_setup_ready_at is
  'V2 setup-readiness timestamp. This is distinct from onboarding completion and remains server-authoritative.';

-- The legacy questionnaire columns are positive evidence of a legacy draft.
-- onboarding_completed_at is the authoritative positive evidence of a legacy
-- completion. team_size_band is intentionally excluded because it is shared by
-- the V2 journey. All ambiguous pre-cutover rows remain NULL.
update public.organizations
set onboarding_flow_version = 1
where onboarding_completed_at is not null
   or business_type is not null
   or primary_audience is not null
   or primary_offering is not null
   or primary_goal is not null;

alter table public.organizations
  add constraint organizations_onboarding_flow_version_check
    check (
      onboarding_flow_version is null
      or onboarding_flow_version in (1, 2)
    ),
  add constraint organizations_onboarding_setup_ready_requires_v2
    check (
      onboarding_setup_ready_at is null
      or onboarding_flow_version = 2
    ),
  add constraint organizations_v2_completion_requires_setup_ready
    check (
      onboarding_flow_version is distinct from 2
      or onboarding_completed_at is null
      or onboarding_setup_ready_at is not null
    );

-- The table historically granted authenticated users UPDATE on every column.
-- Preserve that access for every pre-existing column while excluding the two
-- new server-authoritative state fields.
revoke update on table public.organizations from authenticated;
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
  onboarding_completed_at,
  first_run_checklist_dismissed_at
) on table public.organizations to authenticated;

-- Replace the authoritative owner provisioning transaction. Replay branches
-- return before the INSERT and therefore never reclassify an existing org.
create or replace function public.complete_owner_self_registration(
  p_name text,
  p_slug text,
  p_timezone text default null,
  p_locale text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_intent_status text;
  v_intent_org uuid;
  v_name text;
  v_slug text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872001,
    pg_catalog.hashtext(v_user_id::text)
  );

  if not exists (
    select 1
    from auth.users as u
    where u.id = v_user_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'email verification required';
  end if;

  -- Lost-response / replay: preserve the existing organization's cohort.
  select om.organization_id
    into v_org_id
  from public.organization_members as om
  where om.user_id = v_user_id
    and om.status = 'active'
  order by om.created_at asc
  limit 1;

  if v_org_id is not null then
    update public.registration_intents as ri
    set
      status = 'completed',
      organization_id = coalesce(ri.organization_id, v_org_id),
      completed_at = coalesce(ri.completed_at, pg_catalog.now()),
      last_error_code = null,
      updated_at = pg_catalog.now()
    where ri.user_id = v_user_id
      and ri.status is distinct from 'completed';

    return v_org_id;
  end if;

  select ri.status, ri.organization_id
    into v_intent_status, v_intent_org
  from public.registration_intents as ri
  where ri.user_id = v_user_id;

  if v_intent_status is null then
    raise exception 'registration intent required';
  end if;

  if v_intent_status = 'completed' and v_intent_org is not null then
    return v_intent_org;
  end if;

  if v_intent_status <> 'pending' and v_intent_status <> 'failed' then
    raise exception 'registration intent not provisionable';
  end if;

  v_name := nullif(trim(both from coalesce(p_name, '')), '');
  v_slug := nullif(trim(both from coalesce(p_slug, '')), '');

  if v_name is null or v_slug is null then
    raise exception 'invalid organization identity';
  end if;

  if not exists (
    select 1 from public.profiles as p where p.id = v_user_id
  ) then
    raise exception 'profile does not exist for current user';
  end if;

  begin
    insert into public.organizations (
      name,
      slug,
      timezone,
      locale,
      created_by,
      onboarding_flow_version
    )
    values (
      v_name,
      v_slug,
      p_timezone,
      p_locale,
      v_user_id,
      2
    )
    returning id into v_org_id;

    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      v_org_id,
      v_user_id,
      'owner',
      'active',
      pg_catalog.now()
    );
  exception
    when unique_violation then
      raise exception 'organization slug already exists';
  end;

  update public.registration_intents
  set
    status = 'completed',
    organization_id = v_org_id,
    completed_at = pg_catalog.now(),
    last_error_code = null,
    updated_at = pg_catalog.now()
  where user_id = v_user_id;

  return v_org_id;
end;
$$;

comment on function public.complete_owner_self_registration(text, text, text, text) is
  'Owner self-registration provisioning. Creates V2 organizations atomically and preserves existing cohort classification on replay.';

revoke all on function public.complete_owner_self_registration(text, text, text, text) from public;
revoke all on function public.complete_owner_self_registration(text, text, text, text) from anon;
grant execute on function public.complete_owner_self_registration(text, text, text, text) to authenticated;
