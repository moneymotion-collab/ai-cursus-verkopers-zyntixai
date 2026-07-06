-- ZyntixAI foundation: triggers, authorization helpers, and bootstrap functions

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row
  execute function public.set_updated_at();

create schema if not exists private;

comment on schema private is 'Internal helpers for RLS; not exposed via PostgREST.';

revoke all on schema private from public;
revoke all on schema private from anon;
revoke create on schema private from authenticated;

grant usage on schema private to authenticated;

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

comment on function private.is_org_member(uuid) is
  'True when auth.uid() is an active member of the organization.';

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_member(uuid) from anon;
grant execute on function private.is_org_member(uuid) to authenticated;

create or replace function private.has_org_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = any (p_roles)
  );
$$;

comment on function private.has_org_role(uuid, text[]) is
  'True when auth.uid() has one of the given active roles in the organization.';

revoke all on function private.has_org_role(uuid, text[]) from public;
revoke all on function private.has_org_role(uuid, text[]) from anon;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

create or replace function private.guard_org_member_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'cannot change organization_id on membership';
  end if;

  if old.user_id is distinct from new.user_id then
    raise exception 'cannot change user_id on membership';
  end if;

  if old.user_id = auth.uid() then
    if old.role is distinct from new.role then
      raise exception 'cannot change own role';
    end if;

    if old.status is distinct from new.status then
      if not (old.status = 'invited' and new.status = 'active') then
        raise exception 'cannot change own membership status except accepting an invite';
      end if;
    end if;
  end if;

  if new.role = 'owner' and old.role is distinct from new.role then
    if not private.has_org_role(new.organization_id, array['owner']::text[]) then
      raise exception 'only owners can assign owner role';
    end if;
  end if;

  if new.role = 'admin' and old.role is distinct from new.role then
    if not private.has_org_role(new.organization_id, array['owner']::text[]) then
      raise exception 'only owners can assign admin role';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_org_member_update() from public;
revoke all on function private.guard_org_member_update() from anon;
revoke all on function private.guard_org_member_update() from authenticated;

create trigger organization_members_guard_update
  before update on public.organization_members
  for each row
  execute function private.guard_org_member_update();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a minimal profile row when a new auth user is registered.';

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

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

  insert into public.organizations (name, slug, timezone, locale, created_by)
  values (
    trim(p_name),
    trim(p_slug),
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
  'Atomically creates an organization and the first active owner membership for auth.uid().';

revoke all on function public.create_organization_with_owner(text, text, text, text) from public;
revoke all on function public.create_organization_with_owner(text, text, text, text) from anon;
grant execute on function public.create_organization_with_owner(text, text, text, text) to authenticated;
