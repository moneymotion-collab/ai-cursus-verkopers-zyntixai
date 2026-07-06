-- ZyntixAI Programs & Enrollments Core: append-only program status history

create table public.program_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  program_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid,
  reason text,
  source text not null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint program_status_history_from_status_check check (
    from_status is null
    or from_status in ('draft', 'active', 'paused', 'retired')
  ),
  constraint program_status_history_to_status_check check (
    to_status in ('draft', 'active', 'paused', 'retired')
  ),
  constraint program_status_history_source_check check (
    source in ('manual', 'system', 'import', 'integration')
  ),
  constraint program_status_history_program_fk foreign key (organization_id, program_id)
    references public.programs (organization_id, id)
    on delete cascade,
  constraint program_status_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.program_status_history is
  'Immutable lifecycle audit log for program status changes.';

create index program_status_history_org_program_changed_at_idx
  on public.program_status_history (organization_id, program_id, changed_at desc);

grant select on public.program_status_history to authenticated;
