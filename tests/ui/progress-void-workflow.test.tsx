import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { voidProgressFactAction } from "@/features/progress/actions/progress-actions";
import { ProgressVoidForm } from "@/features/progress/ui/progress-void-form";
import { ORG_ID, PROGRESS_FACT_ID, sampleProgressDetailViewModel } from "../helpers/progress-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/progress/actions/progress-actions", () => ({
  voidProgressFactAction: vi.fn(),
}));

const voidActionMock = vi.mocked(voidProgressFactAction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProgressVoidForm", () => {
  it("renders void confirmation copy explaining void is not delete", () => {
    const html = renderToStaticMarkup(
      <ProgressVoidForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );

    expect(html).toContain("Void progress record");
    expect(html).toContain("It is not a hard delete");
    expect(html).toContain("Reason (required)");
    expect(html).toContain("Module 1 complete");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).not.toContain("permanently delete");
    expect(html).not.toContain("kept unchanged");
    expect(html).not.toContain("cannot be undone");
  });

  it("disables the confirm button until a reason is provided", () => {
    const html = renderToStaticMarkup(
      <ProgressVoidForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Void progress record<\/button>/);
  });

  it("renders a Cancel link back to the detail page", () => {
    const html = renderToStaticMarkup(
      <ProgressVoidForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain(`href="/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}"`);
    expect(html).toContain("Cancel");
  });

  it("does not invoke voidProgressFactAction during static render", () => {
    renderToStaticMarkup(
      <ProgressVoidForm
        organizationId={ORG_ID}
        data={sampleProgressDetailViewModel}
        backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
      />,
    );
    expect(voidActionMock).not.toHaveBeenCalled();
  });
});
