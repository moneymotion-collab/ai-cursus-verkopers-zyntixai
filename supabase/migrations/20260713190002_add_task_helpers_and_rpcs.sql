-- ZyntixAI D3 Tasks Core M3: private helpers and controlled task RPCs

create or replace function private.get_task_actor_membership(
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

revoke all on function private.get_task_actor_membership(uuid) from public;
revoke all on function private.get_task_actor_membership(uuid) from anon;
revoke all on function private.get_task_actor_membership(uuid) from authenticated;

create or replace function private.effective_organization_timezone(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_timezone text;
begin
  select nullif(btrim(o.timezone), '')
  into v_timezone
  from public.organizations as o
  where o.id = p_organization_id;

  if v_timezone is null then
    return 'UTC';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_timezone_names as tz
    where tz.name = v_timezone
  ) then
    return v_timezone;
  end if;

  return 'UTC';
end;
$$;

revoke all on function private.effective_organization_timezone(uuid) from public;
revoke all on function private.effective_organization_timezone(uuid) from anon;
revoke all on function private.effective_organization_timezone(uuid) from authenticated;

create or replace function private.is_allowed_task_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from_status is null and p_to_status = 'open' then true
    when p_from_status = 'open' and p_to_status in ('completed', 'cancelled') then true
    else false
  end;
$$;

revoke all on function private.is_allowed_task_status_transition(text, text) from public;
revoke all on function private.is_allowed_task_status_transition(text, text) from anon;
revoke all on function private.is_allowed_task_status_transition(text, text) from authenticated;

create or replace function private.insert_task_status_history(
  p_organization_id uuid,
  p_task_id uuid,
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
  insert into public.task_status_history (
    organization_id,
    task_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_task_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

create or replace function private.validate_task_member_assignment(
  p_organization_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_member_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.id = p_member_id
      and om.status = 'active'
  ) then
    raise exception 'invalid member assignment for organization';
  end if;
end;
$$;

revoke all on function private.validate_task_member_assignment(uuid, uuid) from public;
revoke all on function private.validate_task_member_assignment(uuid, uuid) from anon;
revoke all on function private.validate_task_member_assignment(uuid, uuid) from authenticated;

create or replace function private.validate_task_linked_entities_not_archived(
  p_organization_id uuid,
  p_lead_id uuid,
  p_customer_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lead_id is not null then
    if not exists (
      select 1
      from public.leads as l
      where l.organization_id = p_organization_id
        and l.id = p_lead_id
        and l.archived_at is null
    ) then
      raise exception 'linked lead not found or archived';
    end if;
  end if;

  if p_customer_id is not null then
    if not exists (
      select 1
      from public.customers as c
      where c.organization_id = p_organization_id
        and c.id = p_customer_id
        and c.archived_at is null
    ) then
      raise exception 'linked customer not found or archived';
    end if;
  end if;

  if p_enrollment_id is not null then
    if not exists (
      select 1
      from public.enrollments as e
      where e.organization_id = p_organization_id
        and e.id = p_enrollment_id
        and e.archived_at is null
    ) then
      raise exception 'linked enrollment not found or archived';
    end if;
  end if;
end;
$$;

revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from public;
revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from anon;
revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from authenticated;

create or replace function private.validate_task_linked_entities_restorable(
  p_organization_id uuid,
  p_lead_id uuid,
  p_customer_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lead_id is not null then
    if exists (
      select 1
      from public.leads as l
      where l.organization_id = p_organization_id
        and l.id = p_lead_id
        and l.archived_at is not null
    ) then
      raise exception 'linked lead is archived';
    end if;
  end if;

  if p_customer_id is not null then
    if exists (
      select 1
      from public.customers as c
      where c.organization_id = p_organization_id
        and c.id = p_customer_id
        and c.archived_at is not null
    ) then
      raise exception 'linked customer is archived';
    end if;
  end if;

  if p_enrollment_id is not null then
    if exists (
      select 1
      from public.enrollments as e
      where e.organization_id = p_organization_id
        and e.id = p_enrollment_id
        and e.archived_at is not null
    ) then
      raise exception 'linked enrollment is archived';
    end if;
  end if;
end;
$$;

revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from public;
revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from anon;
revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from authenticated;

create or replace function private.assert_task_predecessor_acyclic(
  p_organization_id uuid,
  p_predecessor_task_id uuid,
  p_new_task_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cursor uuid;
  v_depth integer := 0;
begin
  if p_predecessor_task_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.tasks as t
    where t.organization_id = p_organization_id
      and t.id = p_predecessor_task_id
  ) then
    raise exception 'invalid predecessor task';
  end if;

  v_cursor := p_predecessor_task_id;
  while v_cursor is not null loop
    if v_cursor = p_new_task_id then
      raise exception 'task predecessor cycle detected';
    end if;

    v_depth := v_depth + 1;
    if v_depth > 100000 then
      raise exception 'task predecessor ancestry depth exceeded';
    end if;

    select t.predecessor_task_id
    into v_cursor
    from public.tasks as t
    where t.organization_id = p_organization_id
      and t.id = v_cursor;
  end loop;
end;
$$;

revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from public;
revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from anon;
revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from authenticated;

create or replace function private.task_payload_idempotency_matches(
  p_existing public.tasks,
  p_title text,
  p_description text,
  p_task_type text,
  p_priority text,
  p_due_at timestamptz,
  p_assignee_member_id uuid,
  p_lead_id uuid,
  p_customer_id uuid,
  p_enrollment_id uuid,
  p_program_id uuid,
  p_predecessor_task_id uuid
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_existing.title is not distinct from p_title
    and p_existing.description is not distinct from p_description
    and p_existing.task_type is not distinct from p_task_type
    and p_existing.priority is not distinct from p_priority
    and p_existing.due_at is not distinct from p_due_at
    and p_existing.assignee_member_id is not distinct from p_assignee_member_id
    and p_existing.lead_id is not distinct from p_lead_id
    and p_existing.customer_id is not distinct from p_customer_id
    and p_existing.enrollment_id is not distinct from p_enrollment_id
    and p_existing.program_id is not distinct from p_program_id
    and p_existing.predecessor_task_id is not distinct from p_predecessor_task_id;
$$;

revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from anon;
revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from authenticated;

create or replace function private.assert_active_task_organization(
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;
end;
$$;

revoke all on function private.assert_active_task_organization(uuid) from public;
revoke all on function private.assert_active_task_organization(uuid) from anon;
revoke all on function private.assert_active_task_organization(uuid) from authenticated;

create or replace function private.require_task_actor(
  p_organization_id uuid,
  p_allowed_roles text[]
)
returns table (
  membership_id uuid,
  member_role text
)
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

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_task_actor_membership(p_organization_id) as actor;

  if v_membership_id is null
     or v_member_role is null
     or v_member_role <> all (p_allowed_roles)
  then
    raise exception 'insufficient role';
  end if;

  perform private.assert_active_task_organization(p_organization_id);

  membership_id := v_membership_id;
  member_role := v_member_role;
  return next;
end;
$$;

revoke all on function private.require_task_actor(uuid, text[]) from public;
revoke all on function private.require_task_actor(uuid, text[]) from anon;
revoke all on function private.require_task_actor(uuid, text[]) from authenticated;

create or replace function public.create_task(
  p_organization_id uuid,
  p_title text,
  p_due_at timestamptz,
  p_description text default null,
  p_task_type text default 'general',
  p_priority text default 'normal',
  p_source text default 'manual',
  p_assignee_member_id uuid default null,
  p_lead_id uuid default null,
  p_customer_id uuid default null,
  p_enrollment_id uuid default null,
  p_program_id uuid default null,
  p_predecessor_task_id uuid default null,
  p_idempotency_key text default null,
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
  v_source text;
  v_key text;
  v_title text;
  v_existing public.tasks;
  v_new_id uuid;
  v_constraint text;
begin
  v_source := btrim(coalesce(p_source, 'manual'));
  v_key := nullif(btrim(p_idempotency_key), '');
  v_title := btrim(p_title);

  if char_length(v_title) = 0 then
    raise exception 'title is required';
  end if;

  if p_due_at is null then
    raise exception 'due_at is required';
  end if;

  if v_source = 'manual' then
    select actor.membership_id, actor.member_role
    into v_membership_id, v_member_role
    from private.require_task_actor(
      p_organization_id,
      array['owner', 'admin', 'staff']::text[]
    ) as actor;
  elsif v_source = 'system' then
    select actor.membership_id, actor.member_role
    into v_membership_id, v_member_role
    from private.require_task_actor(
      p_organization_id,
      array['owner', 'admin']::text[]
    ) as actor;

    if v_key is null then
      raise exception 'system idempotency key is required';
    end if;
  else
    raise exception 'invalid task source';
  end if;

  if v_source = 'manual' and v_key is not null then
    raise exception 'invalid task source';
  end if;

  if p_task_type not in ('follow_up', 'call_prep', 'onboarding', 'general') then
    raise exception 'invalid task type';
  end if;

  if p_priority not in ('low', 'normal', 'high') then
    raise exception 'invalid task priority';
  end if;

  perform private.validate_task_member_assignment(p_organization_id, p_assignee_member_id);
  perform private.validate_task_linked_entities_not_archived(
    p_organization_id,
    p_lead_id,
    p_customer_id,
    p_enrollment_id
  );
  perform private.assert_task_predecessor_acyclic(
    p_organization_id,
    p_predecessor_task_id
  );

  if v_source = 'system' and v_key is not null then
    select t.*
    into v_existing
    from public.tasks as t
    where t.organization_id = p_organization_id
      and t.source = 'system'
      and t.idempotency_key = v_key
    limit 1;

    if found then
      if private.task_payload_idempotency_matches(
        v_existing,
        v_title,
        nullif(btrim(p_description), ''),
        p_task_type,
        p_priority,
        p_due_at,
        p_assignee_member_id,
        p_lead_id,
        p_customer_id,
        p_enrollment_id,
        p_program_id,
        p_predecessor_task_id
      ) then
        return v_existing.id;
      end if;

      raise exception 'idempotency payload conflict';
    end if;
  end if;

  begin
    insert into public.tasks (
      organization_id,
      status,
      title,
      description,
      task_type,
      priority,
      source,
      due_at,
      assignee_member_id,
      created_by_member_id,
      lead_id,
      customer_id,
      enrollment_id,
      program_id,
      predecessor_task_id,
      idempotency_key,
      metadata
    )
    values (
      p_organization_id,
      'open',
      v_title,
      nullif(btrim(p_description), ''),
      p_task_type,
      p_priority,
      v_source,
      p_due_at,
      p_assignee_member_id,
      v_membership_id,
      p_lead_id,
      p_customer_id,
      p_enrollment_id,
      p_program_id,
      p_predecessor_task_id,
      v_key,
      coalesce(p_metadata, '{}'::jsonb)
    )
    returning id into v_new_id;

    perform private.insert_task_status_history(
      p_organization_id,
      v_new_id,
      null,
      'open',
      v_membership_id,
      null,
      v_source
    );

    return v_new_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;

      if v_constraint = 'tasks_system_idempotency_uidx' and v_source = 'system' and v_key is not null then
        select t.*
        into v_existing
        from public.tasks as t
        where t.organization_id = p_organization_id
          and t.source = 'system'
          and t.idempotency_key = v_key
        limit 1;

        if not found then
          raise;
        end if;

        if private.task_payload_idempotency_matches(
          v_existing,
          v_title,
          nullif(btrim(p_description), ''),
          p_task_type,
          p_priority,
          p_due_at,
          p_assignee_member_id,
          p_lead_id,
          p_customer_id,
          p_enrollment_id,
          p_program_id,
          p_predecessor_task_id
        ) then
          return v_existing.id;
        end if;

        raise exception 'idempotency payload conflict';
      else
        raise;
      end if;
  end;
end;
$$;

create or replace function public.update_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_title text,
  p_description text default null,
  p_task_type text default 'general',
  p_priority text default 'normal',
  p_metadata jsonb default '{}'::jsonb
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
  v_archived_at timestamptz;
  v_title text;
  v_lead_id uuid;
  v_customer_id uuid;
  v_enrollment_id uuid;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_title := btrim(p_title);
  if char_length(v_title) = 0 then
    raise exception 'title is required';
  end if;

  if p_task_type not in ('follow_up', 'call_prep', 'onboarding', 'general') then
    raise exception 'invalid task type';
  end if;

  if p_priority not in ('low', 'normal', 'high') then
    raise exception 'invalid task priority';
  end if;

  select t.status, t.archived_at, t.lead_id, t.customer_id, t.enrollment_id
  into v_status, v_archived_at, v_lead_id, v_customer_id, v_enrollment_id
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived tasks cannot be updated';
  end if;

  if v_status <> 'open' then
    raise exception 'only open tasks can be updated';
  end if;

  perform private.validate_task_linked_entities_not_archived(
    p_organization_id,
    v_lead_id,
    v_customer_id,
    v_enrollment_id
  );

  update public.tasks as t
  set
    title = v_title,
    description = nullif(btrim(p_description), ''),
    task_type = p_task_type,
    priority = p_priority,
    metadata = coalesce(p_metadata, '{}'::jsonb)
  where t.organization_id = p_organization_id
    and t.id = p_task_id;
end;
$$;

create or replace function public.reassign_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_assignee_member_id uuid default null
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
  v_archived_at timestamptz;
  v_lead_id uuid;
  v_customer_id uuid;
  v_enrollment_id uuid;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  select t.status, t.archived_at, t.lead_id, t.customer_id, t.enrollment_id
  into v_status, v_archived_at, v_lead_id, v_customer_id, v_enrollment_id
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived tasks cannot be reassigned';
  end if;

  if v_status <> 'open' then
    raise exception 'only open tasks can be reassigned';
  end if;

  perform private.validate_task_linked_entities_not_archived(
    p_organization_id,
    v_lead_id,
    v_customer_id,
    v_enrollment_id
  );
  perform private.validate_task_member_assignment(p_organization_id, p_assignee_member_id);

  update public.tasks as t
  set assignee_member_id = p_assignee_member_id
  where t.organization_id = p_organization_id
    and t.id = p_task_id;
end;
$$;

create or replace function public.reschedule_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_due_at timestamptz
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
  v_archived_at timestamptz;
  v_lead_id uuid;
  v_customer_id uuid;
  v_enrollment_id uuid;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  if p_due_at is null then
    raise exception 'due_at is required';
  end if;

  select t.status, t.archived_at, t.lead_id, t.customer_id, t.enrollment_id
  into v_status, v_archived_at, v_lead_id, v_customer_id, v_enrollment_id
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived tasks cannot be rescheduled';
  end if;

  if v_status <> 'open' then
    raise exception 'only open tasks can be rescheduled';
  end if;

  perform private.validate_task_linked_entities_not_archived(
    p_organization_id,
    v_lead_id,
    v_customer_id,
    v_enrollment_id
  );

  update public.tasks as t
  set due_at = p_due_at
  where t.organization_id = p_organization_id
    and t.id = p_task_id;
end;
$$;

create or replace function public.complete_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_completion_note text default null
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
  v_archived_at timestamptz;
  v_source text;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  select t.status, t.archived_at, t.source
  into v_status, v_archived_at, v_source
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived tasks cannot be completed';
  end if;

  if v_status <> 'open' then
    raise exception 'only open tasks can be completed';
  end if;

  update public.tasks as t
  set
    status = 'completed',
    completed_at = pg_catalog.now(),
    completed_by_member_id = v_membership_id,
    completion_note = nullif(btrim(p_completion_note), '')
  where t.organization_id = p_organization_id
    and t.id = p_task_id;

  perform private.insert_task_status_history(
    p_organization_id,
    p_task_id,
    'open',
    'completed',
    v_membership_id,
    nullif(btrim(p_completion_note), ''),
    v_source
  );
end;
$$;

create or replace function public.cancel_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_cancel_reason text
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
  v_archived_at timestamptz;
  v_source text;
  v_reason text;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_reason := nullif(btrim(p_cancel_reason), '');
  if v_reason is null then
    raise exception 'cancel reason is required';
  end if;

  select t.status, t.archived_at, t.source
  into v_status, v_archived_at, v_source
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
  for update;

  if not found then
    raise exception 'task not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived tasks cannot be cancelled';
  end if;

  if v_status <> 'open' then
    raise exception 'only open tasks can be cancelled';
  end if;

  update public.tasks as t
  set
    status = 'cancelled',
    cancelled_at = pg_catalog.now(),
    cancelled_by_member_id = v_membership_id,
    cancel_reason = v_reason
  where t.organization_id = p_organization_id
    and t.id = p_task_id;

  perform private.insert_task_status_history(
    p_organization_id,
    p_task_id,
    'open',
    'cancelled',
    v_membership_id,
    v_reason,
    v_source
  );
end;
$$;

create or replace function public.archive_task(
  p_organization_id uuid,
  p_task_id uuid
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
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  ) as actor;

  select t.status
  into v_status
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
    and t.archived_at is null
  for update;

  if not found then
    raise exception 'task not found or already archived';
  end if;

  if v_status not in ('completed', 'cancelled') then
    raise exception 'only terminal tasks can be archived';
  end if;

  update public.tasks as t
  set archived_at = pg_catalog.now()
  where t.organization_id = p_organization_id
    and t.id = p_task_id
    and t.archived_at is null;
end;
$$;

create or replace function public.restore_task(
  p_organization_id uuid,
  p_task_id uuid
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
  v_lead_id uuid;
  v_customer_id uuid;
  v_enrollment_id uuid;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  ) as actor;

  select t.status, t.lead_id, t.customer_id, t.enrollment_id
  into v_status, v_lead_id, v_customer_id, v_enrollment_id
  from public.tasks as t
  where t.organization_id = p_organization_id
    and t.id = p_task_id
    and t.archived_at is not null
  for update;

  if not found then
    raise exception 'task not found or not archived';
  end if;

  if v_status not in ('completed', 'cancelled') then
    raise exception 'only terminal tasks can be restored';
  end if;

  perform private.validate_task_linked_entities_restorable(
    p_organization_id,
    v_lead_id,
    v_customer_id,
    v_enrollment_id
  );

  update public.tasks as t
  set archived_at = null
  where t.organization_id = p_organization_id
    and t.id = p_task_id
    and t.archived_at is not null;
end;
$$;

comment on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) is
  'Atomically creates an open task and initial status history.';
comment on function public.update_task(uuid, uuid, text, text, text, text, jsonb) is
  'Updates editable operational fields on an open non-archived task.';
comment on function public.reassign_task(uuid, uuid, uuid) is
  'Reassigns an open non-archived task within the organization.';
comment on function public.reschedule_task(uuid, uuid, timestamptz) is
  'Reschedules due_at on an open non-archived task.';
comment on function public.complete_task(uuid, uuid, text) is
  'Completes an open task and records status history.';
comment on function public.cancel_task(uuid, uuid, text) is
  'Cancels an open task and records status history.';
comment on function public.archive_task(uuid, uuid) is
  'Soft-archives a terminal task without changing lifecycle status.';
comment on function public.restore_task(uuid, uuid) is
  'Restores an archived terminal task when linked entities are not archived.';

revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from public;
revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from anon;
grant execute on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) to authenticated;

revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from public;
revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from anon;
grant execute on function public.update_task(uuid, uuid, text, text, text, text, jsonb) to authenticated;

revoke all on function public.reassign_task(uuid, uuid, uuid) from public;
revoke all on function public.reassign_task(uuid, uuid, uuid) from anon;
grant execute on function public.reassign_task(uuid, uuid, uuid) to authenticated;

revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from public;
revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from anon;
grant execute on function public.reschedule_task(uuid, uuid, timestamptz) to authenticated;

revoke all on function public.complete_task(uuid, uuid, text) from public;
revoke all on function public.complete_task(uuid, uuid, text) from anon;
grant execute on function public.complete_task(uuid, uuid, text) to authenticated;

revoke all on function public.cancel_task(uuid, uuid, text) from public;
revoke all on function public.cancel_task(uuid, uuid, text) from anon;
grant execute on function public.cancel_task(uuid, uuid, text) to authenticated;

revoke all on function public.archive_task(uuid, uuid) from public;
revoke all on function public.archive_task(uuid, uuid) from anon;
grant execute on function public.archive_task(uuid, uuid) to authenticated;

revoke all on function public.restore_task(uuid, uuid) from public;
revoke all on function public.restore_task(uuid, uuid) from anon;
grant execute on function public.restore_task(uuid, uuid) to authenticated;
