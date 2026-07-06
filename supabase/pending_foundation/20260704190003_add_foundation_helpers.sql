-- ZyntixAI foundation: shared triggers and tenant authorization helpers

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
grant execute on function public.set_updated_at() to authenticated;

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

-- Private schema keeps helpers out of the exposed API surface.
create schema if not exists private;

comment on schema private is 'Internal helpers for RLS; not exposed via PostgREST.';

revoke all on schema private from public;
revoke all on schema private from anon;
revoke create on schema private from authenticated;

grant usage on schema private to authenticated;

-- Security definer bypasses RLS on organization_members to prevent policy recursion.
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
  'True when auth.uid() is an active member of the organization. Uses security definer to avoid RLS recursion.';

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

-- Defense in depth: block privilege escalation even if a policy is misconfigured.
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
grant execute on function private.guard_org_member_update() to authenticated;

create trigger organization_members_guard_update
  before update on public.organization_members
  for each row
  execute function private.guard_org_member_update();
