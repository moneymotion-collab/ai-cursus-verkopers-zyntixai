import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { LeadListFilters } from "@/features/leads/ui/lead-list-filters";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

const sampleLead = {
  id: LEAD_ID,
  organizationId: ORG_ID,
  displayName: "Prospect Co",
  status: "converted" as const,
  statusLabel: "Converted",
  email: "ops@prospect.test",
  ownerMemberId: null,
  ownerLabel: "Unassigned",
  stageId: "44444444-4444-4444-8444-444444444444",
  stageName: "Qualified",
  stageCategory: "qualified" as const,
  stageCategoryLabel: "Qualified",
  sourceType: "manual",
  pursuitLabel: "Q3 deal",
  convertedCustomerId: "33333333-3333-4333-8333-333333333333",
  convertedAt: "2026-07-14T10:00:00.000Z",
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false, isConverted: true, isConvertible: false },
};

describe("LeadListPresentation", () => {
  it("renders status, stage and converted indicators without leaking ids", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[sampleLead]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads"
        emptyDescription="None"
      />,
    );

    expect(html).toContain("Prospect Co");
    expect(html).toContain("Converted");
    expect(html).toContain("Qualified");
    expect(html).toContain(`href="/leads/${LEAD_ID}?org=${ORG_ID}"`);
  });

  it("renders empty state with clear filters link", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads match the selected filters."
        emptyDescription="Try adjusting filters."
        clearFiltersHref="/leads"
      />,
    );

    expect(html).toContain("No leads match the selected filters.");
    expect(html).toContain("Clear filters");
  });
});

describe("LeadListFilters", () => {
  it("hides archived filter for viewer", () => {
    const html = renderToStaticMarkup(
      <LeadListFilters urlState={listState} role="viewer" ownerOptions={[]} stageOptions={[]} />,
    );
    expect(html).not.toContain("Show archived leads");
  });

  it("shows archived filter for owner", () => {
    const html = renderToStaticMarkup(
      <LeadListFilters urlState={listState} role="owner" ownerOptions={[]} stageOptions={[]} />,
    );
    expect(html).toContain("Show archived leads");
  });
});
