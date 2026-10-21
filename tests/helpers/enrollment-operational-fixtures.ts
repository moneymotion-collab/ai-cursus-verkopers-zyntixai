import type { EnrollmentOperationalSnapshot } from "@/features/enrollments/domain/operational-metadata";
import type { EnrollmentListOperationalHints } from "@/features/enrollments/domain/operational-metadata";
import { ENROLLMENT_ID, ORG_ID } from "./enrollment-test-fixtures";

export function sampleEnrollmentOperationalSnapshot(
  overrides?: Partial<EnrollmentOperationalSnapshot>,
): EnrollmentOperationalSnapshot {
  return {
    enrollmentId: ENROLLMENT_ID,
    organizationId: ORG_ID,
    progress: {
      nonVoidedFactCount: 1,
      latest: {
        factId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "Unit 1 complete",
        factType: "unit_completed",
        factTypeLabel: "Unit completed",
        occurredAt: "2026-08-18T12:00:00.000Z",
      },
      progressReferenceAt: "2026-08-18T12:00:00.000Z",
      ageCalendarDays: 2,
      health: "healthy",
      healthLabel: "Progress current",
      staleEligible: true,
      stale: false,
    },
    attention: {
      openCount: 0,
      items: [],
    },
    nextAction: {
      label: "View Attention for enrollment",
      href: `/attention?org=${ORG_ID}&enrollmentId=${ENROLLMENT_ID}`,
      reason: "Review related Attention in the Attention workspace.",
    },
    ...overrides,
  };
}

export function sampleEnrollmentListOperationalHints(
  enrollmentId: string = ENROLLMENT_ID,
): EnrollmentListOperationalHints {
  return {
    byEnrollmentId: {
      [enrollmentId]: {
        latestProgressOccurredAt: "2026-08-18T12:00:00.000Z",
        latestProgressTitle: "Unit 1 complete",
        health: "healthy",
        healthLabel: "Progress current",
        openAttentionCount: 0,
        highestOpenAttentionSeverity: null,
      },
    },
  };
}
