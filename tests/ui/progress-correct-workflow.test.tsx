import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { correctProgressFactAction } from "@/features/progress/actions/progress-actions";
import { ProgressCorrectForm } from "@/features/progress/ui/progress-correct-form";
import { ORG_ID, PROGRESS_FACT_ID, sampleProgressDetailViewModel } from "../helpers/progress-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/progress/actions/progress-actions", () => ({
  correctProgressFactAction: vi.fn(),
}));

const correctActionMock = vi.mocked(correctProgressFactAction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProgressCorrectForm", () => {
  it("renders the predecessor summary and correction fields", () => {
    const html = renderToStaticMarkup(
      <ProgressCorrectForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );

    expect(html).toContain("Correct progress record");
    expect(html).toContain("Original record");
    expect(html).toContain("Module 1 complete");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Fact type (required)");
    expect(html).toContain("Occurred at (required)");
    expect(html).toContain("enrollment, program, and recorder cannot be changed");
    expect(html).toContain("marks the original as void");
    expect(html).toContain("not deleted");
    expect(html).toContain("not a silent overwrite");
    expect(html).not.toContain("kept unchanged");
    expect(html).not.toContain("hard delete");
    expect(html).not.toContain("permanently delete");
  });

  it("prefills the form with the original fact's values", () => {
    const html = renderToStaticMarkup(
      <ProgressCorrectForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain('value="Module 1 complete"');
    expect(html).toContain(">Completed first module<");
  });

  it("does not allow editing enrollment, program, or recorder fields", () => {
    const html = renderToStaticMarkup(
      <ProgressCorrectForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(html).not.toContain('name="enrollmentId"');
    expect(html).not.toContain('name="recordedByMemberId"');
    expect(html).not.toMatch(/<select[^>]*name="programId"/);
    expect(html).toMatch(/<select[^>]*name="factType"/);
  });

  it("renders a generated, read-only idempotency key field", () => {
    const html = renderToStaticMarkup(
      <ProgressCorrectForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(html).toMatch(/<input id="correct-progress-idempotency-key" readOnly[^>]*disabled[^>]*name="idempotencyKey"/);
  });

  it("does not invoke correctProgressFactAction during static render", () => {
    renderToStaticMarkup(
      <ProgressCorrectForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(correctActionMock).not.toHaveBeenCalled();
  });
});
