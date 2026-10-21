/**
 * B1-C4 enrollment operational metadata — deterministic presentation contracts.
 * No persistence. Derives from existing Enrollment + Progress + Attention data only.
 */

import type { AttentionSeverity } from "@/features/attention/domain/types";
import type { ProgressFactType } from "@/features/progress/domain/types";

export type EnrollmentProgressHealth =
  | "healthy"
  | "no_recent_progress"
  | "no_progress_yet"
  | "not_applicable";

export type EnrollmentLatestProgressSummary = {
  factId: string;
  title: string;
  factType: ProgressFactType;
  factTypeLabel: string;
  occurredAt: string;
};

export type EnrollmentOpenAttentionSummaryItem = {
  id: string;
  title: string;
  severity: AttentionSeverity;
  status: "open" | "acknowledged";
  href: string;
};

export type EnrollmentOperationalNextAction = {
  label: string;
  href: string;
  reason: string;
};

export type EnrollmentOperationalProgressSnapshot = {
  nonVoidedFactCount: number;
  latest: EnrollmentLatestProgressSummary | null;
  /** Progress reference used by B1-C3 stale rule (latest fact or enrollment created_at). */
  progressReferenceAt: string;
  ageCalendarDays: number | null;
  health: EnrollmentProgressHealth;
  healthLabel: string;
  staleEligible: boolean;
  stale: boolean;
};

export type EnrollmentOperationalAttentionSnapshot = {
  openCount: number;
  items: EnrollmentOpenAttentionSummaryItem[];
};

export type EnrollmentOperationalSnapshot = {
  enrollmentId: string;
  organizationId: string;
  progress: EnrollmentOperationalProgressSnapshot;
  attention: EnrollmentOperationalAttentionSnapshot;
  nextAction: EnrollmentOperationalNextAction | null;
};

export type EnrollmentListOperationalHints = {
  byEnrollmentId: Record<
    string,
    {
      latestProgressOccurredAt: string | null;
      latestProgressTitle: string | null;
      health: EnrollmentProgressHealth;
      healthLabel: string;
      openAttentionCount: number;
      highestOpenAttentionSeverity: AttentionSeverity | null;
    }
  >;
};

export function enrollmentProgressHealthLabel(
  health: EnrollmentProgressHealth,
): string {
  switch (health) {
    case "healthy":
      return "Progress current";
    case "no_recent_progress":
      return "No recent progress";
    case "no_progress_yet":
      return "No progress recorded";
    case "not_applicable":
      return "Progress check not applicable";
    default:
      return "Progress";
  }
}
