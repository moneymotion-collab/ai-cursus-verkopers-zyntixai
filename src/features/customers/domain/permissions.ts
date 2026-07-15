import type { CustomerPermissionSet, CustomerRole } from "@/features/customers/domain/types";
import { EMPTY_CUSTOMER_PERMISSIONS } from "@/features/customers/domain/types";

const KNOWN_ROLES: readonly CustomerRole[] = ["owner", "admin", "staff", "viewer"];

export function isKnownCustomerRole(role: string): role is CustomerRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type CustomerPermissionContext = {
  isArchived?: boolean;
};

/**
 * Pure UI permission hints derived from verified customer role behavior.
 * Database authorization remains authoritative.
 */
export function resolveCustomerPermissions(
  role: CustomerRole | null | undefined,
  context: CustomerPermissionContext = {},
): CustomerPermissionSet {
  if (!role) {
    return { ...EMPTY_CUSTOMER_PERMISSIONS };
  }

  const isArchived = context.isArchived === true;

  switch (role) {
    case "owner":
    case "admin":
      return {
        canViewCustomer: true,
        canViewArchivedCustomers: true,
        canCreateCustomer: true,
        canEditCustomer: !isArchived,
        canTransitionCustomer: !isArchived,
        canArchiveCustomer: !isArchived,
        canRestoreCustomer: isArchived,
        canViewStatusHistory: true,
        canViewRelatedTasks: true,
        canViewEnrollmentSummary: true,
      };
    case "staff":
      return {
        canViewCustomer: !isArchived,
        canViewArchivedCustomers: false,
        canCreateCustomer: true,
        canEditCustomer: !isArchived,
        canTransitionCustomer: !isArchived,
        canArchiveCustomer: false,
        canRestoreCustomer: false,
        canViewStatusHistory: !isArchived,
        canViewRelatedTasks: !isArchived,
        canViewEnrollmentSummary: !isArchived,
      };
    case "viewer":
      return {
        canViewCustomer: !isArchived,
        canViewArchivedCustomers: false,
        canCreateCustomer: false,
        canEditCustomer: false,
        canTransitionCustomer: false,
        canArchiveCustomer: false,
        canRestoreCustomer: false,
        canViewStatusHistory: !isArchived,
        canViewRelatedTasks: !isArchived,
        canViewEnrollmentSummary: !isArchived,
      };
    default:
      return { ...EMPTY_CUSTOMER_PERMISSIONS };
  }
}
