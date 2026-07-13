-- ZyntixAI D3 Tasks Core M5: security hardening (privilege re-assertion)

revoke all on table public.tasks from public;
revoke all on table public.tasks from anon;
revoke all on table public.tasks from authenticated;
grant select on table public.tasks to authenticated;

revoke all on table public.task_status_history from public;
revoke all on table public.task_status_history from anon;
revoke all on table public.task_status_history from authenticated;
grant select on table public.task_status_history to authenticated;

revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from public;
revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from anon;
revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from authenticated;
revoke all on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) from service_role;
grant execute on function public.create_task(
  uuid, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, text, jsonb
) to authenticated;

revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from public;
revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from anon;
revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from authenticated;
revoke all on function public.update_task(uuid, uuid, text, text, text, text, jsonb) from service_role;
grant execute on function public.update_task(uuid, uuid, text, text, text, text, jsonb) to authenticated;

revoke all on function public.reassign_task(uuid, uuid, uuid) from public;
revoke all on function public.reassign_task(uuid, uuid, uuid) from anon;
revoke all on function public.reassign_task(uuid, uuid, uuid) from authenticated;
revoke all on function public.reassign_task(uuid, uuid, uuid) from service_role;
grant execute on function public.reassign_task(uuid, uuid, uuid) to authenticated;

revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from public;
revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from anon;
revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from authenticated;
revoke all on function public.reschedule_task(uuid, uuid, timestamptz) from service_role;
grant execute on function public.reschedule_task(uuid, uuid, timestamptz) to authenticated;

revoke all on function public.complete_task(uuid, uuid, text) from public;
revoke all on function public.complete_task(uuid, uuid, text) from anon;
revoke all on function public.complete_task(uuid, uuid, text) from authenticated;
revoke all on function public.complete_task(uuid, uuid, text) from service_role;
grant execute on function public.complete_task(uuid, uuid, text) to authenticated;

revoke all on function public.cancel_task(uuid, uuid, text) from public;
revoke all on function public.cancel_task(uuid, uuid, text) from anon;
revoke all on function public.cancel_task(uuid, uuid, text) from authenticated;
revoke all on function public.cancel_task(uuid, uuid, text) from service_role;
grant execute on function public.cancel_task(uuid, uuid, text) to authenticated;

revoke all on function public.archive_task(uuid, uuid) from public;
revoke all on function public.archive_task(uuid, uuid) from anon;
revoke all on function public.archive_task(uuid, uuid) from authenticated;
revoke all on function public.archive_task(uuid, uuid) from service_role;
grant execute on function public.archive_task(uuid, uuid) to authenticated;

revoke all on function public.restore_task(uuid, uuid) from public;
revoke all on function public.restore_task(uuid, uuid) from anon;
revoke all on function public.restore_task(uuid, uuid) from authenticated;
revoke all on function public.restore_task(uuid, uuid) from service_role;
grant execute on function public.restore_task(uuid, uuid) to authenticated;

revoke all on function private.get_task_actor_membership(uuid) from public;
revoke all on function private.get_task_actor_membership(uuid) from anon;
revoke all on function private.get_task_actor_membership(uuid) from authenticated;
revoke all on function private.get_task_actor_membership(uuid) from service_role;

revoke all on function private.effective_organization_timezone(uuid) from public;
revoke all on function private.effective_organization_timezone(uuid) from anon;
revoke all on function private.effective_organization_timezone(uuid) from authenticated;
revoke all on function private.effective_organization_timezone(uuid) from service_role;

revoke all on function private.is_allowed_task_status_transition(text, text) from public;
revoke all on function private.is_allowed_task_status_transition(text, text) from anon;
revoke all on function private.is_allowed_task_status_transition(text, text) from authenticated;
revoke all on function private.is_allowed_task_status_transition(text, text) from service_role;

revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;
revoke all on function private.insert_task_status_history(uuid, uuid, text, text, uuid, text, text) from service_role;

revoke all on function private.validate_task_member_assignment(uuid, uuid) from public;
revoke all on function private.validate_task_member_assignment(uuid, uuid) from anon;
revoke all on function private.validate_task_member_assignment(uuid, uuid) from authenticated;
revoke all on function private.validate_task_member_assignment(uuid, uuid) from service_role;

revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from public;
revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from anon;
revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from authenticated;
revoke all on function private.validate_task_linked_entities_not_archived(uuid, uuid, uuid, uuid) from service_role;

revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from public;
revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from anon;
revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from authenticated;
revoke all on function private.validate_task_linked_entities_restorable(uuid, uuid, uuid, uuid) from service_role;

revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from public;
revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from anon;
revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from authenticated;
revoke all on function private.assert_task_predecessor_acyclic(uuid, uuid, uuid) from service_role;

revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from anon;
revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from authenticated;
revoke all on function private.task_payload_idempotency_matches(public.tasks, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, uuid, uuid) from service_role;

revoke all on function private.assert_active_task_organization(uuid) from public;
revoke all on function private.assert_active_task_organization(uuid) from anon;
revoke all on function private.assert_active_task_organization(uuid) from authenticated;
revoke all on function private.assert_active_task_organization(uuid) from service_role;

revoke all on function private.require_task_actor(uuid, text[]) from public;
revoke all on function private.require_task_actor(uuid, text[]) from anon;
revoke all on function private.require_task_actor(uuid, text[]) from authenticated;
revoke all on function private.require_task_actor(uuid, text[]) from service_role;

revoke all on function private.guard_task_predecessor_immutable() from public;
revoke all on function private.guard_task_predecessor_immutable() from anon;
revoke all on function private.guard_task_predecessor_immutable() from authenticated;
revoke all on function private.guard_task_predecessor_immutable() from service_role;
