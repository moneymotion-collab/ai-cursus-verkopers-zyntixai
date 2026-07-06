-- ZyntixAI Customer Core: customers

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  display_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text not null default 'onboarding',
  owner_member_id uuid,
  created_by_member_id uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_org_id_unique unique (organization_id, id),
  constraint customers_display_name_not_empty check (char_length(btrim(display_name)) > 0),
  constraint customers_status_check check (
    status in ('onboarding', 'active', 'paused', 'completed', 'cancelled', 'churned')
  ),
  constraint customers_owner_member_fk foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint customers_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.customers is
  'Organization-scoped customer relationship; not an auth user or staff profile.';
comment on column public.customers.owner_member_id is
  'Assigned organization_members.id within the same organization.';
comment on column public.customers.email is
  'Business contact email for this organization relationship.';

create unique index customers_org_email_unique_idx
  on public.customers (organization_id, lower(btrim(email)))
  where email is not null;

create index customers_organization_id_idx
  on public.customers (organization_id);

create index customers_organization_id_status_idx
  on public.customers (organization_id, status);

create index customers_organization_id_owner_member_id_idx
  on public.customers (organization_id, owner_member_id);

create index customers_org_active_idx
  on public.customers (organization_id)
  where archived_at is null;

grant select on public.customers to authenticated;
