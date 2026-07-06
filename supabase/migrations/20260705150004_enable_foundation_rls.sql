-- ZyntixAI foundation: row level security policies

-- profiles -------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- organizations ---------------------------------------------------------------
-- Organizations are created only via create_organization_with_owner(); no direct INSERT policy.

alter table public.organizations enable row level security;

create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (private.is_org_member(id));

create policy organizations_update_admin
  on public.organizations
  for update
  to authenticated
  using (private.has_org_role(id, array['owner', 'admin']))
  with check (private.has_org_role(id, array['owner', 'admin']));

-- organization_members --------------------------------------------------------

alter table public.organization_members enable row level security;

create policy organization_members_select_member
  on public.organization_members
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy organization_members_select_own
  on public.organization_members
  for select
  to authenticated
  using (user_id = auth.uid());

create policy organization_members_insert_admin
  on public.organization_members
  for insert
  to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_members_update_admin
  on public.organization_members
  for update
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
    and user_id <> auth.uid()
  )
  with check (
    private.has_org_role(organization_id, array['owner', 'admin'])
    and user_id <> auth.uid()
    and case
      when role in ('owner', 'admin') then private.has_org_role(organization_id, array['owner'])
      else true
    end
  );

create policy organization_members_accept_invite
  on public.organization_members
  for update
  to authenticated
  using (user_id = auth.uid() and status = 'invited')
  with check (
    user_id = auth.uid()
    and status = 'active'
  );

create policy organization_members_delete_owner
  on public.organization_members
  for delete
  to authenticated
  using (private.has_org_role(organization_id, array['owner']));
