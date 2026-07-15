import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";
import { customerPresentationContainsUuid } from "@/features/customers/ui/customer-presentation";

const customer: CustomerListItemReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  displayName: "Acme Corp",
  status: "active",
  statusLabel: "Active",
  email: "ops@acme.test",
  ownerMemberId: "33333333-3333-4333-8333-333333333333",
  ownerLabel: "Taylor Owner",
  startedAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false },
};

const listState = {
  org: "22222222-2222-4222-8222-222222222222",
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("CustomerListPresentation", () => {
  it("renders desktop table and mobile cards without UUID leakage", () => {
    const html = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[customer]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No customers"
        emptyDescription="None available"
      />,
    );

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Active");
    expect(html).toContain("Taylor Owner");
    expect(html).toContain("<table");
    expect(html).toContain('aria-label="Customer list"');
    expect(customerPresentationContainsUuid(html.replace(/href="[^"]*"/g, ""))).toBe(false);
  });

  it("renders archived label separately from lifecycle status", () => {
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
        clearFiltersHref="/customers?org=22222222-2222-4222-8222-222222222222"
      />,
    );

    expect(html).toContain("No customers match the selected filters.");
    expect(html).toContain("Clear filters");
  });
});
