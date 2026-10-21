-- ZyntixAI Invitations / Member Administration:
-- operator RPC EXECUTE privilege hardening (Attention-style)

-- Public RPCs: authenticated only; strip service_role execute
revoke all on function public.create_organization_invitation(uuid, text, text) from public;
revoke all on function public.create_organization_invitation(uuid, text, text) from anon;
revoke all on function public.create_organization_invitation(uuid, text, text) from authenticated;
revoke all on function public.create_organization_invitation(uuid, text, text) from service_role;
grant execute on function public.create_organization_invitation(uuid, text, text) to authenticated;

revoke all on function public.resend_organization_invitation(uuid, uuid) from public;
revoke all on function public.resend_organization_invitation(uuid, uuid) from anon;
revoke all on function public.resend_organization_invitation(uuid, uuid) from authenticated;
revoke all on function public.resend_organization_invitation(uuid, uuid) from service_role;
grant execute on function public.resend_organization_invitation(uuid, uuid) to authenticated;

revoke all on function public.revoke_organization_invitation(uuid, uuid) from public;
revoke all on function public.revoke_organization_invitation(uuid, uuid) from anon;
revoke all on function public.revoke_organization_invitation(uuid, uuid) from authenticated;
revoke all on function public.revoke_organization_invitation(uuid, uuid) from service_role;
grant execute on function public.revoke_organization_invitation(uuid, uuid) to authenticated;

-- Private helpers: no app/service execute
revoke all on function private.get_organization_invitation_actor_membership(uuid) from public;
revoke all on function private.get_organization_invitation_actor_membership(uuid) from anon;
revoke all on function private.get_organization_invitation_actor_membership(uuid) from authenticated;
revoke all on function private.get_organization_invitation_actor_membership(uuid) from service_role;

revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from public;
revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from anon;
revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from authenticated;
revoke all on function private.assert_active_organization_for_invitation_mutation(uuid) from service_role;

revoke all on function private.can_create_organization_invitation_target(text, text) from public;
revoke all on function private.can_create_organization_invitation_target(text, text) from anon;
revoke all on function private.can_create_organization_invitation_target(text, text) from authenticated;
revoke all on function private.can_create_organization_invitation_target(text, text) from service_role;

revoke all on function private.can_manage_organization_invitation_target(text, text) from public;
revoke all on function private.can_manage_organization_invitation_target(text, text) from anon;
revoke all on function private.can_manage_organization_invitation_target(text, text) from authenticated;
revoke all on function private.can_manage_organization_invitation_target(text, text) from service_role;

revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from public;
revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from anon;
revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from authenticated;
revoke all on function private.resolve_organization_invitation_membership_collision(uuid, text) from service_role;

revoke all on function private.generate_organization_invitation_token_pair() from public;
revoke all on function private.generate_organization_invitation_token_pair() from anon;
revoke all on function private.generate_organization_invitation_token_pair() from authenticated;
revoke all on function private.generate_organization_invitation_token_pair() from service_role;

revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from public;
revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from anon;
revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_organization_invitation_event(uuid, uuid, text, uuid, jsonb) from service_role;

-- Re-assert invitation table write denial (mutations remain RPC-only).
revoke insert, update, delete on table public.organization_invitations from authenticated;
revoke insert, update, delete on table public.organization_invitations from anon;
revoke insert, update, delete on table public.organization_invitations from public;
revoke insert, update, delete on table public.organization_invitation_events from authenticated;
revoke insert, update, delete on table public.organization_invitation_events from anon;
revoke insert, update, delete on table public.organization_invitation_events from public;
