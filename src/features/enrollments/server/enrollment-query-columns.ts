export const ENROLLMENT_LIST_SELECT_COLUMNS =
  "id, organization_id, customer_id, program_id, status, owner_member_id, enrolled_at, updated_at, archived_at" as const;

export const ENROLLMENT_DETAIL_SELECT_COLUMNS =
  "id, organization_id, customer_id, program_id, status, owner_member_id, created_by_member_id, enrolled_at, started_at, completed_at, cancelled_at, source, metadata, created_at, updated_at, archived_at" as const;

export const ENROLLMENT_HISTORY_SELECT_COLUMNS =
  "id, organization_id, enrollment_id, from_status, to_status, changed_by_member_id, reason, source, changed_at" as const;

export const ENROLLMENT_CUSTOMER_SUMMARY_SELECT_COLUMNS =
  "id, display_name, status, archived_at" as const;

export const ENROLLMENT_PROGRAM_SUMMARY_SELECT_COLUMNS =
  "id, name, status, archived_at" as const;
