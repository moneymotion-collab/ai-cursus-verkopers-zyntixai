import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";

export function canShowCreateEnrollmentWorkflow(role: EnrollmentRole): boolean {
  return resolveEnrollmentPermissions(role).canCreateEnrollment;
}
