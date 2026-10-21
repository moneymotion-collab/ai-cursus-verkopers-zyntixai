-- ZyntixAI B1.7.3 Attention RPC Foundation:
-- privilege re-assertion (table SELECT + RPC EXECUTE hardening)

revoke all on table public.attention_items from public;
revoke all on table public.attention_items from anon;
revoke all on table public.attention_items from authenticated;
grant select on table public.attention_items to authenticated;

revoke all on table public.attention_signals from public;
revoke all on table public.attention_signals from anon;
revoke all on table public.attention_signals from authenticated;
grant select on table public.attention_signals to authenticated;

revoke all on table public.attention_item_events from public;
revoke all on table public.attention_item_events from anon;
revoke all on table public.attention_item_events from authenticated;
grant select on table public.attention_item_events to authenticated;

-- Public RPCs: revoke broadly, grant execute to authenticated only
revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from public;
revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from anon;
revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from authenticated;
revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from service_role;
grant execute on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) to authenticated;

revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from public;
revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from anon;
revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from authenticated;
revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from service_role;
grant execute on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) to authenticated;

revoke all on function public.acknowledge_attention_item(uuid, uuid) from public;
revoke all on function public.acknowledge_attention_item(uuid, uuid) from anon;
revoke all on function public.acknowledge_attention_item(uuid, uuid) from authenticated;
revoke all on function public.acknowledge_attention_item(uuid, uuid) from service_role;
grant execute on function public.acknowledge_attention_item(uuid, uuid) to authenticated;

revoke all on function public.assign_attention_item(uuid, uuid, uuid) from public;
revoke all on function public.assign_attention_item(uuid, uuid, uuid) from anon;
revoke all on function public.assign_attention_item(uuid, uuid, uuid) from authenticated;
revoke all on function public.assign_attention_item(uuid, uuid, uuid) from service_role;
grant execute on function public.assign_attention_item(uuid, uuid, uuid) to authenticated;

revoke all on function public.update_attention_severity(uuid, uuid, text) from public;
revoke all on function public.update_attention_severity(uuid, uuid, text) from anon;
revoke all on function public.update_attention_severity(uuid, uuid, text) from authenticated;
revoke all on function public.update_attention_severity(uuid, uuid, text) from service_role;
grant execute on function public.update_attention_severity(uuid, uuid, text) to authenticated;

revoke all on function public.resolve_attention_item(uuid, uuid, text) from public;
revoke all on function public.resolve_attention_item(uuid, uuid, text) from anon;
revoke all on function public.resolve_attention_item(uuid, uuid, text) from authenticated;
revoke all on function public.resolve_attention_item(uuid, uuid, text) from service_role;
grant execute on function public.resolve_attention_item(uuid, uuid, text) to authenticated;

revoke all on function public.dismiss_attention_item(uuid, uuid, text) from public;
revoke all on function public.dismiss_attention_item(uuid, uuid, text) from anon;
revoke all on function public.dismiss_attention_item(uuid, uuid, text) from authenticated;
revoke all on function public.dismiss_attention_item(uuid, uuid, text) from service_role;
grant execute on function public.dismiss_attention_item(uuid, uuid, text) to authenticated;

revoke all on function public.archive_attention_item(uuid, uuid) from public;
revoke all on function public.archive_attention_item(uuid, uuid) from anon;
revoke all on function public.archive_attention_item(uuid, uuid) from authenticated;
revoke all on function public.archive_attention_item(uuid, uuid) from service_role;
grant execute on function public.archive_attention_item(uuid, uuid) to authenticated;

revoke all on function public.evaluate_attention_rules(uuid, uuid) from public;
revoke all on function public.evaluate_attention_rules(uuid, uuid) from anon;
revoke all on function public.evaluate_attention_rules(uuid, uuid) from authenticated;
revoke all on function public.evaluate_attention_rules(uuid, uuid) from service_role;
grant execute on function public.evaluate_attention_rules(uuid, uuid) to authenticated;

-- Private helpers: no execute for app/service roles
revoke all on function private.get_attention_actor_membership(uuid) from public;
revoke all on function private.get_attention_actor_membership(uuid) from anon;
revoke all on function private.get_attention_actor_membership(uuid) from authenticated;
revoke all on function private.get_attention_actor_membership(uuid) from service_role;

revoke all on function private.assert_active_attention_organization(uuid) from public;
revoke all on function private.assert_active_attention_organization(uuid) from anon;
revoke all on function private.assert_active_attention_organization(uuid) from authenticated;
revoke all on function private.assert_active_attention_organization(uuid) from service_role;

revoke all on function private.require_attention_actor(uuid, text[]) from public;
revoke all on function private.require_attention_actor(uuid, text[]) from anon;
revoke all on function private.require_attention_actor(uuid, text[]) from authenticated;
revoke all on function private.require_attention_actor(uuid, text[]) from service_role;

revoke all on function private.validate_attention_member_assignment(uuid, uuid) from public;
revoke all on function private.validate_attention_member_assignment(uuid, uuid) from anon;
revoke all on function private.validate_attention_member_assignment(uuid, uuid) from authenticated;
revoke all on function private.validate_attention_member_assignment(uuid, uuid) from service_role;

revoke all on function private.is_allowed_attention_status_transition(text, text) from public;
revoke all on function private.is_allowed_attention_status_transition(text, text) from anon;
revoke all on function private.is_allowed_attention_status_transition(text, text) from authenticated;
revoke all on function private.is_allowed_attention_status_transition(text, text) from service_role;

revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from public;
revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from anon;
revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from authenticated;
revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from service_role;

revoke all on function private.validate_attention_signal_evidence(jsonb) from public;
revoke all on function private.validate_attention_signal_evidence(jsonb) from anon;
revoke all on function private.validate_attention_signal_evidence(jsonb) from authenticated;
revoke all on function private.validate_attention_signal_evidence(jsonb) from service_role;

revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from public;
revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from anon;
revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from authenticated;
revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from service_role;

revoke all on function private.lock_attention_item(uuid, uuid) from public;
revoke all on function private.lock_attention_item(uuid, uuid) from anon;
revoke all on function private.lock_attention_item(uuid, uuid) from authenticated;
revoke all on function private.lock_attention_item(uuid, uuid) from service_role;

revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from public;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from anon;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from authenticated;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from service_role;

revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from public;
revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from anon;
revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from authenticated;
revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from service_role;

revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from public;
revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from anon;
revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from authenticated;
revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from service_role;

revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from public;
revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from anon;
revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from authenticated;
revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from service_role;

revoke all on function private.guard_attention_item_event_immutable() from public;
revoke all on function private.guard_attention_item_event_immutable() from anon;
revoke all on function private.guard_attention_item_event_immutable() from authenticated;
revoke all on function private.guard_attention_item_event_immutable() from service_role;
