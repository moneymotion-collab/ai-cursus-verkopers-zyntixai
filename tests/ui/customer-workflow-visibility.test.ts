import { describe, expect, it } from "vitest";
import {
  canShowArchiveWorkflow,
  canShowCreateWorkflow,
  canShowEditWorkflow,
  canShowRestoreWorkflow,
  canShowStatusWorkflow,
} from "@/features/customers/ui/customer-workflow-visibility";
import { archivedCustomerDetail, sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

describe("customer workflow visibility", () => {
  it("allows create for owner, admin and staff only", () => {
    expect(canShowCreateWorkflow("owner")).toBe(true);
    expect(canShowCreateWorkflow("admin")).toBe(true);
    expect(canShowCreateWorkflow("staff")).toBe(true);
    expect(canShowCreateWorkflow("viewer")).toBe(false);
  });

  it("shows edit and status for owner/admin/staff on active customers", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(canShowEditWorkflow(sampleCustomerDetail, role)).toBe(true);
      expect(canShowStatusWorkflow(sampleCustomerDetail, role)).toBe(true);
    }
    expect(canShowEditWorkflow(sampleCustomerDetail, "viewer")).toBe(false);
    expect(canShowStatusWorkflow(sampleCustomerDetail, "viewer")).toBe(false);
  });

  it("hides edit and status for archived customers", () => {
    expect(canShowEditWorkflow(archivedCustomerDetail, "owner")).toBe(false);
    expect(canShowStatusWorkflow(archivedCustomerDetail, "admin")).toBe(false);
  });

  it("shows archive for owner/admin only on active customers", () => {
    expect(canShowArchiveWorkflow(sampleCustomerDetail, "owner")).toBe(true);
    expect(canShowArchiveWorkflow(sampleCustomerDetail, "admin")).toBe(true);
    expect(canShowArchiveWorkflow(sampleCustomerDetail, "staff")).toBe(false);
    expect(canShowArchiveWorkflow(sampleCustomerDetail, "viewer")).toBe(false);
  });

  it("shows restore for owner/admin only on archived customers", () => {
    expect(canShowRestoreWorkflow(archivedCustomerDetail, "owner")).toBe(true);
    expect(canShowRestoreWorkflow(archivedCustomerDetail, "admin")).toBe(true);
    expect(canShowRestoreWorkflow(archivedCustomerDetail, "staff")).toBe(false);
    expect(canShowRestoreWorkflow(sampleCustomerDetail, "owner")).toBe(false);
  });
});
