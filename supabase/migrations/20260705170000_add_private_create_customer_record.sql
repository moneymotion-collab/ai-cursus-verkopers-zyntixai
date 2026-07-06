-- ZyntixAI Customer Core forward extension: shared customer insert helper

create or replace function private.create_customer_record(
  p_organization_id uuid,
  p_display_name text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_owner_member_id uuid,
  p_created_by_member_id uuid,
  p_source text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_display_name text;
  v_email text;
begin
  if p_source not in ('manual', 'lead_conversion') then
    raise exception 'invalid customer history source';
  end if;

  if p_owner_member_id is not null then
    if not exists (
      select 1
      from public.organization_members as om
      where om.organization_id = p_organization_id
        and om.id = p_owner_member_id
        and om.status = 'active'
    ) then
      raise exception 'invalid owner_member_id for organization';
    end if;
  end if;

  v_display_name := btrim(p_display_name);
  if char_length(v_display_name) = 0 then
    raise exception 'display_name is required';
  end if;

  v_email := private.normalize_customer_email(p_email);

  insert into public.customers (
    organization_id,
    display_name,
    first_name,
    last_name,
    email,
    phone,
    status,
    owner_member_id,
    created_by_member_id,
    started_at,
    ended_at,
    archived_at
  )
  values (
    p_organization_id,
    v_display_name,
    nullif(btrim(p_first_name), ''),
    nullif(btrim(p_last_name), ''),
    v_email,
    nullif(btrim(p_phone), ''),
    'onboarding',
    p_owner_member_id,
    p_created_by_member_id,
    pg_catalog.now(),
    null,
    null
  )
  returning id into v_customer_id;

  perform private.insert_customer_status_history(
    p_organization_id,
    v_customer_id,
    null,
    'onboarding',
    p_created_by_member_id,
    null,
    p_source
  );

  return v_customer_id;
end;
$$;

comment on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) is
  'Internal atomic customer insert with initial onboarding history. Not client-callable.';

revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from public;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from anon;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from authenticated;

create or replace function public.create_customer(
  p_organization_id uuid,
  p_display_name text,
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null,
  p_owner_member_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role to create customers';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  v_customer_id := private.create_customer_record(
    p_organization_id,
    p_display_name,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_owner_member_id,
    v_membership_id,
    'manual'
  );

  return v_customer_id;
exception
  when unique_violation then
    raise exception 'customer email already exists in organization';
end;
$$;

comment on function public.create_customer(uuid, text, text, text, text, text, uuid) is
  'Atomically creates a customer and initial onboarding status history.';

revoke all on function public.create_customer(uuid, text, text, text, text, text, uuid) from public;
revoke all on function public.create_customer(uuid, text, text, text, text, text, uuid) from anon;
grant execute on function public.create_customer(uuid, text, text, text, text, text, uuid) to authenticated;
