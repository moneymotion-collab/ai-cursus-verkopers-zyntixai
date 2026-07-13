-- ZyntixAI D3 Tasks Core M1: tasks table, constraints, indexes, and triggers

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  status text not null default 'open',
  title text not null,
  description text,
  task_type text not null default 'general',
  priority text not null default 'normal',
  source text not null default 'manual',
  due_at timestamptz not null,
  assignee_member_id uuid,
  created_by_member_id uuid not null,
  lead_id uuid,
  customer_id uuid,
  enrollment_id uuid,
  program_id uuid,
  predecessor_task_id uuid,
  idempotency_key text,
  completion_note text,
  completed_at timestamptz,
  completed_by_member_id uuid,
  cancel_reason text,
  cancelled_at timestamptz,
  cancelled_by_member_id uuid,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint tasks_org_id_unique unique (organization_id, id),
  constraint tasks_title_not_empty_check check (char_length(btrim(title)) > 0),
  constraint tasks_status_check check (
    status in ('open', 'completed', 'cancelled')
  ),
  constraint tasks_task_type_check check (
    task_type in ('follow_up', 'call_prep', 'onboarding', 'general')
  ),
  constraint tasks_priority_check check (
    priority in ('low', 'normal', 'high')
  ),
  constraint tasks_source_check check (
    source in ('manual', 'system')
  ),
  constraint tasks_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  ),
  constraint tasks_due_at_not_null_check check (
    due_at is not null
  ),
  constraint tasks_context_link_required_check check (
    lead_id is not null
    or customer_id is not null
    or enrollment_id is not null
  ),
  constraint tasks_lead_customer_exclusive_check check (
    not (lead_id is not null and customer_id is not null)
  ),
  constraint tasks_lead_enrollment_exclusive_check check (
    not (lead_id is not null and enrollment_id is not null)
  ),
  constraint tasks_program_enrollment_parity_check check (
    (program_id is null) = (enrollment_id is null)
  ),
  constraint tasks_enrollment_tuple_presence_check check (
    enrollment_id is null
    or (
      customer_id is not null
      and program_id is not null
    )
  ),
  constraint tasks_source_idempotency_consistency_check check (
    (
      source = 'system'
      and nullif(btrim(idempotency_key), '') is not null
    )
    or (
      source = 'manual'
      and idempotency_key is null
    )
  ),
  constraint tasks_open_terminal_null_check check (
    status <> 'open'
    or (
      completed_at is null
      and completed_by_member_id is null
      and cancelled_at is null
      and cancelled_by_member_id is null
      and cancel_reason is null
      and completion_note is null
    )
  ),
  constraint tasks_completed_fields_check check (
    status <> 'completed'
    or (
      completed_at is not null
      and completed_by_member_id is not null
      and cancelled_at is null
      and cancelled_by_member_id is null
      and cancel_reason is null
    )
  ),
  constraint tasks_cancelled_fields_check check (
    status <> 'cancelled'
    or (
      cancelled_at is not null
      and cancelled_by_member_id is not null
      and cancel_reason is not null
      and char_length(btrim(cancel_reason)) > 0
      and completed_at is null
      and completed_by_member_id is null
      and completion_note is null
    )
  ),
  constraint tasks_completion_note_terminal_check check (
    completion_note is null
    or status = 'completed'
  ),
  constraint tasks_no_self_predecessor_check check (
    predecessor_task_id is null
    or predecessor_task_id <> id
  ),
  constraint tasks_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint tasks_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint tasks_assignee_member_fk foreign key (organization_id, assignee_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint tasks_completed_by_member_fk foreign key (organization_id, completed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint tasks_cancelled_by_member_fk foreign key (organization_id, cancelled_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint tasks_lead_fk foreign key (organization_id, lead_id)
    references public.leads (organization_id, id)
    on delete restrict,
  constraint tasks_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint tasks_enrollment_tuple_fk foreign key (
    organization_id,
    enrollment_id,
    customer_id,
    program_id
  )
    references public.enrollments (
      organization_id,
      id,
      customer_id,
      program_id
    )
    match simple
    on delete restrict,
  constraint tasks_predecessor_fk foreign key (organization_id, predecessor_task_id)
    references public.tasks (organization_id, id)
    on delete restrict
);

comment on table public.tasks is
  'Organization-scoped operational tasks with RPC-only lifecycle mutations.';
comment on column public.tasks.due_at is
  'Operational deadline preserved across terminal transitions.';
comment on column public.tasks.predecessor_task_id is
  'Immutable backward link to an earlier task in the same organization.';

create index tasks_organization_id_idx
  on public.tasks (organization_id);

create index tasks_organization_id_status_idx
  on public.tasks (organization_id, status);

create index tasks_organization_id_assignee_member_id_idx
  on public.tasks (organization_id, assignee_member_id);

create index tasks_open_due_at_idx
  on public.tasks (organization_id, due_at)
  where status = 'open'
    and archived_at is null;

create index tasks_organization_id_lead_id_idx
  on public.tasks (organization_id, lead_id)
  where lead_id is not null;

create index tasks_organization_id_customer_id_idx
  on public.tasks (organization_id, customer_id)
  where customer_id is not null;

create index tasks_organization_id_enrollment_id_idx
  on public.tasks (organization_id, enrollment_id)
  where enrollment_id is not null;

create index tasks_organization_id_predecessor_task_id_idx
  on public.tasks (organization_id, predecessor_task_id)
  where predecessor_task_id is not null;

create unique index tasks_system_idempotency_uidx
  on public.tasks (organization_id, idempotency_key)
  where source = 'system'
    and idempotency_key is not null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

create or replace function private.guard_task_predecessor_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.predecessor_task_id is distinct from old.predecessor_task_id then
    raise exception 'task predecessor is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_task_predecessor_immutable() from public;
revoke all on function private.guard_task_predecessor_immutable() from anon;
revoke all on function private.guard_task_predecessor_immutable() from authenticated;

create trigger tasks_guard_predecessor_immutable
  before update on public.tasks
  for each row
  execute function private.guard_task_predecessor_immutable();

grant select on public.tasks to authenticated;
