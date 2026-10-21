import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerRole } from "@/features/customers/domain/types";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";

type CustomerWorkflowTarget = Pick<CustomerDetailReadModel, "derived">;

export function canShowCreateWorkflow(role: CustomerRole): boolean {
  return resolveCustomerPermissions(role).canCreateCustomer;
}

export function canShowEditWorkflow(
  customer: CustomerWorkflowTarget,
  role: CustomerRole,
): boolean {
  const permissions = resolveCustomerPermissions(role, {
    isArchived: customer.derived.isArchived,
  });
  return permissions.canEditCustomer && !customer.derived.isArchived;
}

export function canShowStatusWorkflow(
  customer: CustomerWorkflowTarget,
  role: CustomerRole,
): boolean {
  const permissions = resolveCustomerPermissions(role, {
    isArchived: customer.derived.isArchived,
  });
  return permissions.canTransitionCustomer && !customer.derived.isArchived;
}

export function canShowArchiveWorkflow(
  customer: CustomerWorkflowTarget,
  role: CustomerRole,
): boolean {
  const permissions = resolveCustomerPermissions(role, {
    isArchived: customer.derived.isArchived,
  });
  return permissions.canArchiveCustomer && !customer.derived.isArchived;
}

export function canShowRestoreWorkflow(
  customer: CustomerWorkflowTarget,
  role: CustomerRole,
): boolean {
  const permissions = resolveCustomerPermissions(role, {
    isArchived: customer.derived.isArchived,
  });
  return permissions.canRestoreCustomer && customer.derived.isArchived;
}
