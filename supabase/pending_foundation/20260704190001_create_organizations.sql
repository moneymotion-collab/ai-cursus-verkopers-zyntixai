-- ZyntixAI foundation: organizations (tenant root)

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  timezone text,
  locale text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint organizations_slug_unique unique (slug)
);

comment on table public.organizations is 'Tenant root for ZyntixAI; one organization per course seller business.';
comment on column public.organizations.created_by is 'User who created the organization; set null if profile is deleted.';

grant select, insert, update on public.organizations to authenticated;
