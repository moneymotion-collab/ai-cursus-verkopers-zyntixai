-- ZyntixAI Programs & Enrollments Core: row level security and column privileges

alter table public.programs enable row level security;
alter table public.program_status_history enable row level security;
alter table public.enrollments enable row level security;
alter table public.enrollment_status_history enable row level security;

revoke insert, update, delete on public.programs from authenticated;
grant select on public.programs to authenticated;

revoke insert, update, delete on public.enrollments from authenticated;
grant select on public.enrollments to authenticated;
grant update (owner_member_id, metadata) on public.enrollments to authenticated;

revoke insert, update, delete on public.program_status_history from authenticated;
grant select on public.program_status_history to authenticated;

revoke insert, update, delete on public.enrollment_status_history from authenticated;
grant select on public.enrollment_status_history to authenticated;

create policy programs_select_admin
  on public.programs
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy programs_select_member
  on public.programs
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy program_status_history_select_member
  on public.program_status_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy enrollments_select_admin
  on public.enrollments
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy enrollments_select_member
  on public.enrollments
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy enrollments_update_staff
  on public.enrollments
  for update
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and archived_at is null
  )
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and archived_at is null
  );

create policy enrollment_status_history_select_member
  on public.enrollment_status_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));
