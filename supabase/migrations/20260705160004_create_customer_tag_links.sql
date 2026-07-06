-- ZyntixAI Customer Core: customer to tag links

create table public.customer_tag_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  customer_id uuid not null,
  tag_id uuid not null,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  constraint customer_tag_links_org_customer_tag_unique unique (organization_id, customer_id, tag_id),
  constraint customer_tag_links_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete cascade,
  constraint customer_tag_links_tag_fk foreign key (organization_id, tag_id)
    references public.customer_tags (organization_id, id)
    on delete cascade,
  constraint customer_tag_links_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.customer_tag_links is
  'Many-to-many links between customers and organization tags.';

create index customer_tag_links_org_customer_id_idx
  on public.customer_tag_links (organization_id, customer_id);

create index customer_tag_links_org_tag_id_idx
  on public.customer_tag_links (organization_id, tag_id);

grant select, insert, delete on public.customer_tag_links to authenticated;
