-- ZyntixAI D2 Progress Core M4: row level security for enrollment_progress_facts

alter table public.enrollment_progress_facts enable row level security;

revoke insert, update, delete on public.enrollment_progress_facts from authenticated;
grant select on public.enrollment_progress_facts to authenticated;

create policy enrollment_progress_facts_select_admin
  on public.enrollment_progress_facts
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy enrollment_progress_facts_select_member
  on public.enrollment_progress_facts
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and voided_at is null
    and exists (
      select 1
      from public.enrollments as e
      where e.organization_id = enrollment_progress_facts.organization_id
        and e.id = enrollment_progress_facts.enrollment_id
        and e.archived_at is null
    )
  );
