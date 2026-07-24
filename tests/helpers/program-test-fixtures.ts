import type {
  ProgramDetailReadModel,
  ProgramListItemReadModel,
  ProgramStatusHistoryEntry,
} from "@/features/programs/domain/read-types";
import type { ProgramMutationResult } from "@/features/programs/domain/types";
import { PROGRAM_MUTATION_REFRESH_HINTS } from "@/features/programs/domain/types";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";

export const sampleProgramListItem: ProgramListItemReadModel = {
  id: PROGRAM_ID,
  organizationId: ORG_ID,
  name: "Growth Lab",
  status: "active",
  statusLabel: "Active",
  deliveryMode: "cohort",
  deliveryModeLabel: "Cohort",
  openEnrollmentCount: 2,
  updatedAt: "2026-07-14T12:00:00.000Z",
  createdAt: "2026-07-01T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false },
};

export const sampleProgramDetail: ProgramDetailReadModel = {
  id: PROGRAM_ID,
  organizationId: ORG_ID,
  name: "Growth Lab",
  description: "Cohort coaching program",
  status: "draft",
  statusLabel: "Draft",
  deliveryMode: "cohort",
  deliveryModeLabel: "Cohort",
  createdByMemberId: MEMBER_ID,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  archivedAt: null,
  openEnrollmentCount: 0,
  derived: {
    isArchived: false,
    allowedTransitions: ["active", "retired"],
  },
};

export const sampleProgramHistory: ProgramStatusHistoryEntry = {
  id: "55555555-5555-4555-8555-555555555555",
  organizationId: ORG_ID,
  programId: PROGRAM_ID,
  fromStatus: null,
  toStatus: "draft",
  fromStatusLabel: null,
  toStatusLabel: "Draft",
  changedByMemberId: MEMBER_ID,
  reason: null,
  source: "manual",
  changedAt: "2026-07-01T10:00:00.000Z",
};

export const createProgramInput = {
  organizationId: ORG_ID,
  name: "Growth Lab",
  deliveryMode: "cohort" as const,
  description: "Intro",
};

export function createProgramSuccessResult(): ProgramMutationResult {
  return {
    ok: true,
    operation: "create",
    programId: PROGRAM_ID,
    program: sampleProgramDetail,
    committed: true,
    refreshRequired: false,
    refreshHints: PROGRAM_MUTATION_REFRESH_HINTS.create,
  };
}
