import { describe, expect, it } from "vitest";
import {
  canShowArchiveLeadWorkflow,
  canShowConvertLeadWorkflow,
  canShowCreateLeadWorkflow,
  canShowEditLeadWorkflow,
  canShowRestoreLeadWorkflow,
  canShowStageLeadWorkflow,
  canShowStatusLeadWorkflow,
} from "@/features/leads/ui/lead-workflow-visibility";
import {
  archivedLeadDetail,
  convertedLeadDetail,
  lostLeadDetail,
  sampleLeadDetail,
} from "../helpers/lead-mutation-mocks";

describe("lead workflow visibility", () => {
  it("allows create for owner, admin and staff", () => {
    expect(canShowCreateLeadWorkflow("owner")).toBe(true);
    expect(canShowCreateLeadWorkflow("admin")).toBe(true);
    expect(canShowCreateLeadWorkflow("staff")).toBe(true);
    expect(canShowCreateLeadWorkflow("viewer")).toBe(false);
  });

  it("shows edit, stage, status and convert for owner on active open leads", () => {
    expect(canShowEditLeadWorkflow(sampleLeadDetail, "owner")).toBe(true);
    expect(canShowStageLeadWorkflow(sampleLeadDetail, "owner")).toBe(true);
    expect(canShowStatusLeadWorkflow(sampleLeadDetail, "owner")).toBe(true);
    expect(canShowConvertLeadWorkflow(sampleLeadDetail, "owner")).toBe(true);
    expect(canShowArchiveLeadWorkflow(sampleLeadDetail, "owner")).toBe(true);
    expect(canShowRestoreLeadWorkflow(sampleLeadDetail, "owner")).toBe(false);
  });

  it("shows staff lifecycle except archive and restore", () => {
    expect(canShowEditLeadWorkflow(sampleLeadDetail, "staff")).toBe(true);
    expect(canShowStageLeadWorkflow(sampleLeadDetail, "staff")).toBe(true);
    expect(canShowStatusLeadWorkflow(sampleLeadDetail, "staff")).toBe(true);
    expect(canShowConvertLeadWorkflow(sampleLeadDetail, "staff")).toBe(true);
    expect(canShowArchiveLeadWorkflow(sampleLeadDetail, "staff")).toBe(false);
    expect(canShowRestoreLeadWorkflow(sampleLeadDetail, "staff")).toBe(false);
  });

  it("denies viewer mutation workflows", () => {
    expect(canShowEditLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
    expect(canShowStageLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
    expect(canShowStatusLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
    expect(canShowConvertLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
    expect(canShowArchiveLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
    expect(canShowRestoreLeadWorkflow(sampleLeadDetail, "viewer")).toBe(false);
  });

  it("hides edit, stage, status and convert for archived leads", () => {
    expect(canShowEditLeadWorkflow(archivedLeadDetail, "owner")).toBe(false);
    expect(canShowStageLeadWorkflow(archivedLeadDetail, "owner")).toBe(false);
    expect(canShowStatusLeadWorkflow(archivedLeadDetail, "owner")).toBe(false);
    expect(canShowConvertLeadWorkflow(archivedLeadDetail, "owner")).toBe(false);
    expect(canShowArchiveLeadWorkflow(archivedLeadDetail, "owner")).toBe(false);
    expect(canShowRestoreLeadWorkflow(archivedLeadDetail, "owner")).toBe(true);
  });

  it("hides stage, status and convert for converted leads", () => {
    expect(canShowEditLeadWorkflow(convertedLeadDetail, "owner")).toBe(true);
    expect(canShowStageLeadWorkflow(convertedLeadDetail, "owner")).toBe(false);
    expect(canShowStatusLeadWorkflow(convertedLeadDetail, "owner")).toBe(false);
    expect(canShowConvertLeadWorkflow(convertedLeadDetail, "owner")).toBe(false);
    expect(canShowArchiveLeadWorkflow(convertedLeadDetail, "owner")).toBe(true);
  });

  it("allows status reopen for lost leads but not convert or stage", () => {
    expect(canShowStageLeadWorkflow(lostLeadDetail, "owner")).toBe(false);
    expect(canShowConvertLeadWorkflow(lostLeadDetail, "owner")).toBe(false);
    expect(canShowStatusLeadWorkflow(lostLeadDetail, "owner")).toBe(true);
  });
});
