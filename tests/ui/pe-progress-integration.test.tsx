import React from "react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentDetail } from "@/features/enrollments/ui/enrollment-detail";
import { ProgramDetail } from "@/features/programs/ui/program-detail";
import type { EnrollmentDetailViewModel } from "@/features/enrollments/ui/load-enrollment-detail-page";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import { sampleEnrollmentDetail } from "../helpers/enrollment-test-fixtures";
import { sampleProgramDetail } from "../helpers/program-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const root = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function flattenSource(source: string): string {
  return source.replace(/\s+/g, " ");
}

const enrollmentViewModel: EnrollmentDetailViewModel = {
  enrollment: sampleEnrollmentDetail,
  permissions: {
    canListEnrollments: true,
    canViewEnrollment: true,
    canViewArchivedEnrollments: true,
    canCreateEnrollment: true,
    canUpdateOwnerOrMetadata: true,
    canTransitionEnrollmentStatus: true,
    canArchiveEnrollment: true,
    canRestoreEnrollment: false,
    canViewEnrollmentHistory: true,
  },
  history: [],
  historyState: { kind: "ready" },
  ownerLabel: "Jordan Lee",
  sourceLabel: "Manual",
  organizationTimezone: "UTC",
  backHref: "/enrollments",
  customerLabel: "Acme Corp",
  programLabel: "Growth Lab",
customerHref: undefined,
    programHref: undefined,
};

const programViewModel: ProgramDetailViewModel = {
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
  history: [],
  historyState: { kind: "ready" },
  descriptionLabel: "Cohort coaching program",
  organizationTimezone: "UTC",
  backHref: "/programs",
};

describe("B1.6.4 PE Progress integration", () => {
  it("enrollment detail page wires View/Record progress href builders and visibility gate", () => {
    const page = flattenSource(
      readSource("src/app/(authenticated)/enrollments/[enrollmentId]/page.tsx"),
    );
    expect(page).toContain("buildProgressListHref");
    expect(page).toContain("buildProgressCreateHref");
    expect(page).toContain("canShowEnrollmentRecordProgressEntry");
    expect(page).toContain("progressLinks");
    expect(page).toContain("enrollmentId:");
    expect(page).not.toContain("deferred to a later phase");
  });

  it("program detail page always wires View progress with programId filter", () => {
    const page = flattenSource(
      readSource("src/app/(authenticated)/programs/[programId]/page.tsx"),
    );
    expect(page).toContain("buildProgressListHref");
    expect(page).toContain("programId");
    expect(page).toContain("progressLinks");
    expect(page).not.toContain("deferred to a later phase");
  });

  it("programs empty state no longer claims progress tools follow later", () => {
    const page = flattenSource(readSource("src/app/(authenticated)/programs/page.tsx"));
    expect(page).not.toContain("Enrollment and progress tools follow in later phases");
    expect(page).toContain("Manage enrollments and progress from their workspaces");
  });

  it("presentation surfaces View/Record progress without deferred copy", () => {
    const enrollmentHtml = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={enrollmentViewModel}
        progressLinks={{
          viewProgressHref: "/progress?org=org-1&enrollmentId=e1",
          recordProgressHref: "/progress/new?org=org-1&enrollmentId=e1",
        }}
      />,
    );
    expect(enrollmentHtml).toContain("View progress");
    expect(enrollmentHtml).toContain("Record progress");
    expect(enrollmentHtml.toLowerCase()).not.toContain("deferred");

    const programHtml = renderToStaticMarkup(
      <ProgramDetail
        viewModel={programViewModel}
        progressLinks={{
          viewProgressHref: `/progress?org=org-1&programId=${sampleProgramDetail.id}`,
        }}
      />,
    );
    expect(programHtml).toContain("View progress");
    expect(programHtml).toContain('aria-label="Progress actions"');
    expect(programHtml.toLowerCase()).not.toContain("deferred");
  });
});
