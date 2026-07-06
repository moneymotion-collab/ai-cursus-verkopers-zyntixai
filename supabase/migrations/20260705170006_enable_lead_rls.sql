-- ZyntixAI Leads Core: row level security and column privileges

alter table public.leads enable row level security;
alter table public.lead_pipeline_stages enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.lead_status_history enable row level security;

revoke insert, update, delete on public.leads from authenticated;
grant select on public.leads to authenticated;
grant update (
  display_name,
  first_name,
  last_name,
  email,
  phone,
  owner_member_id,
  source_type,
  source_detail,
  pursuit_label,
  metadata
) on public.leads to authenticated;

revoke insert, update, delete on public.lead_stage_history from authenticated;
grant select on public.lead_stage_history to authenticated;

revoke insert, update, delete on public.lead_status_history from authenticated;
grant select on public.lead_status_history to authenticated;

revoke delete on public.lead_pipeline_stages from authenticated;

create policy leads_select_admin
  on public.leads
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy leads_select_member
  on public.leads
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy leads_update_staff
  on public.leads
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

create policy lead_pipeline_stages_select_admin
  on public.lead_pipeline_stages
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy lead_pipeline_stages_select_member
  on public.lead_pipeline_stages
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy lead_pipeline_stages_insert_admin
  on public.lead_pipeline_stages
  for insert
  to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy lead_pipeline_stages_update_admin
  on public.lead_pipeline_stages
  for update
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy lead_stage_history_select_member
  on public.lead_stage_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy lead_status_history_select_member
  on public.lead_status_history
  for select
  to authenticated
  using (private.is_org_member(organization_id));

-- Defense-in-depth: re-assert private helper privileges after lead rollout.
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from public;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from anon;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from authenticated;

revoke all on function private.normalize_lead_email(text) from public;
revoke all on function private.normalize_lead_email(text) from anon;
revoke all on function private.normalize_lead_email(text) from authenticated;

revoke all on function private.is_allowed_lead_status_transition(text, text) from public;
revoke all on function private.is_allowed_lead_status_transition(text, text) from anon;
revoke all on function private.is_allowed_lead_status_transition(text, text) from authenticated;

revoke all on function private.get_lead_actor_membership(uuid) from public;
revoke all on function private.get_lead_actor_membership(uuid) from anon;
revoke all on function private.get_lead_actor_membership(uuid) from authenticated;

revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from public;
revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from anon;
revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from authenticated;

revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

revoke all on function private.canonicalize_lead_email_trigger() from public;
revoke all on function private.canonicalize_lead_email_trigger() from anon;
revoke all on function private.canonicalize_lead_email_trigger() from authenticated;

revoke all on function public.ensure_default_pipeline_stages(uuid) from public;
revoke all on function public.ensure_default_pipeline_stages(uuid) from anon;
revoke all on function public.ensure_default_pipeline_stages(uuid) from authenticated;
