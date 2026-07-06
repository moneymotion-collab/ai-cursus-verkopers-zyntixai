-- ZyntixAI Customer Core: row level security and column privileges

alter table public.customers enable row level security;
alter table public.customer_status_history enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_tag_links enable row level security;

revoke insert, update, delete on public.customers from authenticated;
grant select on public.customers to authenticated;
grant update (
  display_name,
  first_name,
  last_name,
  email,
  phone,
  owner_member_id,
  metadata
) on public.customers to authenticated;

revoke insert, update, delete on public.customer_status_history from authenticated;
grant select on public.customer_status_history to authenticated;

create policy customers_select_admin
  on public.customers
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy customers_select_member
  on public.customers
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy customers_update_staff
  on public.customers
  for update
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and archived_at is null
  )
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and archived_at is null
  );

create policy customer_status_history_select_member
  on public.customer_status_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy customer_tags_select_admin
  on public.customer_tags
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy customer_tags_select_member
  on public.customer_tags
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy customer_tags_insert_admin
  on public.customer_tags
  for insert
  to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy customer_tags_update_admin
  on public.customer_tags
  for update
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy customer_tag_links_select_member
  on public.customer_tag_links
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy customer_tag_links_insert_staff
  on public.customer_tag_links
  for insert
  to authenticated
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and exists (
      select 1
      from public.customers as c
      where c.organization_id = customer_tag_links.organization_id
        and c.id = customer_tag_links.customer_id
        and c.archived_at is null
    )
  );

create policy customer_tag_links_delete_staff
  on public.customer_tag_links
  for delete
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin', 'staff'])
    and exists (
      select 1
      from public.customers as c
      where c.organization_id = customer_tag_links.organization_id
        and c.id = customer_tag_links.customer_id
        and c.archived_at is null
    )
  );
