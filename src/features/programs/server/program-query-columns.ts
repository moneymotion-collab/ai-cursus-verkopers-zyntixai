export const PROGRAM_LIST_SELECT_COLUMNS =
  "id, organization_id, name, status, delivery_mode, created_at, updated_at, archived_at" as const;

export const PROGRAM_DETAIL_SELECT_COLUMNS =
  "id, organization_id, name, description, status, delivery_mode, created_by_member_id, created_at, updated_at, archived_at" as const;

export const PROGRAM_HISTORY_SELECT_COLUMNS =
  "id, organization_id, program_id, from_status, to_status, changed_by_member_id, reason, source, changed_at" as const;
