import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createProgramAction } from "@/features/programs/actions/program-actions";
import { ProgramCreateForm } from "@/features/programs/ui/program-create-form";
import { ORG_ID } from "../helpers/program-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/programs/actions/program-actions", () => ({
  createProgramAction: vi.fn(),
}));

const createActionMock = vi.mocked(createProgramAction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProgramCreateForm", () => {
  it("renders exact fields without organization, role, status or expected_end_date", () => {
    const html = renderToStaticMarkup(
      <ProgramCreateForm
        organizationId={ORG_ID}
        listState={{
          org: ORG_ID,
          archived: false,
          sort: "updated_at",
          direction: "desc",
          page: 1,
          pageSize: 25,
        }}
        cancelHref="/programs"
      />,
    );

    expect(html).toContain("Create program");
    expect(html).toContain("Program name (required)");
    expect(html).toContain("Delivery mode (required)");
    expect(html).toContain("Description (optional)");
    expect(html).toContain('id="create-program-name"');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="deliveryMode"');
    expect(html).toContain("Self-paced");
    expect(html).toContain("Cohort");
    expect(html).toContain("Back to programs");
    expect(html).toContain("Cancel");
    expect(html).toContain("start as draft");
    expect(html).not.toContain("expected_end_date");
    expect(html).not.toContain('name="organizationId"');
    expect(html).not.toContain('name="role"');
    expect(html).not.toContain('name="status"');
    expect(html).not.toContain("Lifecycle status");
  });

  it("does not invoke createProgramAction during static render", () => {
    renderToStaticMarkup(
      <ProgramCreateForm
        organizationId={ORG_ID}
        listState={{
          archived: false,
          sort: "updated_at",
          direction: "desc",
          page: 1,
          pageSize: 25,
        }}
        cancelHref="/programs"
      />,
    );
    expect(createActionMock).not.toHaveBeenCalled();
  });
});
