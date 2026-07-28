import { canShowRecordProgressWorkflow } from "./progress-workflow-visibility";
import type { ProgressRole } from "@/features/progress/domain/types";
import { isKnownProgressRole } from "@/features/progress/domain/permissions";

export function canShowEnrollmentRecordProgressEntry(params: {
  role: ProgressRole | string;
  enrollmentStatus: string;
  isArchived: boolean;
}): boolean {
  if (params.isArchived) return false;
  if (params.enrollmentStatus !== "active" && params.enrollmentStatus !== "paused") {
    return false;
  }
  if (!isKnownProgressRole(params.role)) return false;
  return canShowRecordProgressWorkflow(params.role);
}
