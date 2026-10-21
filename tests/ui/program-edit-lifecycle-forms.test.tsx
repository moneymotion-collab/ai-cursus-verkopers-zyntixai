import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgramEditForm } from "@/features/programs/ui/program-edit-form";
import { ProgramStatusForm } from "@/features/programs/ui/program-status-form";
import { ProgramArchiveForm } from "@/features/programs/ui/program-archive-form";
import { ProgramRestoreForm } from "@/features/programs/ui/program-restore-form";
import {
  ORG_ID,
  sampleArchivedProgramDetail,
  sampleProgramDetail,
} from "../helpers/program-test-fixtures";

const listState = {
  org: ORG_ID,
  q: "",
  archived: false,
  sort: "updated_at" as const,
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

vi.mock("@/features/programs/actions/program-actions", () => ({
  updateProgramAction: vi.fn(),
  transitionProgramStatusAction: vi.fn(),
  archiveProgramAction: vi.fn(),
  restoreProgramAction: vi.fn(),
}));

describe("Program edit and lifecycle forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads current edit values from the program", () => {
    const html = renderToStaticMarkup(
      <ProgramEditForm
        organizationId={ORG_ID}
        program={sampleProgramDetail}
        listState={listState}
        cancelHref={`/programs/${sampleProgramDetail.id}`}
      />,
    );

    expect(html).toContain("Edit program");
    expect(html).toContain(`value="${sampleProgramDetail.name}"`);
    expect(html).toContain(sampleProgramDetail.description ?? "");
    expect(html).toContain('value="cohort"');
    expect(html).toContain("Save changes");
    expect(html).not.toContain("expected_end_date");
    expect(html).not.toContain('name="status"');
  });

  it("shows only permitted lifecycle targets for the current status", () => {
    const html = renderToStaticMarkup(
      <ProgramStatusForm
        organizationId={ORG_ID}
        program={sampleProgramDetail}
        allowedTargets={["active", "retired"]}
        listState={listState}
        cancelHref={`/programs/${sampleProgramDetail.id}`}
      />,
    );

    expect(html).toContain("Change program status");
    expect(html).toContain("Current lifecycle status");
    expect(html).toContain("Draft");
    expect(html).toContain('value="active"');
    expect(html).toContain('value="retired"');
    expect(html).not.toContain('value="paused"');
    expect(html).not.toContain('value="draft"');
  });

  it("renders archive confirmation without delete wording", () => {
    const html = renderToStaticMarkup(
      <ProgramArchiveForm
        organizationId={ORG_ID}
        program={sampleProgramDetail}
        listState={listState}
        backHref={`/programs/${sampleProgramDetail.id}`}
      />,
    );

    expect(html).toContain("Archive program");
    expect(html).toContain("Archive is not deletion.");
    expect(html).toContain("lifecycle status remains Draft");
    expect(html).not.toContain("permanently delete");
    expect(html).not.toContain("cannot be undone");
  });

  it("warns when open enrollments would block archive", () => {
    const html = renderToStaticMarkup(
      <ProgramArchiveForm
        organizationId={ORG_ID}
        program={{ ...sampleProgramDetail, openEnrollmentCount: 2 }}
        listState={listState}
        backHref={`/programs/${sampleProgramDetail.id}`}
      />,
    );

    expect(html).toContain("2 open enrollments");
    expect(html).toContain("Resolve open enrollments before archiving");
  });

  it("renders restore confirmation with status preserved messaging", () => {
    const html = renderToStaticMarkup(
      <ProgramRestoreForm
        organizationId={ORG_ID}
        program={sampleArchivedProgramDetail}
        listState={listState}
        backHref={`/programs/${sampleProgramDetail.id}`}
      />,
    );

    expect(html).toContain("Restore program");
    expect(html).toContain("lifecycle status remains Draft");
    expect(html).toContain("No lifecycle status change occurs during restore");
  });
});
