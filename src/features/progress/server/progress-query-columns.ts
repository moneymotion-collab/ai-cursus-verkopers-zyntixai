export const PROGRESS_FACT_LIST_SELECT_COLUMNS =
  "id, organization_id, enrollment_id, customer_id, program_id, fact_type, source, title, occurred_at, recorded_at, recorded_by_member_id, voided_at, corrected_from_fact_id" as const;

export const PROGRESS_FACT_DETAIL_SELECT_COLUMNS =
  "id, organization_id, enrollment_id, customer_id, program_id, fact_type, source, title, description, numeric_value, numeric_unit, is_complete, sequence_number, idempotency_key, corrected_from_fact_id, occurred_at, recorded_at, recorded_by_member_id, voided_at, voided_by_member_id, void_reason" as const;

export const PROGRESS_ENROLLMENT_SUMMARY_SELECT_COLUMNS =
  "id, status, archived_at, customer_id, program_id" as const;

export const PROGRESS_CUSTOMER_SUMMARY_SELECT_COLUMNS =
  "id, display_name, status, archived_at" as const;

export const PROGRESS_PROGRAM_SUMMARY_SELECT_COLUMNS =
  "id, name, status, archived_at" as const;
