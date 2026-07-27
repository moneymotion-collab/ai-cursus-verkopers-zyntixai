import {
  enrollmentAllowsManualProgressRecord,
  enrollmentAllowsProgressCorrectionOrVoid,
} from "@/features/progress/domain/fact-types";
import type {
  ProgressEnrollmentStatus,
  ProgressPermissionSet,
  ProgressRole,
} from "@/features/progress/domain/types";
import { EMPTY_PROGRESS_PERMISSIONS } from "@/features/progress/domain/types";

const KNOWN_ROLES: readonly ProgressRole[] = [
  "owner",
  "admin",
  "staff",
  "viewer",
];

export function isKnownProgressRole(role: string): role is ProgressRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type ProgressPermissionContext = {
  isVoided?: boolean;
  enrollmentStatus?: ProgressEnrollmentStatus | null;
  enrollmentArchivedAt?: string | null;
};

/**
 * Pure UI/server convenience hints derived from proven Progress RPC + RLS behavior.
 * Database authorization remains authoritative.
 *
 * Proven matrix:
 * - List/view non-voided on non-archived enrollment: all members
 * - View voided: owner/admin only
 * - Manual record: owner/admin/staff on active/paused
 * - Correction/void: owner/admin on active/paused/completed/cancelled;
 *   staff on active/paused only
 * - Viewer: read non-voided only
 */
export function resolveProgressPermissions(
  role: ProgressRole | null | undefined,
  context: ProgressPermissionContext = {},
): ProgressPermissionSet {
  if (!role) {
    return { ...EMPTY_PROGRESS_PERMISSIONS };
  }

  const enrollmentArchivedAt = context.enrollmentArchivedAt ?? null;
  const enrollmentStatus = context.enrollmentStatus ?? null;
  const isVoided = context.isVoided === true;
  const enrollmentArchived = enrollmentArchivedAt != null;

  const canMutateManual = enrollmentAllowsManualProgressRecord(
    enrollmentStatus,
    enrollmentArchivedAt,
  );
  const canMutateCorrectionOrVoid = enrollmentAllowsProgressCorrectionOrVoid({
    status: enrollmentStatus,
    archivedAt: enrollmentArchivedAt,
    role,
  });

  switch (role) {
    case "owner":
    case "admin":
      return {
        canListFacts: true,
        canViewFact: true,
        canViewVoidedFacts: true,
        canRecordManualFact:
          !isVoided && !enrollmentArchived && canMutateManual,
        canCorrectFact:
          !isVoided && !enrollmentArchived && canMutateCorrectionOrVoid,
        canVoidFact:
          !isVoided && !enrollmentArchived && canMutateCorrectionOrVoid,
      };
    case "staff":
      return {
        canListFacts: !enrollmentArchived,
        canViewFact: !enrollmentArchived && !isVoided,
        canViewVoidedFacts: false,
        canRecordManualFact:
          !isVoided && !enrollmentArchived && canMutateManual,
        canCorrectFact:
          !isVoided && !enrollmentArchived && canMutateCorrectionOrVoid,
        canVoidFact:
          !isVoided && !enrollmentArchived && canMutateCorrectionOrVoid,
      };
    case "viewer":
      return {
        canListFacts: !enrollmentArchived,
        canViewFact: !enrollmentArchived && !isVoided,
        canViewVoidedFacts: false,
        canRecordManualFact: false,
        canCorrectFact: false,
        canVoidFact: false,
      };
    default:
      return { ...EMPTY_PROGRESS_PERMISSIONS };
  }
}
