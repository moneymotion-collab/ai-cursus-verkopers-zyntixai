import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ProgramDetail,
  ProgramUnavailableDetail,
} from "@/features/programs/ui/program-detail";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import { sampleProgramDetail } from "../helpers/program-test-fixtures";

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

describe("ProgramDetail", () => {
  it("renders summary fields, history, enrollment count and no mutation controls", () => {
    const html = renderToStaticMarkup(<ProgramDetail viewModel={baseViewModel} />);

    expect(html).toContain("Growth Lab");
    expect(html).toContain("Draft");
    expect(html).toContain("Cohort");
    expect(html).toContain("Not archived");
    expect(html).toContain("Open enrollments");
    expect(html).toContain(">0<");
    expect(html).toContain("Status history");
    expect(html).toContain("Set to Draft");
    expect(html).toContain("Back to programs");
    expect(html).toContain("Enrollment management and progress tracking will follow");
    expect(html).not.toContain("Edit program");
    expect(html).not.toContain("Archive program");
    expect(html).not.toContain("Restore program");
    expect(html).not.toContain("Change program status");
    expect(html).not.toContain('href="/enrollments');
    expect(html).not.toContain("Progress dashboard");
  });

  it("renders empty history state", () => {
    const html = renderToStaticMarkup(
      <ProgramDetail
        viewModel={{
          ...baseViewModel,
          history: [],
          historyState: { kind: "empty" },
        }}
      />,
    );
    expect(html).toContain("No status history is available yet.");
  });

  it("renders unavailable detail without enumeration hints", () => {
    const html = renderToStaticMarkup(
      <ProgramUnavailableDetail backHref="/programs" />,
    );
    expect(html).toContain("Program unavailable");
    expect(html).toContain("Back to programs");
    expect(html).not.toContain("does not exist in another organization");
  });
});
