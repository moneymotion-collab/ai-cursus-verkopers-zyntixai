import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { recordProgressFactAction } from "@/features/progress/actions/progress-actions";
import { ProgressRecordForm } from "@/features/progress/ui/progress-record-form";
import { ENROLLMENT_ID, ORG_ID } from "../helpers/progress-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/progress/actions/progress-actions", () => ({
  recordProgressFactAction: vi.fn(),
}));

const recordActionMock = vi.mocked(recordProgressFactAction);

const enrollmentOptions = [
  { value: ENROLLMENT_ID, label: "Acme Corp · Growth Lab (Active)" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProgressRecordForm", () => {
  it("renders the required record fields and no restore/delete affordances", () => {
    const html = renderToStaticMarkup(
      <ProgressRecordForm
        organizationId={ORG_ID}
        enrollmentOptions={enrollmentOptions}
        backHref={`/progress?org=${ORG_ID}`}
      />,
    );

    expect(html).toContain("Record progress");
    expect(html).toContain("Enrollment (required)");
    expect(html).toContain("Fact type (required)");
    expect(html).toContain("Occurred at (required)");
    expect(html).toContain("Title (optional)");
    expect(html).toContain("Description (optional)");
    expect(html).toContain("Numeric value (optional)");
    expect(html).toContain("Numeric unit (optional)");
    expect(html).toContain("Mark as complete");
    expect(html).toContain("Sequence number (optional)");
    expect(html).toContain("Idempotency key (optional)");
    expect(html).toContain("Acme Corp · Growth Lab (Active)");
    expect(html).toContain("Back to progress");
    expect(html).toContain("Cancel");
    expect(html).not.toContain("Restore");
    expect(html).not.toContain("Delete");
    expect(html).not.toContain('name="organizationId"');
    expect(html).not.toContain('name="correctedFromFactId"');
  });

  it("prefills the enrollment select from initialEnrollmentId", () => {
    const html = renderToStaticMarkup(
      <ProgressRecordForm
        organizationId={ORG_ID}
        enrollmentOptions={enrollmentOptions}
        initialEnrollmentId={ENROLLMENT_ID}
        backHref={`/progress?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain(`value="${ENROLLMENT_ID}"`);
  });

  it("renders an empty-state message and disables submit when no enrollments are eligible", () => {
    const html = renderToStaticMarkup(
      <ProgressRecordForm
        organizationId={ORG_ID}
        enrollmentOptions={[]}
        backHref={`/progress?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain("No eligible enrollments are available");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>/);
  });

  it("surfaces the enrollment options error without failing to render", () => {
    const html = renderToStaticMarkup(
      <ProgressRecordForm
        organizationId={ORG_ID}
        enrollmentOptions={[]}
        enrollmentOptionsError="Unable to load eligible enrollments. Please try again."
        backHref={`/progress?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain("Unable to load eligible enrollments. Please try again.");
  });

  it("does not invoke recordProgressFactAction during static render", () => {
    renderToStaticMarkup(
      <ProgressRecordForm
        organizationId={ORG_ID}
        enrollmentOptions={enrollmentOptions}
        backHref={`/progress?org=${ORG_ID}`}
      />,
    );
    expect(recordActionMock).not.toHaveBeenCalled();
  });
});
