-- ZyntixAI Leads Core: lead_pipeline_stages

create table public.lead_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  position integer not null,
  stage_category text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint lead_pipeline_stages_org_id_unique unique (organization_id, id),
  constraint lead_pipeline_stages_name_not_empty check (char_length(btrim(name)) > 0),
  constraint lead_pipeline_stages_position_positive check (position > 0),
  constraint lead_pipeline_stages_category_check check (
    stage_category in ('new', 'active', 'qualified', 'proposal')
  )
);

comment on table public.lead_pipeline_stages is
  'Organization-scoped configurable sales pipeline stages.';

create unique index lead_pipeline_stages_org_name_unique_idx
  on public.lead_pipeline_stages (organization_id, lower(btrim(name)));

create unique index lead_pipeline_stages_org_active_default_unique_idx
  on public.lead_pipeline_stages (organization_id)
  where is_default = true and archived_at is null;

create index lead_pipeline_stages_organization_id_position_idx
  on public.lead_pipeline_stages (organization_id, position);

grant select, insert, update on public.lead_pipeline_stages to authenticated;
