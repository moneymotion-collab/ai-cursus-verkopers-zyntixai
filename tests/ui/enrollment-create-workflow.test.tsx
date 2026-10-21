import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createEnrollmentAction } from "@/features/enrollments/actions/enrollment-actions";
import { EnrollmentCreateForm } from "@/features/enrollments/ui/enrollment-create-form";
import { ORG_ID, MEMBER_ID } from "../helpers/enrollment-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/enrollments/actions/enrollment-actions", () => ({
  createEnrollmentAction: vi.fn(),
}));

const createActionMock = vi.mocked(createEnrollmentAction);

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "enrolled_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

const customers = [{ value: "c1", label: "Acme Corp", status: "active" }];
const programs = [{ value: "p1", label: "Growth Lab" }];
const members = [{ value: MEMBER_ID, label: "Jordan Lee" }];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EnrollmentCreateForm", () => {
  it("renders exact fields: customer, program, initial status, owner — no source, metadata, org or role", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
      />,
    );

    expect(html).toContain("Create enrollment");
    expect(html).toContain("Customer (required)");
    expect(html).toContain("Program (required)");
    expect(html).toContain("Initial status (required)");
    expect(html).toContain("Owner (optional)");
    expect(html).toContain('id="create-enrollment-customer"');
    expect(html).toContain('name="customerId"');
    expect(html).toContain('id="create-enrollment-program"');
    expect(html).toContain('name="programId"');
    expect(html).toContain('name="initialStatus"');
    expect(html).toContain('name="ownerMemberId"');
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("Unassigned");
    expect(html).toContain("Back to enrollments");
    expect(html).toContain("Cancel");
    expect(html).toContain("manage lifecycle status and ownership");
    expect(html).toContain("Metadata editing is not available yet");
    expect(html).not.toContain("follow in a later phase");
    expect(html).not.toContain("Lifecycle, owner, and metadata");

    expect(html).not.toContain("Source");
    expect(html).not.toContain('name="metadata"');
    expect(html).not.toContain('name="source"');
    expect(html).not.toContain('name="organizationId"');
    expect(html).not.toContain('name="role"');
  });

  it("shows a clear message and disables submit when there are no eligible customers", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={[]}
        programs={programs}
        members={members}
      />,
    );

    expect(html).toContain("No eligible customers are available");
    expect(html).not.toContain('id="create-enrollment-customer"');
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("shows a clear message and disables submit when there are no eligible programs", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={[]}
        members={members}
      />,
    );

    expect(html).toContain("No eligible programs are available");
  });

  it("renders an options error banner when provided", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
        optionsError="Some enrollment create options could not be loaded. Please try again."
      />,
    );

    expect(html).toContain("Some enrollment create options could not be loaded");
  });

  it("does not invoke createEnrollmentAction during static render", () => {
    renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
      />,
    );
    expect(createActionMock).not.toHaveBeenCalled();
  });
});

describe("EnrollmentCreateForm contextual preselection (B1.5.9)", () => {
  it("preselects the customer option when initialCustomerId matches an eligible option", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
        initialCustomerId="c1"
      />,
    );

    expect(html).toContain('value="c1" selected');
  });

  it("preselects the program option when initialProgramId matches an eligible option", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
        initialProgramId="p1"
      />,
    );

    expect(html).toContain('value="p1" selected');
  });

  it("renders a contextNotice as a status alert when the raw id is unavailable in options", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
        contextNotice="The selected customer or program is unavailable for enrollment."
      />,
    );

    expect(html).toContain("The selected customer or program is unavailable for enrollment.");
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*unavailable for enrollment/);
  });

  it("renders a duplicateOpenNotice as a status alert when both are preselected and an open enrollment exists", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
        initialCustomerId="c1"
        initialProgramId="p1"
        duplicateOpenNotice="An open enrollment already exists for this customer and program."
      />,
    );

    expect(html).toContain("An open enrollment already exists for this customer and program.");
    expect(html).toMatch(/role="status"[^>]*>[\s\S]*open enrollment already exists/);
  });

  it("does not preselect and shows no notices when no context props are provided", () => {
    const html = renderToStaticMarkup(
      <EnrollmentCreateForm
        organizationId={ORG_ID}
        listState={listState}
        cancelHref="/enrollments"
        customers={customers}
        programs={programs}
        members={members}
      />,
    );

    expect(html).not.toContain("unavailable for enrollment");
    expect(html).not.toContain("open enrollment already exists");
  });
});
