import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { LeadListFilters } from "@/features/leads/ui/lead-list-filters";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { LeadStatusHistorySection } from "@/features/leads/ui/lead-status-history";

describe("leads UI accessibility", () => {
  it("renders Leads navigation between Home and Customers with active state", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="leads"
        membersNavVisible={false}
        organizationOptions={[
          { organizationId: "11111111-1111-4111-8111-111111111111", role: "owner", displayName: "Org Alpha" },
        ]}
        selectedOrganizationId="11111111-1111-4111-8111-111111111111"
        organizationSelectorAction="/leads"
      >
        <h1>Leads</h1>
      </AppShell>,
    );

    const homeIndex = html.indexOf(">Home<");
    const leadsIndex = html.indexOf(">Leads<");
    const customersIndex = html.indexOf(">Customers<");
    const tasksIndex = html.indexOf(">Tasks<");
    expect(homeIndex).toBeGreaterThan(-1);
    expect(leadsIndex).toBeGreaterThan(homeIndex);
    expect(customersIndex).toBeGreaterThan(leadsIndex);
    expect(tasksIndex).toBeGreaterThan(customersIndex);
    expect(html).toContain(
      'href="/leads?org=11111111-1111-4111-8111-111111111111"',
    );
    expect(html).toContain(
      'href="/customers?org=11111111-1111-4111-8111-111111111111"',
    );
    expect(html).toContain('aria-current="page"');
    expect(html.match(/<main\b/g)?.length).toBe(1);
  });

  it("renders labelled filters and semantic list structures", () => {
    const filters = renderToStaticMarkup(
      <LeadListFilters
        urlState={{
          org: "11111111-1111-4111-8111-111111111111",
          archived: false,
          sort: "display_name",
          direction: "asc",
          page: 1,
          pageSize: 25,
        }}
        role="owner"
        ownerOptions={[{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }]}
        stageOptions={[
          {
            stageId: "44444444-4444-4444-8444-444444444444",
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

    expect(filters).toContain('for="filter-lead-search"');
    expect(filters).toContain('for="filter-lead-status">Lead status</label>');
    expect(filters).toContain('for="filter-lead-owner">Assigned to</label>');
    expect(filters).toContain('placeholder="Search by lead name or email"');
    expect(filters).toContain('value="display_name"');
    expect(filters).toContain("Lead name");
    expect(filters).toContain("Show archived leads");

    const list = renderToStaticMarkup(
      <LeadListPresentation
        leads={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            organizationId: "11111111-1111-4111-8111-111111111111",
            displayName: "Prospect Co",
            status: "converted",
            statusLabel: "Converted",
            email: "ops@prospect.test",
            ownerMemberId: null,
            ownerLabel: "Unassigned",
            stageId: "44444444-4444-4444-8444-444444444444",
            stageName: "New",
            stageCategory: "new",
            stageCategoryLabel: "New",
            sourceType: "manual",
            pursuitLabel: null,
            convertedCustomerId: "55555555-5555-4555-8555-555555555555",
            convertedAt: "2026-07-14T10:00:00.000Z",
            createdAt: "2026-07-14T10:00:00.000Z",
            updatedAt: "2026-07-14T10:00:00.000Z",
            archivedAt: null,
            derived: { isArchived: false, isConverted: true, isConvertible: false },
          },
        ]}
        timeZone="UTC"
        listState={{
          org: "11111111-1111-4111-8111-111111111111",
          archived: false,
          sort: "display_name",
          direction: "asc",
          page: 1,
          pageSize: 25,
        }}
        emptyTitle="No leads"
        emptyDescription="None"
      />,
    );

    expect(list).toContain("<table");
    expect(list).toContain("<th scope=\"col\">Lead status</th>");
    expect(list).toContain("<th scope=\"col\">Assigned to</th>");
    expect(list).toContain("Pipeline stage");
    expect(list).toContain("Prospect Co");
    expect(list).toContain(">Converted<");
    expect(list.split(">Converted<").length - 1).toBe(2);
    expect(list).toContain("<dt>Assigned to</dt>");

    const history = renderToStaticMarkup(
      <LeadStatusHistorySection
        history={[
          {
            id: "hist-1",
            transitionLabel: "Status changed from Open to Lost",
            fromStatusLabel: "Open",
            toStatusLabel: "Lost",
            actorLabel: "Taylor Owner",
            sourceLabel: "Manual",
            reason: null,
            timestampLabel: "Jul 14, 2026",
          },
        ]}
        historyState={{ kind: "ready" }}
      />,
    );

    expect(history).toContain('aria-label="Lead status history"');
    expect(history).toContain("<ol");
    expect(history).toContain("Manual");
  });

  it("renders accessible pagination labels", () => {
    const html = renderToStaticMarkup(
      <Pagination
        page={2}
        totalPages={3}
        previousHref="/leads?page=1"
        nextHref="/leads?page=3"
        ariaLabel="Lead list pagination"
      />,
    );

    expect(html).toContain('aria-label="Lead list pagination"');
  });
});
