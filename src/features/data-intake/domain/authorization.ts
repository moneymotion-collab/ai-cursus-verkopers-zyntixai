export const DATA_INTAKE_ROLES = ["owner", "admin", "staff", "viewer"] as const;

export type DataIntakeOrganizationRole = (typeof DATA_INTAKE_ROLES)[number];

export const DATA_INTAKE_COMMAND_ROLES: readonly DataIntakeOrganizationRole[] = [
  "owner",
  "admin",
];

export type DataIntakeFoundationOperation =
  | "create_session"
  | "register_source"
  | "cancel_session";

export type DataIntakeSourceObjectOperation = "confirm_source_object";

export type DataIntakeSourceStructureOperation = "confirm_source_structure";

export type DataIntakeMappingOperation =
  | "upsert_mapping"
  | "ignore_source_column"
  | "confirm_mapping";

export type DataIntakeStagingOperation = "confirm_source_validation";

export function isKnownDataIntakeRole(
  value: string,
): value is DataIntakeOrganizationRole {
  return (DATA_INTAKE_ROLES as readonly string[]).includes(value);
}

export function canPerformDataIntakeFoundationCommand(
  role: DataIntakeOrganizationRole,
): boolean {
  return DATA_INTAKE_COMMAND_ROLES.includes(role);
}
