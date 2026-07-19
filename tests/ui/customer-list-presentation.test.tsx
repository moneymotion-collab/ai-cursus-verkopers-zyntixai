import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import { CustomerListFilters } from "@/features/customers/ui/customer-list-filters";
import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";
import { customerPresentationContainsUuid } from "@/features/customers/ui/customer-presentation";

const ORG_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

const customer: CustomerListItemReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: ORG_ID,
  displayName: "Acme Corp",
  status: "active",
  statusLabel: "Active",
  email: "ops@acme.test",
  ownerMemberId: MEMBER_ID,
  ownerLabel: "Taylor Owner",
  startedAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false },
};

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("CustomerListPresentation", () => {
  it("renders approved list terminology without UUID leakage", () => {
    const html = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[customer]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No customers"
        emptyDescription="None available"
      />,
    );

    expect(html).toContain("<th scope=\"col\">Customer</th>");
    expect(html).toContain("<th scope=\"col\">Customer status</th>");
    expect(html).toContain("<th scope=\"col\">Assigned to</th>");
    expect(html).toContain("<th scope=\"col\">Email</th>");
    expect(html).toContain("<th scope=\"col\">Customer since</th>");
    expect(html).toContain("<th scope=\"col\">Updated</th>");
    expect(html).not.toContain("<th scope=\"col\">Status</th>");
    expect(html).not.toContain("<th scope=\"col\">Owner</th>");
    expect(html).not.toContain("<th scope=\"col\">Started</th>");

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Active");
    expect(html).toContain("Taylor Owner");
    expect(html).toContain("<dt>Assigned to</dt>");
    expect(html).not.toContain("<dt>Owner</dt>");
    expect(html).toContain("<table");
    expect(html).toContain('aria-label="Customer list"');
    expect(customerPresentationContainsUuid(html.replace(/href="[^"]*"/g, ""))).toBe(false);
  });

  it("renders archived label separately from customer status", () => {
    const html = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[
          {
            ...customer,
            archivedAt: "2026-07-14T12:00:00.000Z",
            derived: { isArchived: true },
          },
        ]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No customers"
        emptyDescription="None available"
      />,
    );

    expect(html).toContain("Active");
    expect(html).toContain("Archived");
  });

  it("renders filtered empty state with clear link", () => {
    const html = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[]}
        timeZone="UTC"
        listState={{ ...listState, q: "missing" }}
        emptyTitle="No customers match the selected filters."
        emptyDescription="Try clearing filters."
        clearFiltersHref={`/customers?org=${ORG_ID}`}
      />,
    );

    expect(html).toContain("No customers match the selected filters.");
    expect(html).toContain("Clear filters");
  });
});

describe("CustomerListFilters", () => {
  it("renders updated filter terminology while preserving query keys and values", () => {
    const html = renderToStaticMarkup(
      <CustomerListFilters
        urlState={listState}
        role="owner"
        ownerOptions={[{ value: MEMBER_ID, label: "Taylor Owner" }]}
      />,
    );

    expect(html).toContain('for="filter-customer-status">Customer status</label>');
    expect(html).toContain('name="status"');
    expect(html).toContain('value="onboarding"');
    expect(html).toContain('value="active"');

    expect(html).toContain('for="filter-customer-owner">Assigned to</label>');
    expect(html).toContain('name="owner"');
    expect(html).toContain(">Anyone</option>");
    expect(html).not.toContain("Any owner");

    expect(html).toContain('name="sort"');
    expect(html).toContain('value="display_name"');
    expect(html).toContain("Customer name");
    expect(html).toContain('value="started_at"');
    expect(html).toContain("Customer since");
    expect(html).not.toContain(">Display name</option>");
    expect(html).not.toContain("Started date");

    expect(html).toContain('name="q"');
    expect(html).toContain('placeholder="Search by customer name or email"');
    expect(html).not.toContain("Search by display name or email");
  });
});
