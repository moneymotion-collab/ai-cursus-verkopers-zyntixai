import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerDetail } from "@/features/customers/ui/customer-detail";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import {
  buildCustomerArchiveHref,
  buildCustomerEditHref,
  buildCustomerRestoreHref,
  buildCustomerStatusHref,
} from "@/features/customers/ui/customer-navigation";
import {
  canShowArchiveWorkflow,
  canShowEditWorkflow,
  canShowRestoreWorkflow,
  canShowStatusWorkflow,
} from "@/features/customers/ui/customer-workflow-visibility";
import { archivedCustomerDetail, sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

function buildViewModel(
  customer: typeof sampleCustomerDetail,
  role: "owner" | "admin" | "staff" | "viewer",
): CustomerDetailViewModel {
  return {
    customer,
    permissions: resolveCustomerPermissions(role, { isArchived: customer.derived.isArchived }),
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
}

function workflowLinksFor(customer: typeof sampleCustomerDetail, role: "owner" | "admin" | "staff" | "viewer") {
  return {
    edit: canShowEditWorkflow(customer, role)
      ? buildCustomerEditHref(customer.id, listState)
      : undefined,
    status: canShowStatusWorkflow(customer, role)
      ? buildCustomerStatusHref(customer.id, listState)
      : undefined,
    archive: canShowArchiveWorkflow(customer, role)
      ? buildCustomerArchiveHref(customer.id, listState)
      : undefined,
    restore: canShowRestoreWorkflow(customer, role)
      ? buildCustomerRestoreHref(customer.id, listState)
      : undefined,
  };
}

describe("customer detail workflow controls", () => {
  it("shows edit, status and archive for owner on active customers", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={buildViewModel(sampleCustomerDetail, "owner")}
        workflowLinks={workflowLinksFor(sampleCustomerDetail, "owner")}
      />,
    );
    expect(html).toContain("Edit customer");
    expect(html).toContain("Change customer status");
    expect(html).toContain("Archive customer");
    expect(html).not.toContain("Restore customer");
    expect(html).toContain(`org=${ORG_ID}`);
  });

  it("shows edit and status only for staff", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={buildViewModel(sampleCustomerDetail, "staff")}
        workflowLinks={workflowLinksFor(sampleCustomerDetail, "staff")}
      />,
    );
    expect(html).toContain("Edit customer");
    expect(html).toContain("Change customer status");
    expect(html).not.toContain("Archive customer");
    expect(html).not.toContain("Restore customer");
  });

  it("shows no mutation controls for viewers", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={buildViewModel(sampleCustomerDetail, "viewer")}
        workflowLinks={workflowLinksFor(sampleCustomerDetail, "viewer")}
      />,
    );
    expect(html).not.toContain("Edit customer");
    expect(html).not.toContain("Change customer status");
    expect(html).not.toContain("Archive customer");
    expect(html).not.toContain("Restore customer");
  });

  it("shows restore only for owner/admin on archived customers", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={buildViewModel(archivedCustomerDetail, "owner")}
        workflowLinks={workflowLinksFor(archivedCustomerDetail, "owner")}
      />,
    );
    expect(html).toContain("Restore customer");
    expect(html).not.toContain("Edit customer");
    expect(html).not.toContain("Change customer status");
    expect(html).not.toContain("Archive customer");
  });
});
