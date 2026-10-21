export const LEAD_LIST_SELECT_COLUMNS =
  "id, organization_id, display_name, status, email, owner_member_id, stage_id, source_type, pursuit_label, converted_customer_id, converted_at, created_at, updated_at, archived_at" as const;

export const LEAD_DETAIL_SELECT_COLUMNS =
  "id, organization_id, display_name, first_name, last_name, email, phone, status, owner_member_id, created_by_member_id, stage_id, source_type, source_detail, pursuit_label, converted_customer_id, converted_at, archived_at, created_at, updated_at" as const;

export const LEAD_STATUS_HISTORY_SELECT_COLUMNS =
  "id, organization_id, lead_id, from_status, to_status, changed_by_member_id, reason, source, changed_at" as const;

export const LEAD_STAGE_HISTORY_SELECT_COLUMNS =
  "id, organization_id, lead_id, from_stage_id, to_stage_id, changed_by_member_id, reason, source, changed_at" as const;

export const LEAD_PIPELINE_STAGE_SELECT_COLUMNS =
  "id, organization_id, name, position, stage_category, is_default, archived_at" as const;

export const LEAD_CONVERTED_CUSTOMER_SELECT_COLUMNS =
  "id, display_name, archived_at" as const;
