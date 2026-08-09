-- ZyntixAI Invitations / Member Administration:
-- operational SELECT RLS + column grants (mutations remain future RPC-only)
--
-- OD-1 (owner-approved):
-- Active Owner/Admin may SELECT invitation/event history even when the
-- Organization is suspended/archived. Policies intentionally do NOT gate on
-- organization usability. Mutation fail-closed remains a future RPC concern.

revoke insert, update, delete on table public.organization_invitations from authenticated;
revoke insert, update, delete on table public.organization_invitations from anon;
revoke insert, update, delete on table public.organization_invitations from public;

-- Column-level SELECT: token_hash intentionally omitted.
grant select (
  id,
  organization_id,
  email_normalized,
  role,
  status,
  invited_by_member_id,
  expires_at,
  accepted_at,
  accepted_by_user_id,
  revoked_at,
  created_at,
  updated_at
) on table public.organization_invitations to authenticated;

revoke insert, update, delete on table public.organization_invitation_events from authenticated;
revoke insert, update, delete on table public.organization_invitation_events from anon;
revoke insert, update, delete on table public.organization_invitation_events from public;

grant select on table public.organization_invitation_events to authenticated;

create policy organization_invitations_select_owner_admin
  on public.organization_invitations
  for select
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy organization_invitation_events_select_owner_admin
  on public.organization_invitation_events
  for select
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
  );

-- Re-assert authenticated write denial + immutability function privileges.
revoke insert, update, delete on table public.organization_invitations from authenticated;
revoke insert, update, delete on table public.organization_invitation_events from authenticated;

revoke all on function private.guard_organization_invitation_event_immutable() from public;
revoke all on function private.guard_organization_invitation_event_immutable() from anon;
revoke all on function private.guard_organization_invitation_event_immutable() from authenticated;
revoke all on function private.guard_organization_invitation_event_immutable() from service_role;

comment on table public.organization_invitations is
  'Organization invitations. SELECT for active Owner/Admin only (column grants exclude token_hash). Mutations via future SECURITY DEFINER RPCs only. OD-1: historical SELECT not gated on organization usability.';

comment on table public.organization_invitation_events is
  'Append-only invitation audit events. SELECT for active Owner/Admin only. Written via future private helpers inside RPCs. UPDATE blocked by immutability trigger.';
