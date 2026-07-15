import { describe, expect, it } from "vitest";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";

describe("resolveCustomerPermissions", () => {
  it("grants owner/admin full non-archived capabilities", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveCustomerPermissions(role, { isArchived: false });
      expect(permissions.canViewArchivedCustomers).toBe(true);
      expect(permissions.canCreateCustomer).toBe(true);
      expect(permissions.canEditCustomer).toBe(true);
      expect(permissions.canArchiveCustomer).toBe(true);
      expect(permissions.canRestoreCustomer).toBe(false);
    }
  });

  it("grants owner/admin restore on archived records", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveCustomerPermissions(role, { isArchived: true });
      expect(permissions.canRestoreCustomer).toBe(true);
      expect(permissions.canEditCustomer).toBe(false);
      expect(permissions.canArchiveCustomer).toBe(false);
    }
  });

  it("grants staff operational permissions without archive visibility", () => {
    const permissions = resolveCustomerPermissions("staff", { isArchived: false });
    expect(permissions.canCreateCustomer).toBe(true);
    expect(permissions.canEditCustomer).toBe(true);
    expect(permissions.canTransitionCustomer).toBe(true);
    expect(permissions.canArchiveCustomer).toBe(false);
    expect(permissions.canRestoreCustomer).toBe(false);
    expect(permissions.canViewArchivedCustomers).toBe(false);
  });

  it("denies staff archived record access", () => {
    const permissions = resolveCustomerPermissions("staff", { isArchived: true });
    expect(permissions.canViewCustomer).toBe(false);
    expect(permissions.canViewStatusHistory).toBe(false);
  });

  it("grants viewer read-only access to non-archived records", () => {
    const permissions = resolveCustomerPermissions("viewer", { isArchived: false });
    expect(permissions.canViewCustomer).toBe(true);
    expect(permissions.canViewRelatedTasks).toBe(true);
    expect(permissions.canCreateCustomer).toBe(false);
    expect(permissions.canEditCustomer).toBe(false);
    expect(permissions.canTransitionCustomer).toBe(false);
    expect(permissions.canArchiveCustomer).toBe(false);
  });

  it("fails closed for unknown roles", () => {
    const permissions = resolveCustomerPermissions(null);
    expect(permissions.canViewCustomer).toBe(false);
    expect(permissions.canCreateCustomer).toBe(false);
  });
});
