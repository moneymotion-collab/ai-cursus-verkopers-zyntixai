-- ZyntixAI Leads Core: leads

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  display_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text not null default 'open',
  stage_id uuid not null,
  owner_member_id uuid,
  created_by_member_id uuid,
  source_type text not null default 'manual',
  source_detail text,
  pursuit_label text,
  converted_customer_id uuid,
  converted_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_org_id_unique unique (organization_id, id),
  constraint leads_display_name_not_empty check (char_length(btrim(display_name)) > 0),
  constraint leads_status_check check (
    status in ('open', 'converted', 'lost', 'disqualified')
  ),
  constraint leads_stage_fk foreign key (organization_id, stage_id)
    references public.lead_pipeline_stages (organization_id, id)
    on delete restrict,
  constraint leads_owner_member_fk foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint leads_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint leads_converted_customer_fk foreign key (organization_id, converted_customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint leads_conversion_consistency check (
    (
      status = 'converted'
      and converted_customer_id is not null
      and converted_at is not null
    )
    or (
      status <> 'converted'
      and converted_customer_id is null
      and converted_at is null
    )
  )
);

comment on table public.leads is
  'Organization-scoped commercial sales pursuit (lead as opportunity).';

create index leads_organization_id_idx
  on public.leads (organization_id);

create index leads_organization_id_status_idx
  on public.leads (organization_id, status);

create index leads_organization_id_stage_id_idx
  on public.leads (organization_id, stage_id);

create index leads_organization_id_owner_member_id_idx
  on public.leads (organization_id, owner_member_id);

create index leads_org_email_lookup_idx
  on public.leads (organization_id, lower(btrim(email)))
  where email is not null;

create index leads_org_active_idx
  on public.leads (organization_id)
  where archived_at is null;

grant select on public.leads to authenticated;
