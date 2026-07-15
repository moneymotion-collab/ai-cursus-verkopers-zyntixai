import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerDetail, CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import { customerPresentationContainsUuid } from "@/features/customers/ui/customer-presentation";

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
      sourceLabel: "manual",
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
  organizationTimezone: "UTC",
  backHref: "/customers",
  panelErrors: {},
};

describe("Customer detail presentation", () => {
  it("renders identity, history, tasks and enrollments without UUIDs", () => {
    const html = renderToStaticMarkup(<CustomerDetail viewModel={viewModel} />);

    expect(html).toContain("Acme Corp");
    expect(html).toContain("ops@acme.test");
    expect(html).toContain("Taylor Owner");
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
