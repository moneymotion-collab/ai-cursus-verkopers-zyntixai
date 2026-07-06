-- ZyntixAI Customer Core: fail-closed NULL-role authorization remediation.
-- Forward-only fix for SECURITY DEFINER functions that used role-only NOT IN checks.

create or replace function public.archive_customer(
  p_organization_id uuid,
  p_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to archive customers';
  end if;

  update public.customers as c
  set archived_at = pg_catalog.now()
  where c.organization_id = p_organization_id
    and c.id = p_customer_id
    and c.archived_at is null;

  if not found then
    raise exception 'customer not found or already archived';
  end if;
end;
$$;

create or replace function public.restore_customer(
  p_organization_id uuid,
  p_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to restore customers';
  end if;

  update public.customers as c
  set archived_at = null
  where c.organization_id = p_organization_id
    and c.id = p_customer_id
    and c.archived_at is not null;

  if not found then
    raise exception 'customer not found or not archived';
  end if;
end;
$$;
