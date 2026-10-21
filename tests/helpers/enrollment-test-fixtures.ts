import type {
  EnrollmentDetailReadModel,
  EnrollmentListItemReadModel,
  EnrollmentStatusHistoryEntry,
} from "@/features/enrollments/domain/read-types";
import type { EnrollmentMutationResult } from "@/features/enrollments/domain/types";
import { ENROLLMENT_MUTATION_REFRESH_HINTS } from "@/features/enrollments/domain/types";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const ENROLLMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";

export const sampleEnrollmentListItem: EnrollmentListItemReadModel = {
  id: ENROLLMENT_ID,
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  programId: PROGRAM_ID,
  customerDisplayName: "Acme Corp",
  programName: "Growth Lab",
  status: "active",
  statusLabel: "Active",
  ownerMemberId: MEMBER_ID,
  enrolledAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false, isOpen: true, isTerminal: false },
};

export const sampleEnrollmentDetail: EnrollmentDetailReadModel = {
  id: ENROLLMENT_ID,
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  programId: PROGRAM_ID,
  status: "active",
  statusLabel: "Active",
  ownerMemberId: MEMBER_ID,
  createdByMemberId: MEMBER_ID,
  enrolledAt: "2026-07-01T10:00:00.000Z",
  startedAt: "2026-07-01T10:00:00.000Z",
  completedAt: null,
  cancelledAt: null,
  source: "manual",
  metadata: {},
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  archivedAt: null,
  customer: {
    id: CUSTOMER_ID,
    displayName: "Acme Corp",
    status: "active",
    archivedAt: null,
  },
  program: {
    id: PROGRAM_ID,
    name: "Growth Lab",
    status: "active",
    archivedAt: null,
  },
  derived: {
    isArchived: false,
    isOpen: true,
    isTerminal: false,
    allowedTransitions: ["paused", "completed", "cancelled"],
  },
};

export const sampleArchivedEnrollmentDetail: EnrollmentDetailReadModel = {
  ...sampleEnrollmentDetail,
  status: "completed",
  statusLabel: "Completed",
  completedAt: "2026-07-18T09:00:00.000Z",
  archivedAt: "2026-07-20T09:00:00.000Z",
  derived: {
    isArchived: true,
    isOpen: false,
    isTerminal: true,
    allowedTransitions: [],
  },
};

export const sampleEnrollmentHistory: EnrollmentStatusHistoryEntry = {
  id: "55555555-5555-4555-8555-555555555555",
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
  fromStatus: "pending",
  toStatus: "active",
  fromStatusLabel: "Pending",
  toStatusLabel: "Active",
  changedByMemberId: MEMBER_ID,
  reason: null,
  source: "manual",
  changedAt: "2026-07-01T10:00:00.000Z",
};

export const createEnrollmentInput = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  programId: PROGRAM_ID,
  initialStatus: "pending" as const,
  metadata: {},
};

export const transitionEnrollmentInput = {
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
  toStatus: "active" as const,
  reason: "Onboarding complete",
};

export const archiveEnrollmentInput = {
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
};

export const restoreEnrollmentInput = {
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
};

export const updateOwnerMetadataInput = {
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
  ownerMemberId: MEMBER_ID,
};

export function createEnrollmentSuccessResult(): EnrollmentMutationResult {
  return {
    ok: true,
    operation: "create",
    enrollmentId: ENROLLMENT_ID,
    enrollment: sampleEnrollmentDetail,
    committed: true,
    refreshRequired: false,
    refreshHints: ENROLLMENT_MUTATION_REFRESH_HINTS.create,
  };
}

export function updateOwnerMetadataSuccessResult(): EnrollmentMutationResult {
  return {
    ok: true,
    operation: "update_owner_metadata",
    enrollmentId: ENROLLMENT_ID,
    enrollment: sampleEnrollmentDetail,
    committed: true,
    refreshRequired: false,
    refreshHints: ENROLLMENT_MUTATION_REFRESH_HINTS.update_owner_metadata,
  };
}

export function transitionEnrollmentSuccessResult(): EnrollmentMutationResult {
  return {
    ok: true,
    operation: "transition_status",
    enrollmentId: ENROLLMENT_ID,
    enrollment: {
      ...sampleEnrollmentDetail,
      status: "active",
      statusLabel: "Active",
      derived: {
        isArchived: false,
        isOpen: true,
        isTerminal: false,
        allowedTransitions: ["paused", "completed", "cancelled"],
      },
    },
    committed: true,
    refreshRequired: false,
    refreshHints: ENROLLMENT_MUTATION_REFRESH_HINTS.transition_status,
  };
}

export function archiveEnrollmentSuccessResult(): EnrollmentMutationResult {
  return {
    ok: true,
    operation: "archive",
    enrollmentId: ENROLLMENT_ID,
    enrollment: sampleArchivedEnrollmentDetail,
    committed: true,
    refreshRequired: false,
    refreshHints: ENROLLMENT_MUTATION_REFRESH_HINTS.archive,
  };
}

export function restoreEnrollmentSuccessResult(): EnrollmentMutationResult {
  return {
    ok: true,
    operation: "restore",
    enrollmentId: ENROLLMENT_ID,
    enrollment: sampleEnrollmentDetail,
    committed: true,
    refreshRequired: false,
    refreshHints: ENROLLMENT_MUTATION_REFRESH_HINTS.restore,
  };
}
