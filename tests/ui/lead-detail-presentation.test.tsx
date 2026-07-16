import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadDetail } from "@/features/leads/ui/lead-detail";
import type { LeadDetailViewModel } from "@/features/leads/ui/load-lead-detail";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";

function buildViewModel(overrides: Partial<LeadDetailViewModel> = {}): LeadDetailViewModel {
  return {
    lead: {
      id: LEAD_ID,
      organizationId: ORG_ID,
      displayName: "Prospect Co",
      firstName: "Pat",
      lastName: "Prospect",
      email: "ops@prospect.test",
      phone: "+1",
      status: "converted",
      statusLabel: "Converted",
      ownerMemberId: null,
      ownerLabel: "Unassigned",
      createdByMemberId: null,
      createdByLabel: "System",
      stage: {
        stageId: "44444444-4444-4444-8444-444444444444",
        name: "Qualified",
        position: 2,
        stageCategory: "qualified",
        stageCategoryLabel: "Qualified",
        isDefault: false,
      },
      sourceType: "manual",
      sourceDetail: "Inbound",
      pursuitLabel: "Q3 deal",
      convertedCustomer: {
        customerId: CUSTOMER_ID,
        displayLabel: "Prospect Co Customer",
        convertedAt: "2026-07-14T10:00:00.000Z",
        isArchived: true,
      },
      archivedAt: null,
      createdAt: "2026-07-14T10:00:00.000Z",
      updatedAt: "2026-07-14T10:00:00.000Z",
      derived: {
        isArchived: false,
        isConverted: true,
        isConvertible: false,
        allowedStatusTransitions: [],
      },
    },
    permissions: {
      canViewLead: true,
      canViewArchivedLeads: true,
      canCreateLead: true,
      canEditLeadProfile: false,
      canTransitionLeadStage: false,
      canTransitionLeadStatus: false,
      canConvertLead: false,
      canArchiveLead: false,
      canRestoreLead: false,
      canViewStatusHistory: true,
      canViewStageHistory: true,
      canViewRelatedTasks: true,
    },
    statusHistory: [],
    statusHistoryState: { kind: "empty" },
    stageHistory: [],
    stageHistoryState: { kind: "empty" },
    relatedTasks: [],
    relatedTasksState: { kind: "empty" },
    convertedCustomerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
    organizationTimezone: "UTC",
    backHref: `/leads?org=${ORG_ID}`,
    panelErrors: {},
    ...overrides,
  };
}

describe("LeadDetail presentation", () => {
  it("distinguishes status and pipeline stage and links converted customer", () => {
    const html = renderToStaticMarkup(<LeadDetail viewModel={buildViewModel()} />);

    expect(html).toContain("Lead overview");
    expect(html).toContain("Converted");
    expect(html).toContain("Qualified");
    expect(html).toContain("Pipeline stage");
    expect(html).toContain("Lead status");
    expect(html).toContain("Converted customer");
    expect(html).toContain(`href="/customers/${CUSTOMER_ID}?org=${ORG_ID}"`);
    expect(html).toContain("Customer archived");
    expect(html).not.toContain("Convert lead");
    expect(html).not.toContain("Edit lead");
    expect(html).not.toContain("Archive lead");
  });

  it("renders archived lead state", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel({
          lead: {
            ...buildViewModel().lead,
            status: "open",
            statusLabel: "Open",
            archivedAt: "2026-07-15T10:00:00.000Z",
            convertedCustomer: null,
            derived: {
              isArchived: true,
              isConverted: false,
              isConvertible: false,
              allowedStatusTransitions: [],
            },
          },
        })}
      />,
    );

    expect(html).toContain("Archived");
  });
});
