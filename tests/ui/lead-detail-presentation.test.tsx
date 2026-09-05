import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadDetail } from "@/features/leads/ui/lead-detail";
import {
  CONVERTED_LEAD_EDIT_NOTICE,
  formatLeadHistorySourceLabel,
} from "@/features/leads/ui/lead-presentation";
import type { LeadDetailViewModel } from "@/features/leads/ui/load-lead-detail";
import { LeadStatusHistorySection } from "@/features/leads/ui/lead-status-history";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";

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

function extractBadgeRegion(html: string): string {
  const match = html.match(
    /data-testid="lead-detail-badges"[^>]*>([\s\S]*?)<\/div>/,
  );
  return match?.[1] ?? "";
}

describe("LeadDetail presentation", () => {
  it("uses approved terminology and Last pipeline stage for converted leads", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel()}
        workflowLinks={{ edit: `/leads/${LEAD_ID}/edit` }}
      />,
    );

    expect(html).toContain("Lead overview");
    expect(html).toContain("<dt>Lead name</dt>");
    expect(html).toContain("<dt>Assigned to</dt>");
    expect(html).toContain("<dt>Lead source</dt>");
    expect(html).toContain("Manual entry");
    expect(html).toContain("<dt>Interested in</dt>");
    expect(html).toContain("<dt>Archive status</dt>");
    expect(html).toContain("<dt>Lead status</dt>");
    expect(html).toContain("<dt>Last pipeline stage</dt>");
    expect(html).not.toContain("<dt>Pipeline stage</dt>");
    expect(html).not.toContain("<dt>Display name</dt>");
    expect(html).not.toContain("<dt>Owner</dt>");
    expect(html).not.toContain("<dt>Source</dt>");
    expect(html).not.toContain("<dt>Pursuit</dt>");
    expect(html).not.toContain("<dt>Archive state</dt>");
    expect(html).toContain(CONVERTED_LEAD_EDIT_NOTICE);
    expect(html).toContain("Edit lead");
  });

  it("keeps one Converted status badge and preserves Converted customer panel", () => {
    const html = renderToStaticMarkup(<LeadDetail viewModel={buildViewModel()} />);
    const badges = extractBadgeRegion(html);

    expect(badges.split(">Converted<").length - 1).toBe(1);
    expect(badges).toContain("Qualified");
    expect(badges).not.toContain("Archived");

    expect(html).toContain("Converted customer");
    expect(html).toContain(`href="/customers/${CUSTOMER_ID}?org=${ORG_ID}"`);
    expect(html).toContain('aria-label="Open converted customer Prospect Co Customer"');
    expect(html).toContain("Customer archived");
    expect(html).toContain("Qualified");
    expect(html).not.toContain("Convert lead");
    expect(html).not.toContain("Archive lead");
  });

  it("shows Pipeline stage for non-converted leads without converted edit notice", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel({
          lead: {
            ...buildViewModel().lead,
            status: "open",
            statusLabel: "Open",
            convertedCustomer: null,
            derived: {
              isArchived: false,
              isConverted: false,
              isConvertible: true,
              allowedStatusTransitions: ["lost", "disqualified"],
            },
          },
          convertedCustomerHref: undefined,
        })}
        workflowLinks={{ edit: `/leads/${LEAD_ID}/edit` }}
      />,
    );

    expect(html).toContain("<dt>Pipeline stage</dt>");
    expect(html).not.toContain("<dt>Last pipeline stage</dt>");
    expect(html).not.toContain(CONVERTED_LEAD_EDIT_NOTICE);
    expect(html).toContain("Edit lead");
  });

  it("renders archived lead state independently of conversion", () => {
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
          convertedCustomerHref: undefined,
        })}
      />,
    );

    const badges = extractBadgeRegion(html);
    expect(badges).toContain("Archived");
    expect(badges).toContain("Open");
    expect(html).toContain("<dt>Archive status</dt>");
    expect(html).toContain("Archived");
  });
});

describe("LeadDetail Service terminology (TG2-AGENCY-SLICE)", () => {
  it("shows Client wording for the converted entity and convert workflow link under Service terminology", () => {
    const html = renderToStaticMarkup(
      <LeadDetail
        viewModel={buildViewModel()}
        workflowLinks={{ convert: `/leads/${LEAD_ID}/convert` }}
        terminology={{
          ...DEFAULT_PRODUCT_TERMINOLOGY,
          customer: { singular: "Client", plural: "Clients" },
          project: { singular: "Project", plural: "Projects" },
          site: { singular: "Site", plural: "Sites" },
          workOrder: { singular: "Work order", plural: "Work orders" },
          technician: { singular: "Technician", plural: "Technicians" },
        }}
      />,
    );

    expect(html).toContain("Converted client");
    expect(html).toContain('aria-label="Open converted client Prospect Co Customer"');
    expect(html).toContain("Client archived");
    expect(html).toContain("Convert to client");
    expect(html).not.toContain("Converted customer");
    expect(html).not.toContain("Customer archived");
  });

  it("defaults to Customer wording when no terminology is provided (backward compatible)", () => {
    const html = renderToStaticMarkup(<LeadDetail viewModel={buildViewModel()} />);

    expect(html).toContain("Converted customer");
    expect(html).toContain("Customer archived");
  });
});

describe("Lead history source display", () => {
  it("humanizes known and unknown history sources without changing stored values", () => {
    expect(formatLeadHistorySourceLabel("manual")).toBe("Manual");
    expect(formatLeadHistorySourceLabel("conversion")).toBe("Conversion");
    expect(formatLeadHistorySourceLabel("system")).toBe("System");
    expect(formatLeadHistorySourceLabel("import")).toBe("Import");
    expect(formatLeadHistorySourceLabel("lead_conversion")).toBe("Lead Conversion");
    expect(formatLeadHistorySourceLabel("")).toBe("Unknown");

    const html = renderToStaticMarkup(
      <LeadStatusHistorySection
        history={[
          {
            id: "hist-1",
            transitionLabel: "Status changed from Open to Converted",
            fromStatusLabel: "Open",
            toStatusLabel: "Converted",
            actorLabel: "Taylor Owner",
            sourceLabel: formatLeadHistorySourceLabel("conversion"),
            reason: null,
            timestampLabel: "Jul 14, 2026",
          },
        ]}
        historyState={{ kind: "ready" }}
      />,
    );

    expect(html).toContain("Conversion");
    expect(html).not.toContain(" · conversion · ");
  });
});
