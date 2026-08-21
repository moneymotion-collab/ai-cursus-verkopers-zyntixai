export const ATTENTION_ITEM_LIST_SELECT_COLUMNS =
  "id, organization_id, enrollment_id, customer_id, program_id, source_type, source_entity_id, title, summary, status, severity, assignee_member_id, detection_count, first_detected_at, last_detected_at, acknowledged_at, resolved_at, dismissed_at, expired_at, archived_at, created_at, updated_at" as const;

export const ATTENTION_ITEM_DETAIL_SELECT_COLUMNS =
  "id, organization_id, enrollment_id, customer_id, program_id, source_type, source_entity_id, social_publication_id, social_connection_id, title, summary, status, severity, assignee_member_id, dedupe_key, detection_count, first_detected_at, last_detected_at, acknowledged_at, resolved_at, dismissed_at, expired_at, resolution_reason, dismissal_reason, archived_at, created_by_member_id, updated_by_member_id, created_at, updated_at" as const;

export const ATTENTION_SIGNAL_SELECT_COLUMNS =
  "id, organization_id, attention_item_id, enrollment_id, signal_origin, rule_key, explanation, evidence, detected_at, created_by_member_id, created_at" as const;

export const ATTENTION_EVENT_SELECT_COLUMNS =
  "id, organization_id, attention_item_id, event_type, from_status, to_status, from_severity, to_severity, from_assignee_member_id, to_assignee_member_id, reason, source, actor_member_id, payload, created_at" as const;

export const ATTENTION_ENROLLMENT_SUMMARY_SELECT_COLUMNS =
  "id, status, archived_at, customer_id, program_id" as const;

export const ATTENTION_CUSTOMER_SUMMARY_SELECT_COLUMNS =
  "id, display_name, status, archived_at" as const;

export const ATTENTION_PROGRAM_SUMMARY_SELECT_COLUMNS =
  "id, name, status, archived_at" as const;
