-- ZyntixAI Leads Core: append-only lead status history

create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lead_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid,
  reason text,
  source text not null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint lead_status_history_status_check check (
    to_status in ('open', 'converted', 'lost', 'disqualified')
  ),
  constraint lead_status_history_source_check check (
    source in ('manual', 'system', 'import', 'conversion')
  ),
  constraint lead_status_history_lead_fk foreign key (organization_id, lead_id)
    references public.leads (organization_id, id)
    on delete cascade,
  constraint lead_status_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.lead_status_history is
  'Immutable audit log for lead lifecycle status changes.';

create index lead_status_history_org_lead_changed_at_idx
  on public.lead_status_history (organization_id, lead_id, changed_at desc);

grant select on public.lead_status_history to authenticated;
