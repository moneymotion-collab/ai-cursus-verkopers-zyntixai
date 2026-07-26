import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentStatusForm } from "@/features/enrollments/ui/enrollment-status-form";
import { transitionEnrollmentStatusAction } from "@/features/enrollments/actions/enrollment-actions";
import { ORG_ID, sampleEnrollmentDetail } from "../helpers/enrollment-test-fixtures";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "enrolled_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/enrollments/actions/enrollment-actions", () => ({
  transitionEnrollmentStatusAction: vi.fn(),
}));

const transitionActionMock = vi.mocked(transitionEnrollmentStatusAction);

describe("EnrollmentStatusForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders only the allowed targets for the current status", () => {
    const html = renderToStaticMarkup(
      <EnrollmentStatusForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        allowedTargets={["paused", "completed", "cancelled"]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("Change enrollment status");
    expect(html).toContain("Current lifecycle status");
    expect(html).toContain("Active");
    expect(html).toContain('value="paused"');
    expect(html).toContain('value="completed"');
    expect(html).toContain('value="cancelled"');
    expect(html).not.toContain('value="active"');
    expect(html).not.toContain('value="pending"');
  });

  it("shows a viewer-inapplicable form as having no allowed targets rendered", () => {
    const html = renderToStaticMarkup(
      <EnrollmentStatusForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        allowedTargets={[]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).not.toContain('type="radio"');
  });

  it("includes an optional reason field capped at 500 characters", () => {
    const html = renderToStaticMarkup(
      <EnrollmentStatusForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        allowedTargets={["paused"]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("Reason (optional)");
    expect(html).toContain('maxLength="500"');
    expect(html).not.toContain("enrollment-status-terminal-confirm");
  });

  it("requires explicit confirmation when the initial target is terminal", () => {
    const html = renderToStaticMarkup(
      <EnrollmentStatusForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        allowedTargets={["completed", "cancelled"]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("enrollment-status-terminal-confirm");
    expect(html).toContain("I understand this ends the enrollment lifecycle");
    expect(html).toContain("Soft-archive remains a separate action");
  });

  it("does not invoke transitionEnrollmentStatusAction during static render", () => {
    renderToStaticMarkup(
      <EnrollmentStatusForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        allowedTargets={["paused", "completed", "cancelled"]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );
    expect(transitionActionMock).not.toHaveBeenCalled();
  });
});
