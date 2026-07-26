import type { EnrollmentStatus } from "@/features/enrollments/domain/types";

export function getEnrollmentStatusTransitionEffectExplanation(
  fromStatus: EnrollmentStatus,
  toStatus: EnrollmentStatus,
): string | null {
  if (fromStatus === "pending" && toStatus === "active") {
    return "Activating starts the customer's participation in the program.";
  }

  if (toStatus === "paused") {
    return "Pausing temporarily stops participation while keeping the enrollment open.";
  }

  if (fromStatus === "paused" && toStatus === "active") {
    return "Reactivating returns this enrollment to Active participation.";
  }

  if (toStatus === "completed") {
    return "Completing ends participation successfully. Soft-archive remains a separate action.";
  }

  if (toStatus === "cancelled") {
    return "Cancelling ends participation without completion. Soft-archive remains a separate action.";
  }

  return null;
}
