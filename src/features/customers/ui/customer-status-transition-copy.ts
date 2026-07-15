import type { CustomerStatus } from "@/features/customers/domain/types";

const TERMINAL_STATUSES = new Set<CustomerStatus>(["completed", "cancelled", "churned"]);

export function getStatusTransitionEffectExplanation(
  fromStatus: CustomerStatus,
  toStatus: CustomerStatus,
): string | null {
  if (toStatus === "completed") {
    return "Moving to Completed marks the customer lifecycle as finished while keeping their record available.";
  }

  if (toStatus === "cancelled") {
    return "Moving to Cancelled records that the customer engagement ended by cancellation.";
  }

  if (toStatus === "churned") {
    return "Moving to Churned records that the customer has left the service.";
  }

  if (
    TERMINAL_STATUSES.has(fromStatus) &&
    (toStatus === "active" || toStatus === "onboarding")
  ) {
    return "Returning to Active or Onboarding re-opens the customer for normal engagement workflows.";
  }

  return null;
}
