import { describe, expect, it } from "vitest";
import {
  isKnownAttentionRole,
  resolveAttentionPermissions,
} from "@/features/attention/domain/permissions";
import { EMPTY_ATTENTION_PERMISSIONS } from "@/features/attention/domain/types";

describe("resolveAttentionPermissions", () => {
  it("grants owner/admin archived visibility, evaluate, and archive on terminal items", () => {
    for (const role of ["owner", "admin"] as const) {
      const open = resolveAttentionPermissions(role, {
        status: "open",
        isArchived: false,
      });
      expect(open.canListItems).toBe(true);
      expect(open.canViewItem).toBe(true);
      expect(open.canViewArchivedItems).toBe(true);
      expect(open.canCreateManualItem).toBe(true);
      expect(open.canAcknowledge).toBe(true);
      expect(open.canDismiss).toBe(true);
      expect(open.canArchive).toBe(false);
      expect(open.canEvaluateRules).toBe(true);

      const resolved = resolveAttentionPermissions(role, {
        status: "resolved",
        isArchived: false,
      });
      expect(resolved.canAcknowledge).toBe(false);
      expect(resolved.canResolve).toBe(false);
      expect(resolved.canArchive).toBe(true);
    }
  });

  it("allows staff mutations but never archive or evaluate", () => {
    const staff = resolveAttentionPermissions("staff", {
      status: "acknowledged",
      isArchived: false,
    });
    expect(staff.canListItems).toBe(true);
    expect(staff.canViewItem).toBe(true);
    expect(staff.canViewArchivedItems).toBe(false);
    expect(staff.canCreateManualItem).toBe(true);
    expect(staff.canDismiss).toBe(true);
    expect(staff.canArchive).toBe(false);
    expect(staff.canEvaluateRules).toBe(false);
  });

  it("keeps viewer read-only without archived visibility", () => {
    const viewer = resolveAttentionPermissions("viewer", {
      status: "open",
      isArchived: false,
    });
    expect(viewer.canListItems).toBe(true);
    expect(viewer.canViewItem).toBe(true);
    expect(viewer.canViewArchivedItems).toBe(false);
    expect(viewer.canCreateManualItem).toBe(false);
    expect(viewer.canAcknowledge).toBe(false);
    expect(viewer.canAssign).toBe(false);
    expect(viewer.canResolve).toBe(false);
    expect(viewer.canDismiss).toBe(false);
    expect(viewer.canArchive).toBe(false);
    expect(viewer.canEvaluateRules).toBe(false);
  });

  it("hides archived items from staff/viewer and locks mutations when archived", () => {
    const staffArchived = resolveAttentionPermissions("staff", {
      status: "resolved",
      isArchived: true,
    });
    expect(staffArchived.canViewItem).toBe(false);
    expect(staffArchived.canCreateManualItem).toBe(false);
    expect(staffArchived.canDismiss).toBe(false);

    const ownerArchived = resolveAttentionPermissions("owner", {
      status: "resolved",
      isArchived: true,
    });
    expect(ownerArchived.canViewItem).toBe(true);
    expect(ownerArchived.canViewArchivedItems).toBe(true);
    expect(ownerArchived.canArchive).toBe(false);
    expect(ownerArchived.canCreateManualItem).toBe(false);
  });

  it("fails closed for unknown or missing roles", () => {
    expect(isKnownAttentionRole("owner")).toBe(true);
    expect(isKnownAttentionRole("suspended")).toBe(false);
    expect(isKnownAttentionRole("ghost")).toBe(false);
    expect(resolveAttentionPermissions(null)).toEqual(EMPTY_ATTENTION_PERMISSIONS);
    expect(resolveAttentionPermissions(undefined)).toEqual(
      EMPTY_ATTENTION_PERMISSIONS,
    );
    expect(resolveAttentionPermissions("ghost" as never)).toEqual(
      EMPTY_ATTENTION_PERMISSIONS,
    );
  });
});
