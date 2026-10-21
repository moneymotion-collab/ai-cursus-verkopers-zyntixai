import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerDetail, CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import {
  customerPresentationContainsUuid,
  formatCustomerHistorySourceLabel,
} from "@/features/customers/ui/customer-presentation";
import { CustomerHistorySection } from "@/features/customers/ui/customer-history";
import type { ProjectRecord } from "@/features/projects/domain/types";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";

const viewModel: CustomerDetailViewModel = {
  customer: {
    id: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    displayName: "Acme Corp",
    firstName: "Acme",
    lastName: "Corp",
    email: "ops@acme.test",
    phone: "+1 555 0100",
    status: "active",
    statusLabel: "Active",
    ownerMemberId: "33333333-3333-4333-8333-333333333333",
    ownerLabel: "Taylor Owner",
    createdByMemberId: "33333333-3333-4333-8333-333333333333",
    createdByLabel: "Taylor Owner",
    startedAt: "2026-07-14T10:00:00.000Z",
    endedAt: null,
    archivedAt: null,
    createdAt: "2026-07-14T10:00:00.000Z",
    updatedAt: "2026-07-14T10:00:00.000Z",
    derived: { isArchived: false, allowedTransitions: [] },
  },
  permissions: resolveCustomerPermissions("staff"),
  history: [
    {
      id: "history-1",
      transitionLabel: "Status set to Active",
      fromStatusLabel: null,
      toStatusLabel: "Active",
      actorLabel: "Taylor Owner",
      sourceLabel: formatCustomerHistorySourceLabel("manual"),
      reason: "Onboarding complete",
      timestampLabel: "Jul 14, 2026",
    },
  ],
  historyState: { kind: "ready" },
  enrollments: [
    {
      enrollmentId: "enroll-1",
      programId: "prog-1",
      programName: "Trading Foundations",
      status: "active",
      statusLabel: "Active",
      enrolledAt: "2026-07-14T10:00:00.000Z",
      detailHref: "/enrollments/enroll-1?org=22222222-2222-4222-8222-222222222222",
    },
  ],
  enrollmentState: { kind: "ready" },
  relatedTasks: [
    {
      id: "task-1",
      title: "Welcome call",
      statusLabel: "Open",
      dueStateLabel: "Upcoming",
      dueAtLabel: "Jul 15, 2026",
      assigneeLabel: "Taylor Owner",
      detailHref: "/tasks/task-1?org=22222222-2222-4222-8222-222222222222",
    },
  ],
  relatedTasksState: { kind: "ready" },
  projects: [],
  projectsState: { kind: "hidden" },
  organizationTimezone: "UTC",
  backHref: "/customers",
  panelErrors: {},
};

describe("Customer detail presentation", () => {
  it("renders approved Customer details terminology without UUIDs", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={viewModel}
        workflowLinks={{
          edit: "/customers/11111111-1111-4111-8111-111111111111/edit",
          status: "/customers/11111111-1111-4111-8111-111111111111/status",
        }}
      />,
    );

    expect(html).toContain("Customer details");
    expect(html).toContain("<dt>Customer name</dt>");
    expect(html).toContain("<dt>Assigned to</dt>");
    expect(html).toContain("<dt>Customer status</dt>");
    expect(html).toContain("<dt>Archive status</dt>");
    expect(html).toContain("<dt>Customer since</dt>");
    expect(html).toContain("<dt>End date</dt>");
    expect(html).toContain("Not provided");
    expect(html).toContain("Created by");
    expect(html).toContain("Change customer status");
    expect(html).not.toContain("Customer identity");
    expect(html).not.toContain("<dt>Display name</dt>");
    expect(html).not.toContain("<dt>Owner</dt>");
    expect(html).not.toContain("Lifecycle status");
    expect(html).not.toContain("Archive state");
    expect(html).not.toContain("<dt>Started</dt>");
    expect(html).not.toContain("<dt>Ended</dt>");

    expect(html).toContain("Acme Corp");
    expect(html).toContain("ops@acme.test");
    expect(html).toContain("Taylor Owner");
    expect(html).toContain("Active");
    expect(html).toContain("Status history");
    expect(html).toContain("Related tasks");
    expect(html).toContain("Enrollment summary");
    expect(html).toContain("Welcome call");
    expect(customerPresentationContainsUuid(html.replace(/href="[^"]*"/g, ""))).toBe(false);
  });

  it("renders indistinguishable unavailable state", () => {
    const html = renderToStaticMarkup(
      <CustomerUnavailableDetail backHref="/customers?org=22222222-2222-4222-8222-222222222222" />,
    );

    expect(html).toContain("Customer unavailable");
    expect(html).toContain("Back to customers");
    expect(html).not.toContain("not found");
  });
});

describe("Customer detail contextual Enrollment links and summary links (B1.5.9)", () => {
  it("links the enrollment summary program name to the enrollment detail when detailHref is provided", () => {
    const html = renderToStaticMarkup(<CustomerDetail viewModel={viewModel} />);

    expect(html).toContain(
      'href="/enrollments/enroll-1?org=22222222-2222-4222-8222-222222222222"',
    );
    expect(html).toContain("Trading Foundations");
  });

  it("renders the program name as plain text when detailHref is absent", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{
          ...viewModel,
          enrollments: [{ ...viewModel.enrollments[0], detailHref: undefined }],
        }}
      />,
    );

    expect(html).not.toContain('href="/enrollments/enroll-1');
    expect(html).toContain("Trading Foundations");
  });

  it("renders View enrollments and New enrollment when enrollmentLinks provides both hrefs", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={viewModel}
        enrollmentLinks={{
          viewEnrollmentsHref: "/enrollments?customerId=11111111-1111-4111-8111-111111111111",
          createEnrollmentHref:
            "/enrollments/new?customerId=11111111-1111-4111-8111-111111111111",
        }}
      />,
    );

    expect(html).toContain('aria-label="Enrollment actions"');
    expect(html).toContain("View enrollments");
    expect(html).toContain(
      'href="/enrollments?customerId=11111111-1111-4111-8111-111111111111"',
    );
    expect(html).toContain("New enrollment");
    expect(html).toContain(
      'href="/enrollments/new?customerId=11111111-1111-4111-8111-111111111111"',
    );
  });

  it("renders View enrollments only when createEnrollmentHref is absent (viewer or ineligible customer)", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={viewModel}
        enrollmentLinks={{
          viewEnrollmentsHref: "/enrollments?customerId=11111111-1111-4111-8111-111111111111",
        }}
      />,
    );

    expect(html).toContain("View enrollments");
    expect(html).not.toContain("New enrollment");
  });

  it("omits the Enrollment actions nav entirely when enrollmentLinks is not provided", () => {
    const html = renderToStaticMarkup(<CustomerDetail viewModel={viewModel} />);
    expect(html).not.toContain('aria-label="Enrollment actions"');
    expect(html).not.toContain("View enrollments");
  });
});

describe("Customer detail Projects continuity (TG2-AGENCY-SLICE)", () => {
  const sampleProject: ProjectRecord = {
    id: "44444444-4444-4444-8444-444444444444",
    organizationId: "22222222-2222-4222-8222-222222222222",
    customerId: "11111111-1111-4111-8111-111111111111",
    customerLabel: "Acme Corp",
    name: "Website revamp",
    summary: null,
    status: "active",
    ownerMemberId: "33333333-3333-4333-8333-333333333333",
    ownerLabel: "Taylor Owner",
    plannedStart: "2026-08-01",
    plannedEnd: "2026-09-01",
    archivedAt: null,
    createdAt: "2026-07-14T10:00:00.000Z",
    updatedAt: "2026-07-14T10:00:00.000Z",
  };

  it("renders related Projects with status and a New project link when discoverable", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{
          ...viewModel,
          projects: [sampleProject],
          projectsState: { kind: "ready" },
        }}
        projectLinks={{
          createProjectHref:
            "/projects/new?org=22222222-2222-4222-8222-222222222222&customerId=11111111-1111-4111-8111-111111111111",
        }}
      />,
    );

    expect(html).toContain("Projects");
    expect(html).toContain("Website revamp");
    expect(html).toContain(
      `href="/projects/${sampleProject.id}?org=22222222-2222-4222-8222-222222222222"`,
    );
    expect(html).toContain("New project");
    expect(html).toContain(
      'href="/projects/new?org=22222222-2222-4222-8222-222222222222&amp;customerId=11111111-1111-4111-8111-111111111111"',
    );
  });

  it("uses Job terminology for the Field Customer-to-Job creation action", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{
          ...viewModel,
          projects: [sampleProject],
          projectsState: { kind: "ready" },
        }}
        projectLinks={{ createProjectHref: "/projects/new?customerId=customer" }}
        terminology={{
          ...DEFAULT_PRODUCT_TERMINOLOGY,
          customer: { singular: "Customer", plural: "Customers" },
          project: { singular: "Job", plural: "Jobs" },
          site: { singular: "Site", plural: "Sites" },
          workOrder: { singular: "Work order", plural: "Work orders" },
          technician: { singular: "Technician", plural: "Technicians" },
        }}
      />,
    );

    expect(html).toContain(">Jobs<");
    expect(html).toContain(">New job<");
    expect(html).toContain('aria-label="Job actions"');
    expect(html).not.toContain(">New project<");
  });

  it("renders a useful empty state when no Projects are linked yet", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{ ...viewModel, projects: [], projectsState: { kind: "empty" } }}
      />,
    );

    expect(html).toContain("No projects are linked to this customer yet.");
  });

  it("uses Client terminology in the Service Projects empty state", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{ ...viewModel, projects: [], projectsState: { kind: "empty" } }}
        terminology={{
          ...DEFAULT_PRODUCT_TERMINOLOGY,
          customer: { singular: "Client", plural: "Clients" },
        }}
      />,
    );

    expect(html).toContain("No projects are linked to this client yet.");
    expect(html).not.toContain("linked to this customer");
  });

  it("omits the Projects section entirely when hidden (module not visible in this context)", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{ ...viewModel, projects: [], projectsState: { kind: "hidden" } }}
      />,
    );

    expect(html).not.toContain("customer-projects-title");
  });

  it("surfaces a reload affordance when Projects fail to load without hiding the rest of the page", () => {
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{
          ...viewModel,
          projects: [],
          projectsState: { kind: "error", message: "Related projects could not be loaded." },
        }}
        reloadHref="/customers/11111111-1111-4111-8111-111111111111"
      />,
    );

    expect(html).toContain("Related projects could not be loaded.");
    expect(html).toContain("Acme Corp");
  });
});

describe("Customer history source display", () => {
  it("humanizes known and unknown history sources without rewriting stored values", () => {
    expect(formatCustomerHistorySourceLabel("manual")).toBe("Manual");
    expect(formatCustomerHistorySourceLabel("lead_conversion")).toBe("Lead conversion");
    expect(formatCustomerHistorySourceLabel("system")).toBe("System");
    expect(formatCustomerHistorySourceLabel("import")).toBe("Import");
    expect(formatCustomerHistorySourceLabel("custom_event")).toBe("Custom Event");
    expect(formatCustomerHistorySourceLabel("")).toBe("Unknown");

    const html = renderToStaticMarkup(
      <CustomerHistorySection
        history={[
          {
            id: "history-1",
            transitionLabel: "Status set to Onboarding",
            fromStatusLabel: null,
            toStatusLabel: "Onboarding",
            actorLabel: "System",
            sourceLabel: formatCustomerHistorySourceLabel("lead_conversion"),
            reason: null,
            timestampLabel: "Jul 14, 2026",
          },
        ]}
        historyState={{ kind: "ready" }}
      />,
    );

    expect(html).toContain("Lead conversion");
    expect(html).not.toContain("lead_conversion");
  });
});
