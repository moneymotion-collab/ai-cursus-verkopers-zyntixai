-- PX2.1 — Owner self-registration: intents + hardened owner provisioning
--
-- Security goals:
-- 1. Persist resumable registration intent per Auth user (one row).
-- 2. Provision org + owner membership only via complete_owner_self_registration.
-- 3. Block unlimited org creation via the legacy create_organization_with_owner grant.
-- 4. Keep SECURITY DEFINER search_path empty; role is always constant 'owner'.

-- ---------------------------------------------------------------------------
-- registration_intents
-- ---------------------------------------------------------------------------

create table public.registration_intents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  company_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  last_error_code text,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint registration_intents_display_name_not_empty
    check (char_length(trim(display_name)) > 0),
  constraint registration_intents_company_name_not_empty
    check (char_length(trim(company_name)) > 0),
  constraint registration_intents_completed_has_org
    check (
      status <> 'completed'
      or (organization_id is not null and completed_at is not null)
    )
);

comment on table public.registration_intents is
  'PX2.1 resumable owner self-registration intent. Not an authorization source for roles or org join.';
comment on column public.registration_intents.display_name is
  'Non-privileged profile display name candidate; re-validated server-side before use.';
comment on column public.registration_intents.company_name is
  'Non-privileged organization display name candidate; re-validated server-side before use.';
comment on column public.registration_intents.status is
  'pending → completed|failed. completed means org+owner membership exist.';

create trigger registration_intents_set_updated_at
  before update on public.registration_intents
  for each row
  execute function public.set_updated_at();

alter table public.registration_intents enable row level security;

create policy registration_intents_select_own
  on public.registration_intents
  for select
  to authenticated
  using (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for authenticated: mutations are SECURITY DEFINER only.
grant select on public.registration_intents to authenticated;

-- ---------------------------------------------------------------------------
-- Seed intent from Auth metadata on new user (profile already created here).
-- Does NOT create organizations or memberships.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_company_name text;
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  v_display_name := nullif(trim(both from coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  v_company_name := nullif(trim(both from coalesce(new.raw_user_meta_data->>'company_name', '')), '');

  if v_display_name is not null and v_company_name is not null then
    insert into public.registration_intents (
      user_id,
      display_name,
      company_name,
      status
    )
    values (
      new.id,
      v_display_name,
      v_company_name,
      'pending'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates profile and optional pending registration_intent from non-privileged signup metadata. Never creates organizations or memberships.';

-- ---------------------------------------------------------------------------
-- Upsert intent for authenticated resume paths (server orchestration).
-- ---------------------------------------------------------------------------

create or replace function public.upsert_registration_intent(
  p_display_name text,
  p_company_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_display_name text;
  v_company_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  v_display_name := nullif(trim(both from coalesce(p_display_name, '')), '');
  v_company_name := nullif(trim(both from coalesce(p_company_name, '')), '');

  if v_display_name is null or v_company_name is null then
    raise exception 'invalid registration intent';
  end if;

  if not exists (
    select 1 from public.profiles as p where p.id = v_user_id
  ) then
    raise exception 'profile does not exist for current user';
  end if;

  insert into public.registration_intents (
    user_id,
    display_name,
    company_name,
    status
  )
  values (
    v_user_id,
    v_display_name,
    v_company_name,
    'pending'
  )
  on conflict (user_id) do update
    set
      display_name = excluded.display_name,
      company_name = excluded.company_name,
      last_error_code = null,
      updated_at = pg_catalog.now()
    where public.registration_intents.status = 'pending';
end;
$$;

revoke all on function public.upsert_registration_intent(text, text) from public;
revoke all on function public.upsert_registration_intent(text, text) from anon;
grant execute on function public.upsert_registration_intent(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Harden legacy bootstrap RPC: no second org; idempotent if already member.
-- Still revoked from authenticated below — kept for internal compatibility.
-- ---------------------------------------------------------------------------

create or replace function public.create_organization_with_owner(
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
  v_name text;
  v_slug text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = v_user_id
  ) then
    raise exception 'profile does not exist for current user';
  end if;

  select om.organization_id
    into v_org_id
  from public.organization_members as om
  where om.user_id = v_user_id
    and om.status = 'active'
  order by om.created_at asc
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  v_name := nullif(trim(both from coalesce(p_name, '')), '');
  v_slug := nullif(trim(both from coalesce(p_slug, '')), '');

  if v_name is null or v_slug is null then
    raise exception 'invalid organization identity';
  end if;

  insert into public.organizations (name, slug, timezone, locale, created_by)
  values (
    v_name,
    v_slug,
    p_timezone,
    p_locale,
    v_user_id
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

  return v_org_id;
exception
  when unique_violation then
    raise exception 'organization slug already exists';
end;
$$;

comment on function public.create_organization_with_owner(text, text, text, text) is
  'Internal-capable org+owner bootstrap. Idempotent when caller already has an active membership. EXECUTE revoked from authenticated in PX2.1.';

revoke all on function public.create_organization_with_owner(text, text, text, text) from public;
revoke all on function public.create_organization_with_owner(text, text, text, text) from anon;
revoke all on function public.create_organization_with_owner(text, text, text, text) from authenticated;

-- ---------------------------------------------------------------------------
-- Public provisioning RPC for owner self-registration (requires pending intent)
-- ---------------------------------------------------------------------------

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

  -- Serialize concurrent provisioning for the same Auth user (transaction-scoped).
  -- Prevents two parallel calls with distinct slugs from creating two organizations.
  perform pg_catalog.pg_advisory_xact_lock(
    872001,
    pg_catalog.hashtext(v_user_id::text)
  );

  -- Defense in depth: never provision before email confirmation (app also gates this).
  if not exists (
    select 1
    from auth.users as u
    where u.id = v_user_id
      and u.email_confirmed_at is not null
  ) then
    raise exception 'email verification required';
  end if;

  -- Lost-response / replay: already provisioned → return existing org.
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
    insert into public.organizations (name, slug, timezone, locale, created_by)
    values (
      v_name,
      v_slug,
      p_timezone,
      p_locale,
      v_user_id
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
      -- Subtransaction rolls back org/membership inserts. Intent stays pending/failed
      -- (do not UPDATE intent here then re-raise: the raise would abort that UPDATE too).
      -- Caller retries with a new slug; membership guard + advisory lock keep exactly-one.
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
  'PX2.1 owner self-registration provisioning. Requires pending/failed intent; creates exactly one org + owner membership atomically; idempotent on replay.';

revoke all on function public.complete_owner_self_registration(text, text, text, text) from public;
revoke all on function public.complete_owner_self_registration(text, text, text, text) from anon;
grant execute on function public.complete_owner_self_registration(text, text, text, text) to authenticated;
