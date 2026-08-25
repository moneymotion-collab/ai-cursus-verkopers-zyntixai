-- ZyntixAI ORG-CONTEXT-1B — RLS, grants, and write denial.
--
-- Authenticated members may SELECT tenant-visible rows through RLS.
-- Authenticated/anon/public have no INSERT/UPDATE/DELETE.
-- service_role receives explicit DML only on these three tenant tables.
-- CONTROL-PLANE TAX/CAP/CTX grants are unchanged.
-- Integrity trigger EXECUTE remains revoked; triggers still fire.

alter table public.organization_business_activities enable row level security;
alter table public.organization_context_assignments enable row level security;
alter table public.organization_context_assignment_events enable row level security;

revoke all on table public.organization_business_activities from public;
revoke all on table public.organization_business_activities from anon;
revoke all on table public.organization_business_activities from authenticated;
revoke all on table public.organization_business_activities from service_role;

revoke all on table public.organization_context_assignments from public;
revoke all on table public.organization_context_assignments from anon;
revoke all on table public.organization_context_assignments from authenticated;
revoke all on table public.organization_context_assignments from service_role;

revoke all on table public.organization_context_assignment_events from public;
revoke all on table public.organization_context_assignment_events from anon;
revoke all on table public.organization_context_assignment_events from authenticated;
revoke all on table public.organization_context_assignment_events from service_role;

grant select on table public.organization_business_activities to authenticated;
grant select on table public.organization_context_assignments to authenticated;
grant select on table public.organization_context_assignment_events to authenticated;

grant select, insert, update on table public.organization_business_activities to service_role;
grant select, insert, update on table public.organization_context_assignments to service_role;
grant select, insert on table public.organization_context_assignment_events to service_role;

create policy organization_business_activities_select_member
  on public.organization_business_activities
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy organization_context_assignments_select_member_active
  on public.organization_context_assignments
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and status = 'active'
  );

create policy organization_context_assignments_select_owner_admin_history
  on public.organization_context_assignments
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy organization_context_assignment_events_select_owner_admin
  on public.organization_context_assignment_events
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

revoke insert, update, delete on table public.organization_business_activities from authenticated;
revoke insert, update, delete on table public.organization_business_activities from anon;
revoke insert, update, delete on table public.organization_business_activities from public;

revoke insert, update, delete on table public.organization_context_assignments from authenticated;
revoke insert, update, delete on table public.organization_context_assignments from anon;
revoke insert, update, delete on table public.organization_context_assignments from public;

revoke insert, update, delete on table public.organization_context_assignment_events from authenticated;
revoke insert, update, delete on table public.organization_context_assignment_events from anon;
revoke insert, update, delete on table public.organization_context_assignment_events from public;

revoke all on function private.guard_organization_context_assignment_event_immutable() from public;
revoke all on function private.guard_organization_context_assignment_event_immutable() from anon;
revoke all on function private.guard_organization_context_assignment_event_immutable() from authenticated;
revoke all on function private.guard_organization_context_assignment_event_immutable() from service_role;

revoke all on function private.enforce_organization_business_activity_identity() from public;
revoke all on function private.enforce_organization_business_activity_identity() from anon;
revoke all on function private.enforce_organization_business_activity_identity() from authenticated;
revoke all on function private.enforce_organization_business_activity_identity() from service_role;

revoke all on function private.enforce_organization_context_assignment_integrity() from public;
revoke all on function private.enforce_organization_context_assignment_integrity() from anon;
revoke all on function private.enforce_organization_context_assignment_integrity() from authenticated;
revoke all on function private.enforce_organization_context_assignment_integrity() from service_role;

comment on table public.organization_business_activities is
  'Tenant Business Activities. Member SELECT via RLS. Mutations via future platform/service_role or SECURITY DEFINER RPC. Not entitlement.';

comment on table public.organization_context_assignments is
  'Exact Context version pins. Members SELECT active rows; Owner/Admin SELECT history. No authenticated writes.';

comment on table public.organization_context_assignment_events is
  'Append-only ORG-CONTEXT audit. Owner/Admin SELECT only. INSERT via service_role. UPDATE/DELETE blocked.';
