import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import { CustomerListFilters } from "@/features/customers/ui/customer-list-filters";
import { CustomerDetail, CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import { SERVICE_PRODUCT_TERMINOLOGY } from "../features/product-access/module-access-fixtures";

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

describe("BETA1-4TG-TERMINOLOGY — Service Customers UI renders Client/Clients", () => {
  it("CustomerListPresentation renders Client column headers and list aria-label", () => {
    const html = renderToStaticMarkup(
      <CustomerListPresentation
        customers={[customer]}
        timeZone="UTC"
        listState={listState}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
        emptyTitle="No clients"
        emptyDescription="None available"
      />,
    );

    expect(html).toContain('<th scope="col">Client</th>');
    expect(html).toContain('<th scope="col">Client status</th>');
    expect(html).toContain('<th scope="col">Client since</th>');
    expect(html).not.toContain('<th scope="col">Customer</th>');
    expect(html).toContain('aria-label="Client list"');
  });

  it("CustomerListFilters renders Client/Clients wording in labels and placeholder", () => {
    const html = renderToStaticMarkup(
      <CustomerListFilters
        urlState={listState}
        role="owner"
        ownerOptions={[{ value: MEMBER_ID, label: "Taylor Owner" }]}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      />,
    );

    expect(html).toContain('for="filter-customer-status">Client status</label>');
    expect(html).toContain("Client name");
    expect(html).toContain("Client since");
    expect(html).toContain('placeholder="Search by client name or email"');
    expect(html).toContain("Show archived clients");
    expect(html).not.toContain("Customer status");
  });

  it("CustomerUnavailableDetail renders Client wording for Service context", () => {
    const html = renderToStaticMarkup(
      <CustomerUnavailableDetail backHref="/customers" terminology={SERVICE_PRODUCT_TERMINOLOGY} />,
    );
    expect(html).toContain("Client unavailable");
    expect(html).toContain("Back to clients");
    expect(html).not.toContain("Customer unavailable");
  });

  it("CustomerDetail renders Client wording for section headings and metadata labels", () => {
    const viewModel: CustomerDetailViewModel = {
      customer: {
        id: "11111111-1111-4111-8111-111111111111",
        organizationId: ORG_ID,
        displayName: "Acme Corp",
        firstName: "Acme",
        lastName: "Corp",
        email: "ops@acme.test",
        phone: "+1 555 0100",
        status: "active",
        statusLabel: "Active",
        ownerMemberId: MEMBER_ID,
        ownerLabel: "Taylor Owner",
        createdByMemberId: MEMBER_ID,
        createdByLabel: "Taylor Owner",
        startedAt: "2026-07-14T10:00:00.000Z",
        endedAt: null,
        archivedAt: null,
        createdAt: "2026-07-14T10:00:00.000Z",
        updatedAt: "2026-07-14T10:00:00.000Z",
        derived: { isArchived: false, allowedTransitions: [] },
      },
      permissions: resolveCustomerPermissions("staff"),
      history: [],
      historyState: { kind: "hidden" },
      enrollments: [],
      enrollmentState: { kind: "hidden" },
      relatedTasks: [],
      relatedTasksState: { kind: "hidden" },
      projects: [],
      projectsState: { kind: "hidden" },
      organizationTimezone: "UTC",
      backHref: "/customers",
      panelErrors: {},
    };

    const html = renderToStaticMarkup(
      <CustomerDetail viewModel={viewModel} terminology={SERVICE_PRODUCT_TERMINOLOGY} />,
    );

    expect(html).toContain("Back to clients");
    expect(html).toContain("Client details");
    expect(html).toContain("<dt>Client name</dt>");
    expect(html).toContain("<dt>Client status</dt>");
    expect(html).toContain("<dt>Client since</dt>");
    expect(html).not.toContain("Customer details");
  });
});
