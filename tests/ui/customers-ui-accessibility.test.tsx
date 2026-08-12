import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { CustomerListFilters } from "@/features/customers/ui/customer-list-filters";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import { CustomerHistorySection } from "@/features/customers/ui/customer-history";

describe("customers UI accessibility", () => {
  it("renders Customers navigation between Leads and Tasks with active state", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        organizationOptions={[
          { organizationId: "11111111-1111-4111-8111-111111111111", role: "owner", displayName: "Org Alpha" },
        ]}
        selectedOrganizationId="11111111-1111-4111-8111-111111111111"
        organizationSelectorAction="/customers"
      >
        <h1>Customers</h1>
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
    expect(html).toContain('href="/customers"');
    expect(html).toContain('href="/tasks"');
    expect(html).toContain('aria-current="page"');
    expect(html.match(/<main\b/g)?.length).toBe(1);
  });

  it("renders labelled filters and semantic list/table structures", () => {
    const filters = renderToStaticMarkup(
      <CustomerListFilters
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
      />,
    );

    expect(filters).toContain('for="filter-customer-search"');
    expect(filters).toContain('for="filter-customer-status">Customer status</label>');
    expect(filters).toContain('for="filter-customer-owner">Assigned to</label>');
    expect(filters).toContain('placeholder="Search by customer name or email"');
    expect(filters).toContain("Show archived customers");

    const list = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            organizationId: "11111111-1111-4111-8111-111111111111",
            displayName: "Acme",
            status: "active",
            statusLabel: "Active",
            email: null,
            ownerMemberId: null,
            ownerLabel: "Unassigned",
            startedAt: "2026-07-14T10:00:00.000Z",
            updatedAt: "2026-07-14T10:00:00.000Z",
            archivedAt: null,
            derived: { isArchived: false },
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
        emptyTitle="Empty"
        emptyDescription="None"
      />,
    );

    expect(list).toContain("<th");
    expect(list).toContain("<th scope=\"col\">Customer status</th>");
    expect(list).toContain("<th scope=\"col\">Assigned to</th>");
    expect(list).toContain("<th scope=\"col\">Customer since</th>");
    expect(list).toContain('aria-label="Customer list"');
  });

  it("uses alert semantics for history errors", () => {
    const html = renderToStaticMarkup(
      <CustomerHistorySection
        history={[]}
        historyState={{ kind: "error", message: "Status history could not be loaded." }}
      />,
    );

    expect(html).toContain('role="alert"');
  });

  it("renders customer pagination with an accurate navigation label", () => {
    const html = renderToStaticMarkup(
      <Pagination
        page={2}
        totalPages={4}
        previousHref="/customers?page=1"
        nextHref="/customers?page=3"
        ariaLabel="Customer list pagination"
      />,
    );

    expect(html).toContain('aria-label="Customer list pagination"');
    expect(html).not.toContain('aria-label="Task list pagination"');
  });
});

describe("customers app shell stylesheet contract", () => {
  it("preserves tasks navigation link", () => {
    const shell = readFileSync(path.join(process.cwd(), "src/components/app-shell.tsx"), "utf8");
    expect(shell).toContain('href="/tasks"');
    expect(shell).toContain('href="/customers"');
  });
});
