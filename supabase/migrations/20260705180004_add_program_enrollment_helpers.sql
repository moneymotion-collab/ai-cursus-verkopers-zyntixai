-- ZyntixAI Programs & Enrollments Core: triggers, private helpers, and controlled functions

create trigger programs_set_updated_at
  before update on public.programs
  for each row
  execute function public.set_updated_at();

create trigger enrollments_set_updated_at
  before update on public.enrollments
  for each row
  execute function public.set_updated_at();

create or replace function private.get_program_enrollment_actor_membership(
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

revoke all on function private.get_program_enrollment_actor_membership(uuid) from public;
revoke all on function private.get_program_enrollment_actor_membership(uuid) from anon;
revoke all on function private.get_program_enrollment_actor_membership(uuid) from authenticated;

create or replace function private.is_allowed_program_status_transition(
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
    when p_from_status = 'draft' and p_to_status in ('active', 'retired') then true
    when p_from_status = 'active' and p_to_status in ('paused', 'retired') then true
    when p_from_status = 'paused' and p_to_status in ('active', 'retired') then true
    when p_from_status = 'retired' and p_to_status = 'active' then true
    else false
  end;
$$;

revoke all on function private.is_allowed_program_status_transition(text, text) from public;
revoke all on function private.is_allowed_program_status_transition(text, text) from anon;
revoke all on function private.is_allowed_program_status_transition(text, text) from authenticated;

create or replace function private.is_allowed_enrollment_status_transition(
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
    when p_from_status = 'pending' and p_to_status in ('active', 'cancelled') then true
    when p_from_status = 'active' and p_to_status in ('paused', 'completed', 'cancelled') then true
    when p_from_status = 'paused' and p_to_status in ('active', 'completed', 'cancelled') then true
    else false
  end;
$$;

revoke all on function private.is_allowed_enrollment_status_transition(text, text) from public;
revoke all on function private.is_allowed_enrollment_status_transition(text, text) from anon;
revoke all on function private.is_allowed_enrollment_status_transition(text, text) from authenticated;

create or replace function private.insert_program_status_history(
  p_organization_id uuid,
  p_program_id uuid,
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
  insert into public.program_status_history (
    organization_id,
    program_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_program_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

create or replace function private.insert_enrollment_status_history(
  p_organization_id uuid,
  p_enrollment_id uuid,
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
  insert into public.enrollment_status_history (
    organization_id,
    enrollment_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_enrollment_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

create or replace function private.validate_enrollment_owner_assignment(
  p_organization_id uuid,
  p_owner_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_owner_member_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.id = p_owner_member_id
      and om.status = 'active'
  ) then
    raise exception 'invalid owner_member_id for organization';
  end if;
end;
$$;

revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from public;
revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from anon;
revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from authenticated;

create or replace function private.guard_enrollment_owner_assignment_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.owner_member_id is not distinct from old.owner_member_id then
    return new;
  end if;

  perform private.validate_enrollment_owner_assignment(new.organization_id, new.owner_member_id);
  return new;
end;
$$;

revoke all on function private.guard_enrollment_owner_assignment_trigger() from public;
revoke all on function private.guard_enrollment_owner_assignment_trigger() from anon;
revoke all on function private.guard_enrollment_owner_assignment_trigger() from authenticated;

create trigger enrollments_guard_owner_assignment
  before insert or update of owner_member_id on public.enrollments
  for each row
  execute function private.guard_enrollment_owner_assignment_trigger();

create or replace function public.create_program(
  p_organization_id uuid,
  p_name text,
  p_delivery_mode text,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_program_id uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to create programs';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
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

  insert into public.programs (
    organization_id,
    name,
    description,
    status,
    delivery_mode,
    created_by_member_id,
    metadata
  )
  values (
    p_organization_id,
    v_name,
    nullif(btrim(p_description), ''),
    'draft',
    p_delivery_mode,
    v_membership_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_program_id;

  perform private.insert_program_status_history(
    p_organization_id,
    v_program_id,
    null,
    'draft',
    v_membership_id,
    null,
    'manual'
  );

  return v_program_id;
exception
  when unique_violation then
    raise exception 'program name already exists in organization';
end;
$$;

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
  v_member_role text;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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

create or replace function public.transition_program_status(
  p_organization_id uuid,
  p_program_id uuid,
  p_to_status text,
  p_reason text default null,
  p_source text default 'manual'
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
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to transition program status';
  end if;

  select p.status, p.archived_at
  into v_from_status, v_archived_at
  from public.programs as p
  where p.organization_id = p_organization_id
    and p.id = p_program_id
  for update;

  if not found then
    raise exception 'program not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived programs cannot transition status';
  end if;

  if v_from_status is not distinct from p_to_status then
    raise exception 'status transition is a no-op';
  end if;

  if not private.is_allowed_program_status_transition(v_from_status, p_to_status) then
    raise exception 'status transition not allowed';
  end if;

  if p_source not in ('manual', 'system', 'import', 'integration') then
    raise exception 'invalid source';
  end if;

  update public.programs as p
  set status = p_to_status
  where p.organization_id = p_organization_id
    and p.id = p_program_id;

  perform private.insert_program_status_history(
    p_organization_id,
    p_program_id,
    v_from_status,
    p_to_status,
    v_membership_id,
    p_reason,
    p_source
  );
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
  v_member_role text;
  v_open_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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

create or replace function public.create_enrollment(
  p_organization_id uuid,
  p_customer_id uuid,
  p_program_id uuid,
  p_owner_member_id uuid default null,
  p_initial_status text default 'pending',
  p_source text default 'manual',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_enrollment_id uuid;
  v_customer_status text;
  v_customer_archived_at timestamptz;
  v_program_status text;
  v_program_archived_at timestamptz;
  v_started_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role to create enrollments';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  if p_initial_status not in ('pending', 'active') then
    raise exception 'invalid initial status';
  end if;

  if coalesce(p_source, 'manual') <> 'manual' then
    raise exception 'invalid enrollment source';
  end if;

  select c.status, c.archived_at
  into v_customer_status, v_customer_archived_at
  from public.customers as c
  where c.organization_id = p_organization_id
    and c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer not found';
  end if;

  if v_customer_archived_at is not null then
    raise exception 'archived customers cannot receive enrollments';
  end if;

  if v_customer_status not in ('onboarding', 'active') then
    raise exception 'customer status does not allow enrollment';
  end if;

  select p.status, p.archived_at
  into v_program_status, v_program_archived_at
  from public.programs as p
  where p.organization_id = p_organization_id
    and p.id = p_program_id
  for update;

  if not found then
    raise exception 'program not found';
  end if;

  if v_program_archived_at is not null then
    raise exception 'archived programs cannot receive enrollments';
  end if;

  if v_program_status <> 'active' then
    raise exception 'program is not active';
  end if;

  perform private.validate_enrollment_owner_assignment(p_organization_id, p_owner_member_id);

  if p_initial_status = 'active' then
    v_started_at := pg_catalog.now();
  else
    v_started_at := null;
  end if;

  insert into public.enrollments (
    organization_id,
    customer_id,
    program_id,
    status,
    owner_member_id,
    created_by_member_id,
    enrolled_at,
    started_at,
    source,
    metadata
  )
  values (
    p_organization_id,
    p_customer_id,
    p_program_id,
    p_initial_status,
    p_owner_member_id,
    v_membership_id,
    pg_catalog.now(),
    v_started_at,
    'manual',
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_enrollment_id;

  perform private.insert_enrollment_status_history(
    p_organization_id,
    v_enrollment_id,
    null,
    p_initial_status,
    v_membership_id,
    null,
    'manual'
  );

  return v_enrollment_id;
exception
  when unique_violation then
    raise exception 'open enrollment already exists for customer and program';
end;
$$;

create or replace function public.transition_enrollment_status(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_to_status text,
  p_reason text default null,
  p_source text default 'manual'
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
  v_started_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role to transition enrollment status';
  end if;

  if p_source not in ('manual', 'lead_conversion') then
    raise exception 'invalid source';
  end if;

  select e.status, e.archived_at, e.started_at
  into v_from_status, v_archived_at, v_started_at
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
  for update;

  if not found then
    raise exception 'enrollment not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived enrollments cannot transition status';
  end if;

  if v_from_status is not distinct from p_to_status then
    raise exception 'status transition is a no-op';
  end if;

  if not private.is_allowed_enrollment_status_transition(v_from_status, p_to_status) then
    raise exception 'status transition not allowed';
  end if;

  update public.enrollments as e
  set
    status = p_to_status,
    started_at = case
      when p_to_status = 'active' and e.started_at is null then pg_catalog.now()
      else e.started_at
    end,
    completed_at = case
      when p_to_status = 'completed' then pg_catalog.now()
      else e.completed_at
    end,
    cancelled_at = case
      when p_to_status = 'cancelled' then pg_catalog.now()
      else e.cancelled_at
    end
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id;

  perform private.insert_enrollment_status_history(
    p_organization_id,
    p_enrollment_id,
    v_from_status,
    p_to_status,
    v_membership_id,
    p_reason,
    p_source
  );
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
  v_member_role text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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
  v_member_role text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
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

comment on function public.create_program(uuid, text, text, text, jsonb) is
  'Atomically creates a draft program and initial status history.';
comment on function public.update_program(uuid, uuid, text, text, text, jsonb) is
  'Updates allowed business fields on a non-archived program.';
comment on function public.transition_program_status(uuid, uuid, text, text, text) is
  'Controlled program lifecycle transition with history.';
comment on function public.archive_program(uuid, uuid) is
  'Soft-archives a program when no open enrollments exist.';
comment on function public.restore_program(uuid, uuid) is
  'Restores an archived program without changing lifecycle status.';
comment on function public.create_enrollment(uuid, uuid, uuid, uuid, text, text, jsonb) is
  'Atomically creates an enrollment and initial status history.';
comment on function public.transition_enrollment_status(uuid, uuid, text, text, text) is
  'Controlled enrollment lifecycle transition with history.';
comment on function public.archive_enrollment(uuid, uuid) is
  'Soft-archives a terminal enrollment.';
comment on function public.restore_enrollment(uuid, uuid) is
  'Restores an archived terminal enrollment without reactivation.';

revoke all on function public.create_program(uuid, text, text, text, jsonb) from public;
revoke all on function public.create_program(uuid, text, text, text, jsonb) from anon;
grant execute on function public.create_program(uuid, text, text, text, jsonb) to authenticated;

revoke all on function public.update_program(uuid, uuid, text, text, text, jsonb) from public;
revoke all on function public.update_program(uuid, uuid, text, text, text, jsonb) from anon;
grant execute on function public.update_program(uuid, uuid, text, text, text, jsonb) to authenticated;

revoke all on function public.transition_program_status(uuid, uuid, text, text, text) from public;
revoke all on function public.transition_program_status(uuid, uuid, text, text, text) from anon;
grant execute on function public.transition_program_status(uuid, uuid, text, text, text) to authenticated;

revoke all on function public.archive_program(uuid, uuid) from public;
revoke all on function public.archive_program(uuid, uuid) from anon;
grant execute on function public.archive_program(uuid, uuid) to authenticated;

revoke all on function public.restore_program(uuid, uuid) from public;
revoke all on function public.restore_program(uuid, uuid) from anon;
grant execute on function public.restore_program(uuid, uuid) to authenticated;

revoke all on function public.create_enrollment(uuid, uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.create_enrollment(uuid, uuid, uuid, uuid, text, text, jsonb) from anon;
grant execute on function public.create_enrollment(uuid, uuid, uuid, uuid, text, text, jsonb) to authenticated;

revoke all on function public.transition_enrollment_status(uuid, uuid, text, text, text) from public;
revoke all on function public.transition_enrollment_status(uuid, uuid, text, text, text) from anon;
grant execute on function public.transition_enrollment_status(uuid, uuid, text, text, text) to authenticated;

revoke all on function public.archive_enrollment(uuid, uuid) from public;
revoke all on function public.archive_enrollment(uuid, uuid) from anon;
grant execute on function public.archive_enrollment(uuid, uuid) to authenticated;

revoke all on function public.restore_enrollment(uuid, uuid) from public;
revoke all on function public.restore_enrollment(uuid, uuid) from anon;
grant execute on function public.restore_enrollment(uuid, uuid) to authenticated;
