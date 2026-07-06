-- ZyntixAI Programs & Enrollments Core: security hardening (privilege re-assertion)

revoke all on function private.get_program_enrollment_actor_membership(uuid) from public;
revoke all on function private.get_program_enrollment_actor_membership(uuid) from anon;
revoke all on function private.get_program_enrollment_actor_membership(uuid) from authenticated;

revoke all on function private.is_allowed_program_status_transition(text, text) from public;
revoke all on function private.is_allowed_program_status_transition(text, text) from anon;
revoke all on function private.is_allowed_program_status_transition(text, text) from authenticated;

revoke all on function private.is_allowed_enrollment_status_transition(text, text) from public;
revoke all on function private.is_allowed_enrollment_status_transition(text, text) from anon;
revoke all on function private.is_allowed_enrollment_status_transition(text, text) from authenticated;

revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_program_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_enrollment_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from public;
revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from anon;
revoke all on function private.validate_enrollment_owner_assignment(uuid, uuid) from authenticated;

revoke all on function private.guard_enrollment_owner_assignment_trigger() from public;
revoke all on function private.guard_enrollment_owner_assignment_trigger() from anon;
revoke all on function private.guard_enrollment_owner_assignment_trigger() from authenticated;

revoke insert, update, delete on public.programs from authenticated;
revoke insert, update, delete on public.enrollments from authenticated;
revoke insert, update, delete on public.program_status_history from authenticated;
revoke insert, update, delete on public.enrollment_status_history from authenticated;

grant select on public.programs to authenticated;
grant select on public.program_status_history to authenticated;
grant select on public.enrollments to authenticated;
grant update (owner_member_id, metadata) on public.enrollments to authenticated;
grant select on public.enrollment_status_history to authenticated;
