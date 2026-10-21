import { describe, expect, it } from "vitest";
import {
  canShowArchiveProgramWorkflow,
  canShowCreateProgramWorkflow,
  canShowEditProgramWorkflow,
  canShowRestoreProgramWorkflow,
  canShowStatusProgramWorkflow,
} from "@/features/programs/ui/program-workflow-visibility";
import {
  sampleArchivedProgramDetail,
  sampleProgramDetail,
} from "../helpers/program-test-fixtures";

describe("program workflow visibility", () => {
  it("shows create for owner and admin only", () => {
    expect(canShowCreateProgramWorkflow("owner")).toBe(true);
    expect(canShowCreateProgramWorkflow("admin")).toBe(true);
    expect(canShowCreateProgramWorkflow("staff")).toBe(false);
    expect(canShowCreateProgramWorkflow("viewer")).toBe(false);
  });

  it("shows edit/status/archive for owner and admin on non-archived programs only", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(canShowEditProgramWorkflow(sampleProgramDetail, role)).toBe(true);
      expect(canShowStatusProgramWorkflow(sampleProgramDetail, role)).toBe(true);
      expect(canShowArchiveProgramWorkflow(sampleProgramDetail, role)).toBe(true);
      expect(canShowRestoreProgramWorkflow(sampleProgramDetail, role)).toBe(false);

      expect(canShowEditProgramWorkflow(sampleArchivedProgramDetail, role)).toBe(false);
      expect(canShowStatusProgramWorkflow(sampleArchivedProgramDetail, role)).toBe(false);
      expect(canShowArchiveProgramWorkflow(sampleArchivedProgramDetail, role)).toBe(false);
      expect(canShowRestoreProgramWorkflow(sampleArchivedProgramDetail, role)).toBe(true);
    }
  });

  it("hides all mutation workflows for staff and viewer", () => {
    for (const role of ["staff", "viewer"] as const) {
      expect(canShowEditProgramWorkflow(sampleProgramDetail, role)).toBe(false);
      expect(canShowStatusProgramWorkflow(sampleProgramDetail, role)).toBe(false);
      expect(canShowArchiveProgramWorkflow(sampleProgramDetail, role)).toBe(false);
      expect(canShowRestoreProgramWorkflow(sampleArchivedProgramDetail, role)).toBe(false);
    }
  });
});
