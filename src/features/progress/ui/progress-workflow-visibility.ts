import type {
  ProgressPermissionSet,
  ProgressRole,
} from "@/features/progress/domain/types";

/**
 * B1.6.3 workflow-entry visibility hints for Progress record/void/correct CTAs.
 * Database authorization (RPCs + RLS) remains authoritative.
 */
export function canShowRecordProgressWorkflow(role: ProgressRole): boolean {
  return role === "owner" || role === "admin" || role === "staff";
}

export function canShowVoidProgressWorkflow(
  capabilities: ProgressPermissionSet,
): boolean {
  return capabilities.canVoidFact;
}

export function canShowCorrectProgressWorkflow(
  capabilities: ProgressPermissionSet,
): boolean {
  return capabilities.canCorrectFact;
}
