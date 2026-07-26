import { describe, expect, it } from "vitest";
import {
  canShowArchiveEnrollmentWorkflow,
  canShowCreateEnrollmentWorkflow,
  canShowEditEnrollmentWorkflow,
  canShowRestoreEnrollmentWorkflow,
  canShowStatusEnrollmentWorkflow,
} from "@/features/enrollments/ui/enrollment-workflow-visibility";
import {
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
} from "../helpers/enrollment-test-fixtures";

const nonTerminalOpenEnrollment = sampleEnrollmentDetail; // status: active, isTerminal: false

const terminalNotArchivedEnrollment = {
  ...sampleEnrollmentDetail,
  status: "completed" as const,
  statusLabel: "Completed",
  derived: {
    isArchived: false,
    isOpen: false,
    isTerminal: true,
    allowedTransitions: [],
  },
};

const noTransitionsEnrollment = {
  ...sampleEnrollmentDetail,
  derived: {
    ...sampleEnrollmentDetail.derived,
    allowedTransitions: [],
  },
};

describe("enrollment workflow visibility", () => {
  it("shows create for owner, admin, and staff only", () => {
    expect(canShowCreateEnrollmentWorkflow("owner")).toBe(true);
    expect(canShowCreateEnrollmentWorkflow("admin")).toBe(true);
    expect(canShowCreateEnrollmentWorkflow("staff")).toBe(true);
    expect(canShowCreateEnrollmentWorkflow("viewer")).toBe(false);
  });

  it("shows edit (owner reassignment) for owner/admin/staff on non-archived enrollments only", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(canShowEditEnrollmentWorkflow(nonTerminalOpenEnrollment, role)).toBe(true);
      expect(canShowEditEnrollmentWorkflow(sampleArchivedEnrollmentDetail, role)).toBe(false);
    }
    expect(canShowEditEnrollmentWorkflow(nonTerminalOpenEnrollment, "viewer")).toBe(false);
  });

  it("shows status transitions for owner/admin/staff only when non-archived and transitions exist", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(canShowStatusEnrollmentWorkflow(nonTerminalOpenEnrollment, role)).toBe(true);
      expect(canShowStatusEnrollmentWorkflow(sampleArchivedEnrollmentDetail, role)).toBe(false);
      expect(canShowStatusEnrollmentWorkflow(noTransitionsEnrollment, role)).toBe(false);
    }
    expect(canShowStatusEnrollmentWorkflow(nonTerminalOpenEnrollment, "viewer")).toBe(false);
  });

  it("shows archive for owner/admin only, when non-archived and terminal", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(canShowArchiveEnrollmentWorkflow(terminalNotArchivedEnrollment, role)).toBe(true);
      expect(canShowArchiveEnrollmentWorkflow(nonTerminalOpenEnrollment, role)).toBe(false);
      expect(canShowArchiveEnrollmentWorkflow(sampleArchivedEnrollmentDetail, role)).toBe(false);
    }
    for (const role of ["staff", "viewer"] as const) {
      expect(canShowArchiveEnrollmentWorkflow(terminalNotArchivedEnrollment, role)).toBe(false);
    }
  });

  it("shows restore for owner/admin only, and only when archived", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(canShowRestoreEnrollmentWorkflow(sampleArchivedEnrollmentDetail, role)).toBe(true);
      expect(canShowRestoreEnrollmentWorkflow(nonTerminalOpenEnrollment, role)).toBe(false);
    }
    for (const role of ["staff", "viewer"] as const) {
      expect(canShowRestoreEnrollmentWorkflow(sampleArchivedEnrollmentDetail, role)).toBe(false);
    }
  });

  it("hides all mutation workflows for viewer regardless of state", () => {
    expect(canShowEditEnrollmentWorkflow(sampleEnrollmentDetail, "viewer")).toBe(false);
    expect(canShowStatusEnrollmentWorkflow(sampleEnrollmentDetail, "viewer")).toBe(false);
    expect(canShowArchiveEnrollmentWorkflow(terminalNotArchivedEnrollment, "viewer")).toBe(false);
    expect(canShowRestoreEnrollmentWorkflow(sampleArchivedEnrollmentDetail, "viewer")).toBe(false);
  });
});
