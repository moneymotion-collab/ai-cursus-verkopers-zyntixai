-- ZyntixAI Programs & Enrollments Core: programs

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  delivery_mode text not null,
  created_by_member_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint programs_org_id_unique unique (organization_id, id),
  constraint programs_name_not_empty check (char_length(btrim(name)) > 0),
  constraint programs_status_check check (
    status in ('draft', 'active', 'paused', 'retired')
  ),
  constraint programs_delivery_mode_check check (
    delivery_mode in (
      'self_paced',
      'cohort',
      'group_coaching',
      'one_to_one',
      'membership',
      'hybrid'
    )
  ),
  constraint programs_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint programs_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.programs is
  'Organization-scoped educational or coaching trajectory definition.';
comment on column public.programs.delivery_mode is
  'Delivery intent only; scheduling and batches are future modules.';
comment on column public.programs.archived_at is
  'Orthogonal soft-archive; does not change lifecycle status.';

create unique index programs_org_normalized_name_active_idx
  on public.programs (organization_id, lower(btrim(name)))
  where archived_at is null;

create index programs_organization_id_status_idx
  on public.programs (organization_id, status);

create index programs_org_active_idx
  on public.programs (organization_id)
  where archived_at is null;

grant select on public.programs to authenticated;
