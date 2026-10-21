-- ZyntixAI Invitations / Member Administration:
-- Acceptance RPC EXECUTE privilege hardening (Attention / operator style)

-- Public Accept RPC: authenticated only; strip service_role execute
revoke all on function public.accept_organization_invitation(text) from public;
revoke all on function public.accept_organization_invitation(text) from anon;
revoke all on function public.accept_organization_invitation(text) from authenticated;
revoke all on function public.accept_organization_invitation(text) from service_role;
grant execute on function public.accept_organization_invitation(text) to authenticated;

-- Private Acceptance helpers: no app/service execute
revoke all on function private.hash_organization_invitation_raw_token(text) from public;
revoke all on function private.hash_organization_invitation_raw_token(text) from anon;
revoke all on function private.hash_organization_invitation_raw_token(text) from authenticated;
revoke all on function private.hash_organization_invitation_raw_token(text) from service_role;

revoke all on function private.get_organization_invitation_accept_identity() from public;
revoke all on function private.get_organization_invitation_accept_identity() from anon;
revoke all on function private.get_organization_invitation_accept_identity() from authenticated;
revoke all on function private.get_organization_invitation_accept_identity() from service_role;

-- Re-assert invitation table write denial (mutations remain RPC-only).
revoke insert, update, delete on table public.organization_invitations from authenticated;
revoke insert, update, delete on table public.organization_invitations from anon;
revoke insert, update, delete on table public.organization_invitations from public;
revoke insert, update, delete on table public.organization_invitation_events from authenticated;
revoke insert, update, delete on table public.organization_invitation_events from anon;
revoke insert, update, delete on table public.organization_invitation_events from public;
