import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { LeadListFilters } from "@/features/leads/ui/lead-list-filters";
import { toLeadListPresentationRow } from "@/features/leads/ui/lead-presentation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";

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
  stageId: STAGE_ID,
  stageName: "Qualified",
  stageCategory: "qualified" as const,
  stageCategoryLabel: "Qualified",
  sourceType: "manual",
  pursuitLabel: "Q3 deal",
  convertedCustomerId: "55555555-5555-4555-8555-555555555555",
  convertedAt: "2026-07-14T10:00:00.000Z",
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false, isConverted: true, isConvertible: false },
};

const archivedConvertedLead = {
  ...sampleLead,
  id: "66666666-6666-4666-8666-666666666666",
  displayName: "Archived Converted Co",
  archivedAt: "2026-07-15T10:00:00.000Z",
  derived: { isArchived: true, isConverted: true, isConvertible: false },
};

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("LeadListPresentation", () => {
  it("renders Lead status and Assigned to headers with a single Converted status label", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[sampleLead]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads"
        emptyDescription="None"
      />,
    );

    expect(html).toContain("<th scope=\"col\">Lead</th>");
    expect(html).toContain("<th scope=\"col\">Lead status</th>");
    expect(html).toContain("<th scope=\"col\">Pipeline stage</th>");
    expect(html).toContain("<th scope=\"col\">Assigned to</th>");
    expect(html).toContain("<th scope=\"col\">Email</th>");
    expect(html).toContain("<th scope=\"col\">Updated</th>");
    expect(html).not.toContain("<th scope=\"col\">Status</th>");
    expect(html).not.toContain("<th scope=\"col\">Owner</th>");

    expect(html).toContain("Prospect Co");
    expect(html).toContain(`href="/leads/${LEAD_ID}?org=${ORG_ID}"`);
    expect(html).toContain("Qualified");
    expect(html).toContain("<dt>Assigned to</dt>");
    expect(html).not.toContain("<dt>Owner</dt>");

    // Table + mobile card each show status once; no extra name-cell Converted badge.
    expect(countOccurrences(html, ">Converted<")).toBe(2);
    expect(html).not.toContain("inlineBadges");
  });

  it("keeps Archived independent of Converted status", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[archivedConvertedLead]}
        timeZone="UTC"
        listState={{ ...listState, archived: true }}
        emptyTitle="No leads"
        emptyDescription="None"
      />,
    );

    expect(html).toContain("Archived Converted Co");
    expect(html).toContain(">Archived<");
    expect(countOccurrences(html, ">Converted<")).toBe(2);
    expect(html).toContain(`href="/leads/${archivedConvertedLead.id}?org=${ORG_ID}`);
  });

  it("does not expose a secondary convertedLabel in presentation rows", () => {
    const row = toLeadListPresentationRow(sampleLead, {
      detailHref: `/leads/${LEAD_ID}`,
      timeZone: "UTC",
    });

    expect(row.statusLabel).toBe("Converted");
    expect(row.archivedLabel).toBeNull();
    expect(row).not.toHaveProperty("convertedLabel");
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
  it("renders updated filter terminology while preserving query keys and values", () => {
    const html = renderToStaticMarkup(
      <LeadListFilters
        urlState={listState}
        role="owner"
        ownerOptions={[{ value: MEMBER_ID, label: "Taylor Owner" }]}
        stageOptions={[
          {
            stageId: STAGE_ID,
            name: "Qualified",
            position: 2,
            stageCategory: "qualified",
            stageCategoryLabel: "Qualified",
            isDefault: false,
            isArchived: false,
          },
        ]}
      />,
    );

    expect(html).toContain('for="filter-lead-status">Lead status</label>');
    expect(html).toContain('name="status"');
    expect(html).toContain('value="open"');
    expect(html).toContain('value="converted"');
    expect(html).toContain('value="lost"');
    expect(html).toContain('value="disqualified"');

    expect(html).toContain('for="filter-lead-owner">Assigned to</label>');
    expect(html).toContain('name="owner"');
    expect(html).toContain(">Anyone</option>");
    expect(html).not.toContain("Any owner");
    expect(html).toContain(`value="${MEMBER_ID}"`);

    expect(html).toContain('name="sort"');
    expect(html).toContain('value="display_name"');
    expect(html).toContain("Lead name");
    expect(html).not.toContain(">Display name</option>");

    expect(html).toContain('name="q"');
    expect(html).toContain('placeholder="Search by lead name or email"');
    expect(html).not.toContain("Search by display name or email");

    expect(html).toContain('name="stage"');
    expect(html).toContain('name="direction"');
    expect(html).toContain('name="archived"');
    expect(html).toContain('name="page"');
  });

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
