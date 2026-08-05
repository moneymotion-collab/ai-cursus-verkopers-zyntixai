export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const ATTENTION_ITEM_ID = "55555555-5555-4555-8555-555555555555";
export const ENROLLMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";
export const SIGNAL_ID = "77777777-7777-4777-8777-777777777777";
export const EVENT_ID = "88888888-8888-4888-8888-888888888888";

export const sampleAttentionItemListRow = {
  id: ATTENTION_ITEM_ID,
  organization_id: ORG_ID,
  enrollment_id: ENROLLMENT_ID,
  customer_id: CUSTOMER_ID,
  program_id: PROGRAM_ID,
  title: "No recent progress",
  summary: "Enrollment went quiet",
  status: "open",
  severity: "high",
  assignee_member_id: null,
  detection_count: 1,
  first_detected_at: "2026-08-01T10:00:00.000Z",
  last_detected_at: "2026-08-01T10:00:00.000Z",
  acknowledged_at: null,
  resolved_at: null,
  dismissed_at: null,
  expired_at: null,
  archived_at: null,
  created_at: "2026-08-01T10:00:00.000Z",
  updated_at: "2026-08-01T10:00:00.000Z",
};

export const sampleAttentionItemDetailRow = {
  ...sampleAttentionItemListRow,
  dedupe_key: `enrollment:${ENROLLMENT_ID}:enrollment_no_recent_progress`,
  resolution_reason: null,
  dismissal_reason: null,
  created_by_member_id: MEMBER_ID,
  updated_by_member_id: MEMBER_ID,
};

export const sampleAttentionSignalRow = {
  id: SIGNAL_ID,
  organization_id: ORG_ID,
  attention_item_id: ATTENTION_ITEM_ID,
  enrollment_id: ENROLLMENT_ID,
  signal_origin: "rule",
  rule_key: "enrollment_no_recent_progress",
  explanation: "No progress for 14 days",
  evidence: {
    kind: "stale_progress",
    evaluationOccurredAt: "2026-08-01T10:00:00.000Z",
    ageCalendarDays: 14,
  },
  detected_at: "2026-08-01T10:00:00.000Z",
  created_by_member_id: null,
  created_at: "2026-08-01T10:00:00.000Z",
};

export const sampleAttentionEventRow = {
  id: EVENT_ID,
  organization_id: ORG_ID,
  attention_item_id: ATTENTION_ITEM_ID,
  event_type: "created",
  from_status: null,
  to_status: "open",
  from_severity: null,
  to_severity: "high",
  from_assignee_member_id: null,
  to_assignee_member_id: null,
  reason: null,
  source: "rule",
  actor_member_id: null,
  payload: { rule_key: "enrollment_no_recent_progress" },
  created_at: "2026-08-01T10:00:00.000Z",
};
