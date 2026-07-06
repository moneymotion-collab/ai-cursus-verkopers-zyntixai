-- ZyntixAI Programs & Enrollments: fail-closed NULL-role authorization remediation.
-- Forward-only fix for SECURITY DEFINER functions that used role-only NOT IN checks.

create or replace function public.update_program(
  p_organization_id uuid,
  p_program_id uuid,
  p_name text,
  p_description text,
  p_delivery_mode text,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to update programs';
  end if;

  if not exists (
    select 1
    from public.programs as p
    where p.organization_id = p_organization_id
      and p.id = p_program_id
      and p.archived_at is null
    for update
  ) then
    raise exception 'program not found or archived';
  end if;

  v_name := btrim(p_name);
  if char_length(v_name) = 0 then
    raise exception 'name is required';
  end if;

  if p_delivery_mode not in (
    'self_paced', 'cohort', 'group_coaching', 'one_to_one', 'membership', 'hybrid'
  ) then
    raise exception 'invalid delivery_mode';
  end if;

  update public.programs as p
  set
    name = v_name,
    description = nullif(btrim(p_description), ''),
    delivery_mode = p_delivery_mode,
    metadata = coalesce(p_metadata, '{}'::jsonb)
  where p.organization_id = p_organization_id
    and p.id = p_program_id
    and p.archived_at is null;
exception
  when unique_violation then
    raise exception 'program name already exists in organization';
end;
$$;

create or replace function public.archive_program(
  p_organization_id uuid,
  p_program_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_open_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to archive programs';
  end if;

  if not exists (
    select 1
    from public.programs as p
    where p.organization_id = p_organization_id
      and p.id = p_program_id
      and p.archived_at is null
    for update
  ) then
    raise exception 'program not found or already archived';
  end if;

  select count(*)
  into v_open_count
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.program_id = p_program_id
    and e.status in ('pending', 'active', 'paused')
    and e.archived_at is null;

  if v_open_count > 0 then
    raise exception 'cannot archive program with open enrollments';
  end if;

  update public.programs as p
  set archived_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_program_id
    and p.archived_at is null;
end;
$$;

create or replace function public.restore_program(
  p_organization_id uuid,
  p_program_id uuid
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
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to restore programs';
  end if;

  update public.programs as p
  set archived_at = null
  where p.organization_id = p_organization_id
    and p.id = p_program_id
    and p.archived_at is not null;

  if not found then
    raise exception 'program not found or not archived';
  end if;
end;
$$;

create or replace function public.archive_enrollment(
  p_organization_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to archive enrollments';
  end if;

  select e.status
  into v_status
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
    and e.archived_at is null
  for update;

  if not found then
    raise exception 'enrollment not found or already archived';
  end if;

  if v_status not in ('completed', 'cancelled') then
    raise exception 'only terminal enrollments can be archived';
  end if;

  update public.enrollments as e
  set archived_at = pg_catalog.now()
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
    and e.archived_at is null;
end;
$$;

create or replace function public.restore_enrollment(
  p_organization_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null
     or v_member_role is null
     or v_member_role not in ('owner', 'admin')
  then
    raise exception 'insufficient role to restore enrollments';
  end if;

  select e.status
  into v_status
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
    and e.archived_at is not null
  for update;

  if not found then
    raise exception 'enrollment not found or not archived';
  end if;

  if v_status not in ('completed', 'cancelled') then
    raise exception 'only terminal enrollments can be restored';
  end if;

  update public.enrollments as e
  set archived_at = null
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
    and e.archived_at is not null;
end;
$$;
