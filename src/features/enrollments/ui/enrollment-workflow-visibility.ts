import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";

type EnrollmentWorkflowTarget = Pick<EnrollmentDetailReadModel, "derived">;

export function canShowCreateEnrollmentWorkflow(role: EnrollmentRole): boolean {
  return resolveEnrollmentPermissions(role).canCreateEnrollment;
}

/**
 * Owner reassignment only — no metadata product UI exists (no approved metadata
 * fields), so this gate covers exactly what /enrollments/[id]/edit exposes.
 */
export function canShowEditEnrollmentWorkflow(
  enrollment: EnrollmentWorkflowTarget,
  role: EnrollmentRole,
): boolean {
  const permissions = resolveEnrollmentPermissions(role, {
    isArchived: enrollment.derived.isArchived,
  });
  return permissions.canUpdateOwnerOrMetadata && !enrollment.derived.isArchived;
}

export function canShowStatusEnrollmentWorkflow(
  enrollment: EnrollmentWorkflowTarget,
  role: EnrollmentRole,
): boolean {
  const permissions = resolveEnrollmentPermissions(role, {
    isArchived: enrollment.derived.isArchived,
  });
  return (
    permissions.canTransitionEnrollmentStatus &&
    !enrollment.derived.isArchived &&
    enrollment.derived.allowedTransitions.length > 0
  );
}

/** Archive is terminal-only (completed|cancelled), Owner/Admin only. */
export function canShowArchiveEnrollmentWorkflow(
  enrollment: EnrollmentWorkflowTarget,
  role: EnrollmentRole,
): boolean {
  const permissions = resolveEnrollmentPermissions(role, {
    isArchived: enrollment.derived.isArchived,
  });
  return (
    permissions.canArchiveEnrollment &&
    !enrollment.derived.isArchived &&
    enrollment.derived.isTerminal
  );
}

export function canShowRestoreEnrollmentWorkflow(
  enrollment: EnrollmentWorkflowTarget,
  role: EnrollmentRole,
): boolean {
  const permissions = resolveEnrollmentPermissions(role, {
    isArchived: enrollment.derived.isArchived,
  });
  return permissions.canRestoreEnrollment && enrollment.derived.isArchived;
}
