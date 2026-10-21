import type { ProgramStatus } from "@/features/programs/domain/types";

export function getProgramStatusTransitionEffectExplanation(
  fromStatus: ProgramStatus,
  toStatus: ProgramStatus,
): string | null {
  if (fromStatus === "draft" && toStatus === "active") {
    return "Activating makes this program available for new enrollments.";
  }

  if (toStatus === "paused") {
    return "Pausing temporarily stops new enrollments while keeping the lifecycle status separate from archive.";
  }

  if (toStatus === "retired") {
    return "Retiring ends the active lifecycle. Soft-archive remains a separate action.";
  }

  if (fromStatus === "retired" && toStatus === "active") {
    return "Returning a retired program to Active re-opens it for new enrollments.";
  }

  if (fromStatus === "paused" && toStatus === "active") {
    return "Resuming returns this program to Active for new enrollments.";
  }

  return null;
}
