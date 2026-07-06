-- ZyntixAI Customer Core: organization-scoped customer tags

create table public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  color_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint customer_tags_org_id_unique unique (organization_id, id),
  constraint customer_tags_name_not_empty check (char_length(btrim(name)) > 0)
);

comment on table public.customer_tags is
  'Organization-scoped tags for customer segmentation.';

create unique index customer_tags_org_name_unique_idx
  on public.customer_tags (organization_id, lower(btrim(name)));

create index customer_tags_org_active_idx
  on public.customer_tags (organization_id)
  where archived_at is null;

grant select, insert, update on public.customer_tags to authenticated;
