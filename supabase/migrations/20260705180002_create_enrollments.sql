-- ZyntixAI Programs & Enrollments Core: enrollments

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  program_id uuid not null,
  status text not null default 'pending',
  owner_member_id uuid,
  created_by_member_id uuid not null,
  enrolled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint enrollments_org_id_unique unique (organization_id, id),
  constraint enrollments_status_check check (
    status in ('pending', 'active', 'paused', 'completed', 'cancelled')
  ),
  constraint enrollments_source_check check (
    source in ('manual', 'lead_conversion', 'import', 'integration', 'system')
  ),
  constraint enrollments_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint enrollments_archive_terminal_only_check check (
    archived_at is null
    or status in ('completed', 'cancelled')
  ),
  constraint enrollments_milestone_pending_check check (
    status <> 'pending'
    or (
      started_at is null
      and completed_at is null
      and cancelled_at is null
    )
  ),
  constraint enrollments_milestone_active_check check (
    status <> 'active'
    or (
      started_at is not null
      and completed_at is null
      and cancelled_at is null
    )
  ),
  constraint enrollments_milestone_paused_check check (
    status <> 'paused'
    or (
      started_at is not null
      and completed_at is null
      and cancelled_at is null
    )
  ),
  constraint enrollments_milestone_completed_check check (
    status <> 'completed'
    or (
      started_at is not null
      and completed_at is not null
      and cancelled_at is null
    )
  ),
  constraint enrollments_milestone_cancelled_check check (
    status <> 'cancelled'
    or (
      cancelled_at is not null
      and completed_at is null
    )
  ),
  constraint enrollments_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint enrollments_program_fk foreign key (organization_id, program_id)
    references public.programs (organization_id, id)
    on delete restrict,
  constraint enrollments_owner_member_fk foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint enrollments_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.enrollments is
  'Organization-scoped participation instance linking one customer to one program.';
comment on column public.enrollments.source is
  'Creation source; privileged values reserved for controlled flows.';
comment on column public.enrollments.archived_at is
  'Orthogonal soft-archive; only allowed for terminal enrollments.';

create unique index enrollments_open_participation_unique_idx
  on public.enrollments (organization_id, customer_id, program_id)
  where status in ('pending', 'active', 'paused')
    and archived_at is null;

create index enrollments_organization_id_customer_id_idx
  on public.enrollments (organization_id, customer_id);

create index enrollments_organization_id_program_id_idx
  on public.enrollments (organization_id, program_id);

create index enrollments_organization_id_status_idx
  on public.enrollments (organization_id, status);

create index enrollments_organization_id_owner_member_id_idx
  on public.enrollments (organization_id, owner_member_id);

create index enrollments_org_active_idx
  on public.enrollments (organization_id)
  where archived_at is null;

grant select on public.enrollments to authenticated;
