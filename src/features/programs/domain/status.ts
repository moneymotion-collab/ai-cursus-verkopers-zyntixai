import type { ProgramStatus } from "@/features/programs/domain/types";

export const PROGRAM_STATUSES = [
  "draft",
  "active",
  "paused",
  "retired",
] as const satisfies readonly ProgramStatus[];

const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  retired: "Retired",
};

const STATUS_DESCRIPTIONS: Record<ProgramStatus, string> = {
  draft: "Program definition that is not yet available for enrollments.",
  active: "Program available for new enrollments.",
  paused: "Temporarily unavailable for new enrollments.",
  retired: "Lifecycle-retired; soft-archive is separate.",
};

/**
 * Mirrors private.is_allowed_program_status_transition.
 * Database RPCs remain authoritative for enforcement.
 */
const ALLOWED_TRANSITIONS: Record<ProgramStatus, readonly ProgramStatus[]> = {
  draft: ["active", "retired"],
  active: ["paused", "retired"],
  paused: ["active", "retired"],
  retired: ["active"],
};

/** Stable display / filter order. */
export const PROGRAM_STATUS_ORDER = [
  "draft",
  "active",
  "paused",
  "retired",
] as const satisfies readonly ProgramStatus[];

export type ProgramStatusMetadata = {
  value: ProgramStatus;
  label: string;
  description: string;
  /** Create RPC always starts as draft. */
  isCreateDefault: boolean;
  /** Soft-archive is orthogonal; no lifecycle status is terminal here. */
  isLifecycleTerminal: boolean;
};

export const PROGRAM_STATUS_METADATA: readonly ProgramStatusMetadata[] =
  PROGRAM_STATUS_ORDER.map((value) => ({
    value,
    label: STATUS_LABELS[value],
    description: STATUS_DESCRIPTIONS[value],
    isCreateDefault: value === "draft",
    isLifecycleTerminal: false,
  }));

export function isProgramStatus(value: string): value is ProgramStatus {
  return (PROGRAM_STATUSES as readonly string[]).includes(value);
}

export function getProgramStatusLabel(status: ProgramStatus): string {
  return STATUS_LABELS[status];
}

export function getProgramStatusDescription(status: ProgramStatus): string {
  return STATUS_DESCRIPTIONS[status];
}

export function getAllowedProgramStatusTransitions(
  fromStatus: ProgramStatus,
): ProgramStatus[] {
  return [...ALLOWED_TRANSITIONS[fromStatus]];
}

export function isAllowedProgramStatusTransition(
  fromStatus: ProgramStatus,
  toStatus: ProgramStatus,
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }

  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}
