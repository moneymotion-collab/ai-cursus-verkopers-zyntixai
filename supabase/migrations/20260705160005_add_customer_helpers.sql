-- ZyntixAI Customer Core: triggers, helpers, and controlled customer functions

create trigger customers_set_updated_at
  before update on public.customers
  for each row
  execute function public.set_updated_at();

create trigger customer_tags_set_updated_at
  before update on public.customer_tags
  for each row
  execute function public.set_updated_at();

create or replace function private.normalize_customer_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(btrim(p_email)), '');
$$;

create or replace function private.is_allowed_customer_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from_status is not distinct from p_to_status then false
    when p_from_status = 'onboarding' and p_to_status in ('active', 'cancelled') then true
    when p_from_status = 'active' and p_to_status in ('paused', 'completed', 'cancelled', 'churned') then true
    when p_from_status = 'paused' and p_to_status in ('active', 'cancelled', 'churned', 'completed') then true
    when p_from_status = 'completed' and p_to_status in ('active', 'onboarding') then true
    when p_from_status = 'cancelled' and p_to_status in ('active', 'onboarding') then true
    when p_from_status = 'churned' and p_to_status in ('active', 'onboarding') then true
    else false
  end;
$$;

revoke all on function private.normalize_customer_email(text) from public;
revoke all on function private.normalize_customer_email(text) from anon;
revoke all on function private.normalize_customer_email(text) from authenticated;

revoke all on function private.is_allowed_customer_status_transition(text, text) from public;
revoke all on function private.is_allowed_customer_status_transition(text, text) from anon;
revoke all on function private.is_allowed_customer_status_transition(text, text) from authenticated;

create or replace function private.get_actor_membership(
  p_organization_id uuid
)
returns table (
  membership_id uuid,
  member_role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select om.id, om.role
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
  limit 1;
$$;

revoke all on function private.get_actor_membership(uuid) from public;
revoke all on function private.get_actor_membership(uuid) from anon;
revoke all on function private.get_actor_membership(uuid) from authenticated;

create or replace function private.insert_customer_status_history(
  p_organization_id uuid,
  p_customer_id uuid,
  p_from_status text,
  p_to_status text,
  p_changed_by_member_id uuid,
  p_reason text,
  p_source text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.customer_status_history (
    organization_id,
    customer_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_customer_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

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
  v_display_name text;
  v_email text;
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
    v_membership_id,
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
    v_membership_id,
    null,
    'manual'
  );

  return v_customer_id;
exception
  when unique_violation then
    raise exception 'customer email already exists in organization';
end;
$$;

create or replace function public.transition_customer_status(
  p_organization_id uuid,
  p_customer_id uuid,
  p_to_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_from_status text;
  v_archived_at timestamptz;
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
    raise exception 'insufficient role to transition customer status';
  end if;

  select c.status, c.archived_at
  into v_from_status, v_archived_at
  from public.customers as c
  where c.organization_id = p_organization_id
    and c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived customers cannot transition status';
  end if;

  if v_from_status is not distinct from p_to_status then
    raise exception 'status transition is a no-op';
  end if;

  if not private.is_allowed_customer_status_transition(v_from_status, p_to_status) then
    raise exception 'status transition not allowed';
  end if;

  update public.customers as c
  set
    status = p_to_status,
    ended_at = case
      when p_to_status in ('completed', 'cancelled', 'churned') then pg_catalog.now()
      when p_to_status in ('active', 'onboarding') then null
      else c.ended_at
    end
  where c.organization_id = p_organization_id
    and c.id = p_customer_id;

  perform private.insert_customer_status_history(
    p_organization_id,
    p_customer_id,
    v_from_status,
    p_to_status,
    v_membership_id,
    p_reason,
    'manual'
  );
end;
$$;

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
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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

comment on function public.create_customer(uuid, text, text, text, text, text, uuid) is
  'Atomically creates a customer and initial onboarding status history.';
comment on function public.transition_customer_status(uuid, uuid, text, text) is
  'Controlled customer lifecycle transition with history.';
comment on function public.archive_customer(uuid, uuid) is
  'Soft-archives a customer without changing lifecycle status.';
comment on function public.restore_customer(uuid, uuid) is
  'Restores an archived customer without changing lifecycle status.';

revoke all on function public.create_customer(uuid, text, text, text, text, text, uuid) from public;
revoke all on function public.create_customer(uuid, text, text, text, text, text, uuid) from anon;
grant execute on function public.create_customer(uuid, text, text, text, text, text, uuid) to authenticated;

revoke all on function public.transition_customer_status(uuid, uuid, text, text) from public;
revoke all on function public.transition_customer_status(uuid, uuid, text, text) from anon;
grant execute on function public.transition_customer_status(uuid, uuid, text, text) to authenticated;

revoke all on function public.archive_customer(uuid, uuid) from public;
revoke all on function public.archive_customer(uuid, uuid) from anon;
grant execute on function public.archive_customer(uuid, uuid) to authenticated;

revoke all on function public.restore_customer(uuid, uuid) from public;
revoke all on function public.restore_customer(uuid, uuid) from anon;
grant execute on function public.restore_customer(uuid, uuid) to authenticated;
