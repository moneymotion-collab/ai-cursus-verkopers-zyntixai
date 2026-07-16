import { describe, expect, it } from "vitest";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import { EMPTY_LEAD_PERMISSIONS } from "@/features/leads/domain/types";

describe("resolveLeadPermissions", () => {
  it("grants owner/admin full non-archived open-lead capabilities", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveLeadPermissions(role, { isArchived: false, status: "open" });
      expect(permissions.canViewArchivedLeads).toBe(true);
      expect(permissions.canCreateLead).toBe(true);
      expect(permissions.canEditLeadProfile).toBe(true);
      expect(permissions.canTransitionLeadStage).toBe(true);
      expect(permissions.canTransitionLeadStatus).toBe(true);
      expect(permissions.canConvertLead).toBe(true);
      expect(permissions.canArchiveLead).toBe(true);
      expect(permissions.canRestoreLead).toBe(false);
    }
  });

  it("grants owner/admin restore on archived records and blocks mutations", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveLeadPermissions(role, { isArchived: true, status: "open" });
      expect(permissions.canRestoreLead).toBe(true);
      expect(permissions.canEditLeadProfile).toBe(false);
      expect(permissions.canArchiveLead).toBe(false);
      expect(permissions.canTransitionLeadStage).toBe(false);
      expect(permissions.canConvertLead).toBe(false);
    }
  });

  it("blocks stage transition and conversion for non-open statuses", () => {
    for (const status of ["lost", "disqualified", "converted"] as const) {
      const permissions = resolveLeadPermissions("admin", { isArchived: false, status });
      expect(permissions.canTransitionLeadStage).toBe(false);
      expect(permissions.canConvertLead).toBe(false);
    }
  });

  it("allows status reopen hints for lost/disqualified but not converted", () => {
    expect(
      resolveLeadPermissions("staff", { isArchived: false, status: "lost" }).canTransitionLeadStatus,
    ).toBe(true);
    expect(
      resolveLeadPermissions("staff", {
        isArchived: false,
        status: "disqualified",
      }).canTransitionLeadStatus,
    ).toBe(true);
    expect(
      resolveLeadPermissions("staff", {
        isArchived: false,
        status: "converted",
      }).canTransitionLeadStatus,
    ).toBe(false);
  });

  it("grants staff operational permissions without archive visibility", () => {
    const permissions = resolveLeadPermissions("staff", { isArchived: false, status: "open" });
    expect(permissions.canCreateLead).toBe(true);
    expect(permissions.canEditLeadProfile).toBe(true);
    expect(permissions.canTransitionLeadStage).toBe(true);
    expect(permissions.canTransitionLeadStatus).toBe(true);
    expect(permissions.canConvertLead).toBe(true);
    expect(permissions.canArchiveLead).toBe(false);
    expect(permissions.canRestoreLead).toBe(false);
    expect(permissions.canViewArchivedLeads).toBe(false);
  });

  it("denies staff archived record access", () => {
    const permissions = resolveLeadPermissions("staff", { isArchived: true, status: "open" });
    expect(permissions.canViewLead).toBe(false);
    expect(permissions.canViewStatusHistory).toBe(false);
    expect(permissions.canViewStageHistory).toBe(false);
    expect(permissions.canViewRelatedTasks).toBe(false);
  });

  it("grants viewer read-only access to non-archived records", () => {
    const permissions = resolveLeadPermissions("viewer", { isArchived: false, status: "open" });
    expect(permissions.canViewLead).toBe(true);
    expect(permissions.canViewRelatedTasks).toBe(true);
    expect(permissions.canViewStatusHistory).toBe(true);
    expect(permissions.canViewStageHistory).toBe(true);
    expect(permissions.canCreateLead).toBe(false);
    expect(permissions.canEditLeadProfile).toBe(false);
    expect(permissions.canTransitionLeadStage).toBe(false);
    expect(permissions.canTransitionLeadStatus).toBe(false);
    expect(permissions.canConvertLead).toBe(false);
    expect(permissions.canArchiveLead).toBe(false);
  });

  it("fails closed for unknown roles", () => {
    expect(resolveLeadPermissions(null)).toEqual(EMPTY_LEAD_PERMISSIONS);
    expect(resolveLeadPermissions(undefined)).toEqual(EMPTY_LEAD_PERMISSIONS);
  });

  it("never grants viewer mutation capabilities across statuses", () => {
    for (const status of ["open", "lost", "disqualified", "converted"] as const) {
      const permissions = resolveLeadPermissions("viewer", { isArchived: false, status });
      expect(permissions.canCreateLead).toBe(false);
      expect(permissions.canEditLeadProfile).toBe(false);
      expect(permissions.canTransitionLeadStage).toBe(false);
      expect(permissions.canTransitionLeadStatus).toBe(false);
      expect(permissions.canConvertLead).toBe(false);
      expect(permissions.canArchiveLead).toBe(false);
      expect(permissions.canRestoreLead).toBe(false);
    }
  });
});
