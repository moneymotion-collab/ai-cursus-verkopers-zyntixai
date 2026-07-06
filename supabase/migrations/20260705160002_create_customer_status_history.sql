-- ZyntixAI Customer Core: append-only customer status history

create table public.customer_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  customer_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid,
  reason text,
  source text not null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint customer_status_history_source_check check (
    source in ('manual', 'lead_conversion', 'system', 'import')
  ),
  constraint customer_status_history_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete cascade,
  constraint customer_status_history_changed_by_member_fk foreign key (organization_id, changed_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.customer_status_history is
  'Immutable lifecycle audit log for customer status changes.';

create index customer_status_history_org_customer_changed_at_idx
  on public.customer_status_history (organization_id, customer_id, changed_at desc);

grant select on public.customer_status_history to authenticated;
