import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerDetail } from "@/features/customers/ui/customer-detail";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import { ProgramDetail } from "@/features/programs/ui/program-detail";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import {
  buildEnrollmentCreateHrefFromContext,
  buildEnrollmentsListHrefFromContext,
} from "@/features/enrollments/ui/enrollment-navigation";
import { canShowCreateEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import {
  isCustomerEligibleForEnrollmentCreate,
  isProgramEligibleForEnrollmentCreate,
} from "@/features/enrollments/domain/contextual-enrollment";
import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import { sampleProgramDetail } from "../helpers/program-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const ORG_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";

const customerViewModel: CustomerDetailViewModel = {
  customer: {
    id: CUSTOMER_ID,
    organizationId: ORG_ID,
    displayName: "Acme Corp",
    firstName: "Acme",
    lastName: "Corp",
    email: null,
    phone: null,
    status: "active",
    statusLabel: "Active",
    ownerMemberId: null,
    ownerLabel: "Unassigned",
    createdByMemberId: null,
    createdByLabel: "Unassigned",
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
  enrollmentState: { kind: "empty" },
  relatedTasks: [],
  relatedTasksState: { kind: "hidden" },
  projects: [],
  projectsState: { kind: "hidden" },
  organizationTimezone: "UTC",
  backHref: "/customers",
  panelErrors: {},
};

const programViewModel: ProgramDetailViewModel = {
  program: sampleProgramDetail,
  permissions: {
    canListPrograms: true,
    canViewProgram: true,
    canViewArchivedPrograms: false,
    canCreateProgram: false,
    canUpdateProgram: false,
    canTransitionProgramStatus: false,
    canArchiveProgram: false,
    canRestoreProgram: false,
    canViewProgramHistory: true,
  },
  history: [],
  historyState: { kind: "hidden" },
  descriptionLabel: "Cohort coaching program",
  organizationTimezone: "UTC",
  backHref: "/programs",
};

/** Mirrors the wiring performed in customers/[customerId]/page.tsx. */
function buildCustomerEnrollmentLinks(role: EnrollmentRole, customer: { status: string; derived: { isArchived: boolean } }) {
  return {
    viewEnrollmentsHref: buildEnrollmentsListHrefFromContext({ org: ORG_ID, customerId: CUSTOMER_ID }),
    createEnrollmentHref:
      canShowCreateEnrollmentWorkflow(role) && isCustomerEligibleForEnrollmentCreate(customer)
        ? buildEnrollmentCreateHrefFromContext({ org: ORG_ID, customerId: CUSTOMER_ID })
        : undefined,
  };
}

/** Mirrors the wiring performed in programs/[programId]/page.tsx. */
function buildProgramEnrollmentLinks(role: EnrollmentRole, program: { status: string; derived: { isArchived: boolean } }) {
  return {
    viewEnrollmentsHref: buildEnrollmentsListHrefFromContext({ org: ORG_ID, programId: sampleProgramDetail.id }),
    createEnrollmentHref:
      canShowCreateEnrollmentWorkflow(role) && isProgramEligibleForEnrollmentCreate(program)
        ? buildEnrollmentCreateHrefFromContext({ org: ORG_ID, programId: sampleProgramDetail.id })
        : undefined,
  };
}

describe("Customer detail contextual Enrollment wiring by role and eligibility (B1.5.9)", () => {
  it("owner/admin/staff see View + New for an eligible (active, non-archived) customer", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      const links = buildCustomerEnrollmentLinks(role, customerViewModel.customer);
      const html = renderToStaticMarkup(
        <CustomerDetail viewModel={customerViewModel} enrollmentLinks={links} />,
      );
      expect(html).toContain("View enrollments");
      expect(html).toContain("New enrollment");
      expect(links.createEnrollmentHref).toContain(`customerId=${CUSTOMER_ID}`);
      expect(links.createEnrollmentHref).toContain("/enrollments/new");
    }
  });

  it("viewer sees View enrollments only, even for an eligible customer", () => {
    const links = buildCustomerEnrollmentLinks("viewer", customerViewModel.customer);
    const html = renderToStaticMarkup(
      <CustomerDetail viewModel={customerViewModel} enrollmentLinks={links} />,
    );
    expect(links.createEnrollmentHref).toBeUndefined();
    expect(html).toContain("View enrollments");
    expect(html).not.toContain("New enrollment");
  });

  it("staff sees View enrollments only for an ineligible (paused) customer", () => {
    const pausedCustomer = {
      ...customerViewModel.customer,
      status: "paused" as const,
    };
    const links = buildCustomerEnrollmentLinks("staff", pausedCustomer);
    const html = renderToStaticMarkup(
      <CustomerDetail
        viewModel={{ ...customerViewModel, customer: pausedCustomer }}
        enrollmentLinks={links}
      />,
    );
    expect(links.createEnrollmentHref).toBeUndefined();
    expect(html).toContain("View enrollments");
    expect(html).not.toContain("New enrollment");
  });

  it("staff sees View enrollments only for an archived customer, regardless of status", () => {
    const archivedCustomer = {
      ...customerViewModel.customer,
      status: "active" as const,
      derived: { isArchived: true, allowedTransitions: [] },
    };
    const links = buildCustomerEnrollmentLinks("staff", archivedCustomer);
    expect(links.createEnrollmentHref).toBeUndefined();
  });

  it("View enrollments href always scopes the Enrollments list to this customer via navigation context only", () => {
    const links = buildCustomerEnrollmentLinks("viewer", customerViewModel.customer);
    expect(links.viewEnrollmentsHref).toBe(`/enrollments?org=${ORG_ID}&customerId=${CUSTOMER_ID}`);
  });
});

describe("Program detail contextual Enrollment wiring by role and eligibility (B1.5.9)", () => {
  it("owner/admin/staff see View + New for an eligible (active, non-archived) program", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      const links = buildProgramEnrollmentLinks(role, {
        status: "active",
        derived: { isArchived: false },
      });
      const html = renderToStaticMarkup(
        <ProgramDetail viewModel={programViewModel} enrollmentLinks={links} />,
      );
      expect(html).toContain("View enrollments");
      expect(html).toContain("New enrollment");
      expect(links.createEnrollmentHref).toContain(`programId=${sampleProgramDetail.id}`);
    }
  });

  it("viewer sees View enrollments only, even for an eligible program", () => {
    const links = buildProgramEnrollmentLinks("viewer", {
      status: "active",
      derived: { isArchived: false },
    });
    const html = renderToStaticMarkup(
      <ProgramDetail viewModel={programViewModel} enrollmentLinks={links} />,
    );
    expect(links.createEnrollmentHref).toBeUndefined();
    expect(html).toContain("View enrollments");
    expect(html).not.toContain("New enrollment");
  });

  it("staff sees View enrollments only for a draft (ineligible) program — matches the sample fixture's draft status", () => {
    // sampleProgramDetail.status === "draft", which is not eligible for enrollment create.
    const links = buildProgramEnrollmentLinks("staff", sampleProgramDetail);
    const html = renderToStaticMarkup(
      <ProgramDetail viewModel={programViewModel} enrollmentLinks={links} />,
    );
    expect(links.createEnrollmentHref).toBeUndefined();
    expect(html).toContain("View enrollments");
    expect(html).not.toContain("New enrollment");
  });

  it("staff sees View enrollments only for an archived program, regardless of status", () => {
    const links = buildProgramEnrollmentLinks("staff", {
      status: "active",
      derived: { isArchived: true },
    });
    expect(links.createEnrollmentHref).toBeUndefined();
  });

  it("Enrollment actions nav is separate from Program actions mutation nav", () => {
    const links = buildProgramEnrollmentLinks("owner", {
      status: "active",
      derived: { isArchived: false },
    });
    const html = renderToStaticMarkup(
      <ProgramDetail
        viewModel={programViewModel}
        workflowLinks={{ edit: `/programs/${sampleProgramDetail.id}/edit` }}
        enrollmentLinks={links}
      />,
    );
    expect(html).toContain('aria-label="Program actions"');
    expect(html).toContain('aria-label="Enrollment actions"');
    expect(html).toContain("Edit program");
    expect(html).toContain("View enrollments");
    expect(html).toContain("New enrollment");
  });
});

describe("Contextual navigation helpers never encode authorization (B1.5.9)", () => {
  it("buildEnrollmentCreateHrefFromContext and buildEnrollmentsListHrefFromContext only carry org/customerId/programId", () => {
    const createHref = buildEnrollmentCreateHrefFromContext({
      org: ORG_ID,
      customerId: CUSTOMER_ID,
      programId: sampleProgramDetail.id,
    });
    const listHref = buildEnrollmentsListHrefFromContext({
      org: ORG_ID,
      customerId: CUSTOMER_ID,
      programId: sampleProgramDetail.id,
    });

    expect(createHref).toBe(
      `/enrollments/new?org=${ORG_ID}&customerId=${CUSTOMER_ID}&programId=${sampleProgramDetail.id}`,
    );
    expect(listHref).toBe(
      `/enrollments?org=${ORG_ID}&customerId=${CUSTOMER_ID}&programId=${sampleProgramDetail.id}`,
    );
  });

  it("omits org/customerId/programId entirely when not provided", () => {
    expect(buildEnrollmentsListHrefFromContext({})).toBe("/enrollments");
    expect(buildEnrollmentCreateHrefFromContext({})).toBe("/enrollments/new");
  });
});
