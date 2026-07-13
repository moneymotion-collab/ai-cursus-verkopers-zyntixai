-- ZyntixAI D3 Tasks Core M4: row level security for tasks and task status history

alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

revoke insert, update, delete on public.tasks from authenticated;
grant select on public.tasks to authenticated;

revoke insert, update, delete on public.task_status_history from authenticated;
grant select on public.task_status_history to authenticated;

create policy tasks_select_admin
  on public.tasks
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy tasks_select_member
  on public.tasks
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy task_status_history_select_admin
  on public.task_status_history
  for select
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
    and exists (
      select 1
      from public.tasks as t
      where t.organization_id = task_status_history.organization_id
        and t.id = task_status_history.task_id
    )
  );

create policy task_status_history_select_member
  on public.task_status_history
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and exists (
      select 1
      from public.tasks as t
      where t.organization_id = task_status_history.organization_id
        and t.id = task_status_history.task_id
        and t.archived_at is null
    )
  );
