-- ZyntixAI D3 Tasks Core M2: append-only task status history

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  task_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid not null,
  reason text,
  source text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint task_status_history_from_status_check check (
    from_status is null
    or from_status in ('open', 'completed', 'cancelled')
  ),
  constraint task_status_history_to_status_check check (
    to_status in ('open', 'completed', 'cancelled')
  ),
  constraint task_status_history_source_check check (
    source in ('manual', 'system')
  ),
  constraint task_status_history_allowed_transition_check check (
    (
      from_status is null
      and to_status = 'open'
    )
    or (
      from_status is not null
      and from_status = 'open'
      and to_status in ('completed', 'cancelled')
    )
  ),
  constraint task_status_history_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint task_status_history_task_fk foreign key (organization_id, task_id)
    references public.tasks (organization_id, id)
    on delete cascade,
  constraint task_status_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.task_status_history is
  'Immutable lifecycle audit log for task status changes.';

create index task_status_history_org_task_created_at_idx
  on public.task_status_history (organization_id, task_id, created_at desc);

grant select on public.task_status_history to authenticated;
