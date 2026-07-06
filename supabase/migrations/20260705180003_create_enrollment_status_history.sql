-- ZyntixAI Programs & Enrollments Core: append-only enrollment status history

create table public.enrollment_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  enrollment_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid,
  reason text,
  source text not null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint enrollment_status_history_from_status_check check (
    from_status is null
    or from_status in ('pending', 'active', 'paused', 'completed', 'cancelled')
  ),
  constraint enrollment_status_history_to_status_check check (
    to_status in ('pending', 'active', 'paused', 'completed', 'cancelled')
  ),
  constraint enrollment_status_history_source_check check (
    source in ('manual', 'lead_conversion', 'import', 'integration', 'system')
  ),
  constraint enrollment_status_history_enrollment_fk foreign key (organization_id, enrollment_id)
    references public.enrollments (organization_id, id)
    on delete cascade,
  constraint enrollment_status_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.enrollment_status_history is
  'Immutable lifecycle audit log for enrollment status changes.';

create index enrollment_status_history_org_enrollment_changed_at_idx
  on public.enrollment_status_history (organization_id, enrollment_id, changed_at desc);

grant select on public.enrollment_status_history to authenticated;
