-- SHARED-PROJECTS-FOUNDATION
-- One organization-scoped delivery Project domain shared by Service and Field contexts.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  name text not null,
  summary text,
  status text not null default 'planned',
  owner_member_id uuid,
  planned_start date,
  planned_end date,
  created_by_member_id uuid not null,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint projects_org_id_unique unique (organization_id, id),
  constraint projects_name_not_empty_check check (char_length(btrim(name)) > 0),
  constraint projects_status_check check (
    status in ('planned', 'active', 'on_hold', 'completed', 'cancelled')
  ),
  constraint projects_planned_dates_check check (
    planned_start is null
    or planned_end is null
    or planned_end >= planned_start
  ),
  constraint projects_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint projects_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint projects_owner_member_fk foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint projects_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.projects is
  'Organization-scoped delivery engagements shared by Service and Field contexts.';
comment on column public.projects.owner_member_id is
  'Optional delivery owner; distinct from task assignee and field technician roles.';

create index projects_organization_id_idx
  on public.projects (organization_id);
create index projects_organization_id_status_idx
  on public.projects (organization_id, status);
create index projects_organization_id_customer_id_idx
  on public.projects (organization_id, customer_id);
create index projects_organization_id_owner_member_id_idx
  on public.projects (organization_id, owner_member_id)
  where owner_member_id is not null;
create index projects_org_active_idx
  on public.projects (organization_id, updated_at desc)
  where archived_at is null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

create table public.project_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid not null,
  reason text,
  source text not null default 'manual',
  created_at timestamptz not null default pg_catalog.now(),
  constraint project_status_history_status_check check (
    (from_status is null or from_status in ('planned', 'active', 'on_hold', 'completed', 'cancelled'))
    and to_status in ('planned', 'active', 'on_hold', 'completed', 'cancelled')
  ),
  constraint project_status_history_source_check check (source = 'manual'),
  constraint project_status_history_project_fk foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete cascade,
  constraint project_status_history_member_fk foreign key (
    organization_id,
    changed_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

create index project_status_history_project_idx
  on public.project_status_history (organization_id, project_id, created_at desc);

create or replace function private.is_allowed_project_status_transition(
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
    when p_from_status = 'planned' and p_to_status in ('active', 'cancelled') then true
    when p_from_status = 'active' and p_to_status in ('on_hold', 'completed', 'cancelled') then true
    when p_from_status = 'on_hold' and p_to_status in ('active', 'completed', 'cancelled') then true
    when p_from_status = 'completed' and p_to_status = 'active' then true
    when p_from_status = 'cancelled' and p_to_status = 'planned' then true
    else false
  end;
$$;

create or replace function private.require_project_actor(
  p_organization_id uuid,
  p_allowed_roles text[]
)
returns table (membership_id uuid, member_role text)
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

  select om.id, om.role
  into v_membership_id, v_member_role
  from public.organization_members as om
  join public.organizations as o on o.id = om.organization_id
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
    and o.status = 'active'
  limit 1;

  if v_membership_id is null or v_member_role is null then
    raise exception 'active organization membership required';
  end if;
  if not (v_member_role = any(p_allowed_roles)) then
    raise exception 'insufficient role';
  end if;

  membership_id := v_membership_id;
  member_role := v_member_role;
  return next;
end;
$$;

create or replace function private.validate_project_relations(
  p_organization_id uuid,
  p_customer_id uuid,
  p_owner_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.customers as c
    where c.organization_id = p_organization_id
      and c.id = p_customer_id
      and c.archived_at is null
  ) then
    raise exception 'customer not found or archived';
  end if;

  if p_owner_member_id is not null and not exists (
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

create or replace function private.insert_project_status_history(
  p_organization_id uuid,
  p_project_id uuid,
  p_from_status text,
  p_to_status text,
  p_changed_by_member_id uuid,
  p_reason text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.project_status_history (
    organization_id,
    project_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_project_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    nullif(btrim(p_reason), ''),
    'manual'
  );
$$;

revoke all on function private.is_allowed_project_status_transition(text, text) from public, anon, authenticated;
revoke all on function private.require_project_actor(uuid, text[]) from public, anon, authenticated;
revoke all on function private.validate_project_relations(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.insert_project_status_history(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;

create or replace function public.create_project(
  p_organization_id uuid,
  p_customer_id uuid,
  p_name text,
  p_summary text default null,
  p_owner_member_id uuid default null,
  p_planned_start date default null,
  p_planned_end date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_project_id uuid;
  v_name text;
begin
  select actor.membership_id
  into v_membership_id
  from private.require_project_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_name := btrim(p_name);
  if char_length(v_name) = 0 then
    raise exception 'project name is required';
  end if;
  if p_planned_start is not null and p_planned_end is not null
    and p_planned_end < p_planned_start then
    raise exception 'planned end must not be before planned start';
  end if;

  perform private.validate_project_relations(
    p_organization_id,
    p_customer_id,
    p_owner_member_id
  );

  insert into public.projects (
    organization_id,
    customer_id,
    name,
    summary,
    status,
    owner_member_id,
    planned_start,
    planned_end,
    created_by_member_id
  )
  values (
    p_organization_id,
    p_customer_id,
    v_name,
    nullif(btrim(p_summary), ''),
    'planned',
    p_owner_member_id,
    p_planned_start,
    p_planned_end,
    v_membership_id
  )
  returning id into v_project_id;

  perform private.insert_project_status_history(
    p_organization_id,
    v_project_id,
    null,
    'planned',
    v_membership_id,
    null
  );

  return v_project_id;
end;
$$;

create or replace function public.update_project(
  p_organization_id uuid,
  p_project_id uuid,
  p_customer_id uuid,
  p_name text,
  p_summary text default null,
  p_owner_member_id uuid default null,
  p_planned_start date default null,
  p_planned_end date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
  v_name text;
begin
  perform private.require_project_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  );

  select p.*
  into v_project
  from public.projects as p
  where p.organization_id = p_organization_id
    and p.id = p_project_id
  for update;

  if not found then
    raise exception 'project not found';
  end if;
  if v_project.archived_at is not null then
    raise exception 'project is archived';
  end if;

  v_name := btrim(p_name);
  if char_length(v_name) = 0 then
    raise exception 'project name is required';
  end if;
  if p_planned_start is not null and p_planned_end is not null
    and p_planned_end < p_planned_start then
    raise exception 'planned end must not be before planned start';
  end if;

  perform private.validate_project_relations(
    p_organization_id,
    p_customer_id,
    p_owner_member_id
  );

  update public.projects as p
  set
    customer_id = p_customer_id,
    name = v_name,
    summary = nullif(btrim(p_summary), ''),
    owner_member_id = p_owner_member_id,
    planned_start = p_planned_start,
    planned_end = p_planned_end
  where p.organization_id = p_organization_id
    and p.id = p_project_id;
end;
$$;

create or replace function public.transition_project_status(
  p_organization_id uuid,
  p_project_id uuid,
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
  v_project public.projects;
begin
  select actor.membership_id
  into v_membership_id
  from private.require_project_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  select p.*
  into v_project
  from public.projects as p
  where p.organization_id = p_organization_id
    and p.id = p_project_id
  for update;

  if not found then
    raise exception 'project not found';
  end if;
  if v_project.archived_at is not null then
    raise exception 'project is archived';
  end if;
  if not private.is_allowed_project_status_transition(v_project.status, p_to_status) then
    raise exception 'project status transition not allowed';
  end if;

  update public.projects as p
  set status = p_to_status
  where p.organization_id = p_organization_id
    and p.id = p_project_id;

  perform private.insert_project_status_history(
    p_organization_id,
    p_project_id,
    v_project.status,
    p_to_status,
    v_membership_id,
    p_reason
  );
end;
$$;

create or replace function public.archive_project(
  p_organization_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_project_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  );

  update public.projects as p
  set archived_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_project_id
    and p.archived_at is null;

  if not found then
    raise exception 'project not found or already archived';
  end if;
end;
$$;

create or replace function public.restore_project(
  p_organization_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  perform private.require_project_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  );

  select p.*
  into v_project
  from public.projects as p
  where p.organization_id = p_organization_id
    and p.id = p_project_id
  for update;

  if not found or v_project.archived_at is null then
    raise exception 'archived project not found';
  end if;

  perform private.validate_project_relations(
    p_organization_id,
    v_project.customer_id,
    v_project.owner_member_id
  );

  update public.projects as p
  set archived_at = null
  where p.organization_id = p_organization_id
    and p.id = p_project_id;
end;
$$;

alter table public.projects enable row level security;
alter table public.project_status_history enable row level security;

revoke all on table public.projects from public, anon, authenticated;
grant select on table public.projects to authenticated;
revoke all on table public.project_status_history from public, anon, authenticated;
grant select on table public.project_status_history to authenticated;

create policy projects_select_admin
  on public.projects
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy projects_select_member
  on public.projects
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy project_status_history_select_member
  on public.project_status_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));

revoke all on function public.create_project(uuid, uuid, text, text, uuid, date, date) from public, anon, authenticated, service_role;
revoke all on function public.update_project(uuid, uuid, uuid, text, text, uuid, date, date) from public, anon, authenticated, service_role;
revoke all on function public.transition_project_status(uuid, uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.archive_project(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.restore_project(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_project(uuid, uuid, text, text, uuid, date, date) to authenticated;
grant execute on function public.update_project(uuid, uuid, uuid, text, text, uuid, date, date) to authenticated;
grant execute on function public.transition_project_status(uuid, uuid, text, text) to authenticated;
grant execute on function public.archive_project(uuid, uuid) to authenticated;
grant execute on function public.restore_project(uuid, uuid) to authenticated;

-- Add a fourth, mutually exclusive Task linked-context kind without altering legacy rows.
alter table public.tasks
  add column project_id uuid;

alter table public.tasks
  drop constraint tasks_context_link_required_check,
  add constraint tasks_context_link_required_check check (
    lead_id is not null
    or customer_id is not null
    or enrollment_id is not null
    or project_id is not null
  ),
  add constraint tasks_project_lead_exclusive_check check (
    not (project_id is not null and lead_id is not null)
  ),
  add constraint tasks_project_customer_exclusive_check check (
    not (project_id is not null and customer_id is not null)
  ),
  add constraint tasks_project_enrollment_exclusive_check check (
    not (project_id is not null and enrollment_id is not null)
  ),
  add constraint tasks_project_program_exclusive_check check (
    not (project_id is not null and program_id is not null)
  ),
  add constraint tasks_project_fk foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete restrict;

create index tasks_organization_id_project_id_idx
  on public.tasks (organization_id, project_id)
  where project_id is not null;

create or replace function public.create_project_task(
  p_organization_id uuid,
  p_project_id uuid,
  p_title text,
  p_due_at timestamptz,
  p_description text default null,
  p_task_type text default 'general',
  p_priority text default 'normal',
  p_assignee_member_id uuid default null,
  p_predecessor_task_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_title text;
  v_task_id uuid;
begin
  select actor.membership_id
  into v_membership_id
  from private.require_task_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_title := btrim(p_title);
  if char_length(v_title) = 0 then
    raise exception 'title is required';
  end if;
  if p_due_at is null then
    raise exception 'due_at is required';
  end if;
  if p_task_type not in ('follow_up', 'call_prep', 'onboarding', 'general') then
    raise exception 'invalid task type';
  end if;
  if p_priority not in ('low', 'normal', 'high') then
    raise exception 'invalid task priority';
  end if;
  if not exists (
    select 1
    from public.projects as p
    where p.organization_id = p_organization_id
      and p.id = p_project_id
      and p.archived_at is null
  ) then
    raise exception 'linked project not found or archived';
  end if;

  perform private.validate_task_member_assignment(
    p_organization_id,
    p_assignee_member_id
  );
  perform private.assert_task_predecessor_acyclic(
    p_organization_id,
    p_predecessor_task_id
  );

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
    project_id,
    predecessor_task_id,
    metadata
  )
  values (
    p_organization_id,
    'open',
    v_title,
    nullif(btrim(p_description), ''),
    p_task_type,
    p_priority,
    'manual',
    p_due_at,
    p_assignee_member_id,
    v_membership_id,
    p_project_id,
    p_predecessor_task_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_task_id;

  perform private.insert_task_status_history(
    p_organization_id,
    v_task_id,
    null,
    'open',
    v_membership_id,
    null,
    'manual'
  );

  return v_task_id;
end;
$$;

revoke all on function public.create_project_task(
  uuid, uuid, text, timestamptz, text, text, text, uuid, uuid, jsonb
) from public, anon, authenticated, service_role;
grant execute on function public.create_project_task(
  uuid, uuid, text, timestamptz, text, text, text, uuid, uuid, jsonb
) to authenticated;
