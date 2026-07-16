import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadDetail } from "@/features/leads/ui/lead-detail";
import type { LeadDetailViewModel } from "@/features/leads/ui/load-lead-detail";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import {
  buildLeadArchiveHref,
  buildLeadConvertHref,
  buildLeadEditHref,
  buildLeadRestoreHref,
  buildLeadStageHref,
  buildLeadStatusHref,
} from "@/features/leads/ui/lead-navigation";
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
  sampleLeadDetail,
} from "../helpers/lead-mutation-mocks";

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

function buildViewModel(
  lead: typeof sampleLeadDetail,
  role: "owner" | "admin" | "staff" | "viewer",
): LeadDetailViewModel {
  return {
    lead,
    permissions: resolveLeadPermissions(role, {
      isArchived: lead.derived.isArchived,
      status: lead.status,
    }),
    statusHistory: [],
    statusHistoryState: { kind: "empty" },
    stageHistory: [],
    stageHistoryState: { kind: "empty" },
    relatedTasks: [],
    relatedTasksState: { kind: "empty" },
    convertedCustomerHref: undefined,
    organizationTimezone: "UTC",
    backHref: "/leads",
    panelErrors: {},
  };
}

function workflowLinksFor(lead: typeof sampleLeadDetail, role: "owner" | "admin" | "staff" | "viewer") {
  return {
    edit: canShowEditLeadWorkflow(lead, role)
      ? buildLeadEditHref(lead.id, listState)
      : undefined,
    stage: canShowStageLeadWorkflow(lead, role)
      ? buildLeadStageHref(lead.id, listState)
      : undefined,
    status: canShowStatusLeadWorkflow(lead, role)
      ? buildLeadStatusHref(lead.id, listState)
      : undefined,
    convert: canShowConvertLeadWorkflow(lead, role)
      ? buildLeadConvertHref(lead.id, listState)
      : undefined,
    archive: canShowArchiveLeadWorkflow(lead, role)
      ? buildLeadArchiveHref(lead.id, listState)
      : undefined,
    restore: canShowRestoreLeadWorkflow(lead, role)
      ? buildLeadRestoreHref(lead.id, listState)
      : undefined,
  };
}

describe("lead detail workflow controls", () => {
  it("shows lifecycle actions for owner on active open leads", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel(sampleLeadDetail, "owner")}
        workflowLinks={workflowLinksFor(sampleLeadDetail, "owner")}
      />,
    );
    expect(html).toContain("Edit lead");
    expect(html).toContain("Change pipeline stage");
    expect(html).toContain("Change lead status");
    expect(html).toContain("Convert to customer");
    expect(html).toContain("Archive lead");
    expect(html).not.toContain("Restore lead");
    expect(html).toContain(`org=${sampleLeadDetail.organizationId}`);
  });

  it("shows no mutation controls for viewer", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel(sampleLeadDetail, "viewer")}
        workflowLinks={workflowLinksFor(sampleLeadDetail, "viewer")}
      />,
    );
    expect(html).not.toContain("Edit lead");
    expect(html).not.toContain("Archive lead");
    expect(html).not.toContain("Convert to customer");
  });

  it("shows restore instead of archive on archived leads", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel(archivedLeadDetail, "owner")}
        workflowLinks={workflowLinksFor(archivedLeadDetail, "owner")}
      />,
    );
    expect(html).toContain("Restore lead");
    expect(html).not.toContain("Edit lead");
    expect(html).not.toContain("Archive lead");
    expect(html).not.toContain("Convert to customer");
  });

  it("hides convert and stage on converted leads", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel(convertedLeadDetail, "owner")}
        workflowLinks={workflowLinksFor(convertedLeadDetail, "owner")}
      />,
    );
    expect(html).not.toContain("Convert to customer");
    expect(html).not.toContain("Change pipeline stage");
    expect(html).not.toContain("Change lead status");
    expect(html).toContain("Edit lead");
  });
});
