import { describe, expect, it } from "vitest";
import { resolveTaskPermissions } from "@/features/tasks/domain/permissions";

describe("resolveTaskPermissions", () => {
  it("grants full permissions to owner and admin", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveTaskPermissions(role);
      expect(permissions.canArchiveTask).toBe(true);
      expect(permissions.canCreateSystemTask).toBe(true);
      expect(permissions.canViewArchivedTasks).toBe(true);
    }
  });

  it("grants staff lifecycle permissions without archive/system", () => {
    const permissions = resolveTaskPermissions("staff");
    expect(permissions.canCreateTask).toBe(true);
    expect(permissions.canArchiveTask).toBe(false);
    expect(permissions.canCreateSystemTask).toBe(false);
    expect(permissions.canViewArchivedTasks).toBe(false);
  });

  it("grants viewer read-only permissions", () => {
    const permissions = resolveTaskPermissions("viewer");
    expect(permissions.canViewTasks).toBe(true);
    expect(permissions.canEditTask).toBe(false);
    expect(permissions.canCreateTask).toBe(false);
  });

  it("fails closed for unknown roles", () => {
    const permissions = resolveTaskPermissions(null);
    expect(permissions.canViewTasks).toBe(false);
    expect(permissions.canCreateTask).toBe(false);
  });
});
