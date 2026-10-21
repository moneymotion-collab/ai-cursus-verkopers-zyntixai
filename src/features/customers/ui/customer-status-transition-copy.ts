import type { CustomerStatus } from "@/features/customers/domain/types";
import { lifecycleSubjectInSentence } from "@/features/customers/ui/customer-lifecycle-workflow-copy";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";

const TERMINAL_STATUSES = new Set<CustomerStatus>(["completed", "cancelled", "churned"]);

export function getStatusTransitionEffectExplanation(
  fromStatus: CustomerStatus,
  toStatus: CustomerStatus,
  terminology: ProductTerminology = DEFAULT_PRODUCT_TERMINOLOGY,
): string | null {
  const subject = lifecycleSubjectInSentence(terminology);

  if (toStatus === "completed") {
    return `Moving to Completed marks the ${subject} lifecycle as finished while keeping their record available.`;
  }

  if (toStatus === "cancelled") {
    return `Moving to Cancelled records that the ${subject} engagement ended by cancellation.`;
  }

  if (toStatus === "churned") {
    return `Moving to Churned records that the ${subject} has left the service.`;
  }

  if (
    TERMINAL_STATUSES.has(fromStatus) &&
    (toStatus === "active" || toStatus === "onboarding")
  ) {
    return `Returning to Active or Onboarding re-opens the ${subject} for normal engagement workflows.`;
  }

  return null;
}
