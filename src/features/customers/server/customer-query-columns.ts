export const CUSTOMER_LIST_SELECT_COLUMNS =
  "id, organization_id, display_name, status, email, owner_member_id, started_at, updated_at, archived_at" as const;

export const CUSTOMER_DETAIL_SELECT_COLUMNS =
  "id, organization_id, display_name, first_name, last_name, email, phone, status, owner_member_id, created_by_member_id, started_at, ended_at, archived_at, created_at, updated_at" as const;

export const CUSTOMER_HISTORY_SELECT_COLUMNS =
  "id, organization_id, customer_id, from_status, to_status, changed_by_member_id, reason, source, changed_at" as const;

export const CUSTOMER_ENROLLMENT_SUMMARY_SELECT_COLUMNS =
  "id, program_id, status, enrolled_at" as const;
