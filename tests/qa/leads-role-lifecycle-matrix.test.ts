import { describe, expect, it } from "vitest";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadRole } from "@/features/leads/domain/types";
import {
  canShowArchiveLeadWorkflow,
  canShowConvertLeadWorkflow,
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

type WorkflowKey = "edit" | "stage" | "status" | "convert" | "archive" | "restore";

type MatrixCase = {
  label: string;
  lead: LeadDetailReadModel;
  expected: Record<LeadRole, Record<WorkflowKey, boolean>>;
};

const disqualifiedLeadDetail: LeadDetailReadModel = {
  ...sampleLeadDetail,
  status: "disqualified",
  statusLabel: "Disqualified",
  derived: {
    ...sampleLeadDetail.derived,
    isConvertible: false,
    allowedStatusTransitions: ["open"],
  },
};

const archivedConvertedLeadDetail: LeadDetailReadModel = {
  ...convertedLeadDetail,
  archivedAt: "2026-07-15T10:00:00.000Z",
  derived: {
    ...convertedLeadDetail.derived,
    isArchived: true,
    allowedStatusTransitions: [],
  },
};

const ownerAdminOpen: Record<WorkflowKey, boolean> = {
  edit: true,
  stage: true,
  status: true,
  convert: true,
  archive: true,
  restore: false,
};

const staffOpen: Record<WorkflowKey, boolean> = {
  edit: true,
  stage: true,
  status: true,
  convert: true,
  archive: false,
  restore: false,
};

const viewerNone: Record<WorkflowKey, boolean> = {
  edit: false,
  stage: false,
  status: false,
  convert: false,
  archive: false,
  restore: false,
};

const CASES: MatrixCase[] = [
  {
    label: "active open",
    lead: sampleLeadDetail,
    expected: {
      owner: ownerAdminOpen,
      admin: ownerAdminOpen,
      staff: staffOpen,
      viewer: viewerNone,
    },
  },
  {
    label: "active lost",
    lead: lostLeadDetail,
    expected: {
      owner: { edit: true, stage: false, status: true, convert: false, archive: true, restore: false },
      admin: { edit: true, stage: false, status: true, convert: false, archive: true, restore: false },
      staff: { edit: true, stage: false, status: true, convert: false, archive: false, restore: false },
      viewer: viewerNone,
    },
  },
  {
    label: "active disqualified",
    lead: disqualifiedLeadDetail,
    expected: {
      owner: { edit: true, stage: false, status: true, convert: false, archive: true, restore: false },
      admin: { edit: true, stage: false, status: true, convert: false, archive: true, restore: false },
      staff: { edit: true, stage: false, status: true, convert: false, archive: false, restore: false },
      viewer: viewerNone,
    },
  },
  {
    label: "active converted",
    lead: convertedLeadDetail,
    expected: {
      owner: { edit: true, stage: false, status: false, convert: false, archive: true, restore: false },
      admin: { edit: true, stage: false, status: false, convert: false, archive: true, restore: false },
      staff: { edit: true, stage: false, status: false, convert: false, archive: false, restore: false },
      viewer: viewerNone,
    },
  },
  {
    label: "archived open",
    lead: archivedLeadDetail,
    expected: {
      owner: { edit: false, stage: false, status: false, convert: false, archive: false, restore: true },
      admin: { edit: false, stage: false, status: false, convert: false, archive: false, restore: true },
      staff: viewerNone,
      viewer: viewerNone,
    },
  },
  {
    label: "archived converted",
    lead: archivedConvertedLeadDetail,
    expected: {
      owner: { edit: false, stage: false, status: false, convert: false, archive: false, restore: true },
      admin: { edit: false, stage: false, status: false, convert: false, archive: false, restore: true },
      staff: viewerNone,
      viewer: viewerNone,
    },
  },
];

function workflowVisibility(lead: LeadDetailReadModel, role: LeadRole): Record<WorkflowKey, boolean> {
  return {
    edit: canShowEditLeadWorkflow(lead, role),
    stage: canShowStageLeadWorkflow(lead, role),
    status: canShowStatusLeadWorkflow(lead, role),
    convert: canShowConvertLeadWorkflow(lead, role),
    archive: canShowArchiveLeadWorkflow(lead, role),
    restore: canShowRestoreLeadWorkflow(lead, role),
  };
}

describe("leads role lifecycle matrix", () => {
  for (const testCase of CASES) {
    it(`matches workflow visibility for ${testCase.label}`, () => {
      for (const role of ["owner", "admin", "staff", "viewer"] as const) {
        expect(workflowVisibility(testCase.lead, role)).toEqual(testCase.expected[role]);
      }
    });
  }
});
