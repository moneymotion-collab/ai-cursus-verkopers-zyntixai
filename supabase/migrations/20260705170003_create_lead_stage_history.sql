-- ZyntixAI Leads Core: append-only lead stage history

create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lead_id uuid not null,
  from_stage_id uuid,
  to_stage_id uuid not null,
  changed_by_member_id uuid,
  reason text,
  source text not null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint lead_stage_history_source_check check (
    source in ('manual', 'system', 'import', 'conversion')
  ),
  constraint lead_stage_history_lead_fk foreign key (organization_id, lead_id)
    references public.leads (organization_id, id)
    on delete cascade,
  constraint lead_stage_history_from_stage_fk foreign key (organization_id, from_stage_id)
    references public.lead_pipeline_stages (organization_id, id)
    on delete restrict,
  constraint lead_stage_history_to_stage_fk foreign key (organization_id, to_stage_id)
    references public.lead_pipeline_stages (organization_id, id)
    on delete restrict,
  constraint lead_stage_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.lead_stage_history is
  'Immutable audit log for lead pipeline stage changes.';

create index lead_stage_history_org_lead_changed_at_idx
  on public.lead_stage_history (organization_id, lead_id, changed_at desc);

grant select on public.lead_stage_history to authenticated;
