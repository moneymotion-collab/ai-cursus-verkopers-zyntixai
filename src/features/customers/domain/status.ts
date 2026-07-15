import type { CustomerStatus } from "@/features/customers/domain/types";

export const CUSTOMER_STATUSES = [
  "onboarding",
  "active",
  "paused",
  "completed",
  "cancelled",
  "churned",
] as const satisfies readonly CustomerStatus[];

const STATUS_LABELS: Record<CustomerStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
  churned: "Churned",
};

const ALLOWED_TRANSITIONS: Record<CustomerStatus, readonly CustomerStatus[]> = {
  onboarding: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled", "churned"],
  paused: ["active", "completed", "cancelled", "churned"],
  completed: ["active", "onboarding"],
  cancelled: ["active", "onboarding"],
  churned: ["active", "onboarding"],
};

export function isCustomerStatus(value: string): value is CustomerStatus {
  return (CUSTOMER_STATUSES as readonly string[]).includes(value);
}

export function getCustomerStatusLabel(status: CustomerStatus): string {
  return STATUS_LABELS[status];
}

export function getAllowedCustomerStatusTransitions(
  fromStatus: CustomerStatus,
): CustomerStatus[] {
  return [...ALLOWED_TRANSITIONS[fromStatus]];
}

export function isAllowedCustomerStatusTransition(
  fromStatus: CustomerStatus,
  toStatus: CustomerStatus,
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }

  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: "Pending",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

export function getEnrollmentStatusLabel(status: EnrollmentStatus): string {
  return ENROLLMENT_STATUS_LABELS[status];
}
