import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ProgramDetail,
  ProgramUnavailableDetail,
} from "@/features/programs/ui/program-detail";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import {
  sampleArchivedProgramDetail,
  sampleProgramDetail,
} from "../helpers/program-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const baseViewModel: ProgramDetailViewModel = {
  program: sampleProgramDetail,
  permissions: {
    canListPrograms: true,
    canViewProgram: true,
    canViewArchivedPrograms: true,
    canCreateProgram: true,
    canUpdateProgram: true,
    canTransitionProgramStatus: true,
    canArchiveProgram: true,
    canRestoreProgram: false,
    canViewProgramHistory: true,
  },
  history: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      transitionLabel: "Set to Draft",
      fromStatusLabel: null,
      toStatusLabel: "Draft",
      sourceLabel: "Manual",
      reason: null,
      timestampLabel: "Jul 1, 2026, 10:00 AM",
    },
  ],
  historyState: { kind: "ready" },
  descriptionLabel: "Cohort coaching program",
  organizationTimezone: "UTC",
  backHref: "/programs",
};

describe("ProgramDetail mutation controls", () => {
  it("renders owner/admin workflow links when provided", () => {
    const html = renderToStaticMarkup(
      <ProgramDetail
        viewModel={baseViewModel}
        workflowLinks={{
          edit: `/programs/${sampleProgramDetail.id}/edit`,
          status: `/programs/${sampleProgramDetail.id}/status`,
          archive: `/programs/${sampleProgramDetail.id}/archive`,
        }}
      />,
    );

    expect(html).toContain("Edit program");
    expect(html).toContain("Change program status");
    expect(html).toContain("Archive program");
    expect(html).not.toContain("Restore program");
    expect(html).toContain("Open enrollments");
    expect(html).toContain("Status history");
    expect(html).not.toContain('href="/enrollments');
    expect(html).not.toContain("Progress dashboard");
  });

  it("renders restore only for archived programs and keeps status prominent", () => {
    const html = renderToStaticMarkup(
      <ProgramDetail
        viewModel={{
          ...baseViewModel,
          program: sampleArchivedProgramDetail,
        }}
        workflowLinks={{
          restore: `/programs/${sampleProgramDetail.id}/restore`,
        }}
      />,
    );

    expect(html).toContain("Archived");
    expect(html).toContain("Restore program");
    expect(html).not.toContain("Edit program");
    expect(html).not.toContain("Archive program");
    expect(html).toContain("Draft");
  });

  it("stays read-only for staff/viewer when workflow links are omitted", () => {
    const html = renderToStaticMarkup(<ProgramDetail viewModel={baseViewModel} />);

    expect(html).not.toContain("Edit program");
    expect(html).not.toContain("Change program status");
    expect(html).not.toContain("Archive program");
    expect(html).not.toContain("Restore program");
  });

  it("renders unavailable detail without enumeration hints", () => {
    const html = renderToStaticMarkup(
      <ProgramUnavailableDetail backHref="/programs" />,
    );
    expect(html).toContain("Program unavailable");
    expect(html).not.toContain("does not exist in another organization");
  });
});
