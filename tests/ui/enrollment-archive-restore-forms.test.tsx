import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentArchiveForm } from "@/features/enrollments/ui/enrollment-archive-form";
import { EnrollmentRestoreForm } from "@/features/enrollments/ui/enrollment-restore-form";
import {
  archiveEnrollmentAction,
  restoreEnrollmentAction,
} from "@/features/enrollments/actions/enrollment-actions";
import {
  ORG_ID,
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
} from "../helpers/enrollment-test-fixtures";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "enrolled_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

const terminalEnrollment = {
  ...sampleEnrollmentDetail,
  status: "completed" as const,
  statusLabel: "Completed",
  derived: {
    isArchived: false,
    isOpen: false,
    isTerminal: true,
    allowedTransitions: [],
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/enrollments/actions/enrollment-actions", () => ({
  archiveEnrollmentAction: vi.fn(),
  restoreEnrollmentAction: vi.fn(),
}));

const archiveActionMock = vi.mocked(archiveEnrollmentAction);
const restoreActionMock = vi.mocked(restoreEnrollmentAction);

describe("EnrollmentArchiveForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders soft-archive confirmation copy without delete wording", () => {
    const html = renderToStaticMarkup(
      <EnrollmentArchiveForm
        organizationId={ORG_ID}
        enrollment={terminalEnrollment}
        listState={listState}
        backHref={`/enrollments/${terminalEnrollment.id}`}
      />,
    );

    expect(html).toContain("Archive enrollment");
    expect(html).toContain("Archive is not deletion.");
    expect(html).toContain("lifecycle status remains Completed");
    expect(html).not.toContain("permanently delete");
    expect(html).not.toContain("cannot be undone");
  });

  it("does not invoke archiveEnrollmentAction during static render (no mutation on cancel/render)", () => {
    renderToStaticMarkup(
      <EnrollmentArchiveForm
        organizationId={ORG_ID}
        enrollment={terminalEnrollment}
        listState={listState}
        backHref={`/enrollments/${terminalEnrollment.id}`}
      />,
    );
    expect(archiveActionMock).not.toHaveBeenCalled();
  });

  it("renders a Cancel/back link that does not submit the form", () => {
    const html = renderToStaticMarkup(
      <EnrollmentArchiveForm
        organizationId={ORG_ID}
        enrollment={terminalEnrollment}
        listState={listState}
        backHref={`/enrollments/${terminalEnrollment.id}`}
      />,
    );
    expect(html).toMatch(/<a[^>]*href="\/enrollments\/[^"]+"[^>]*>Back to enrollment<\/a>/);
  });
});

describe("EnrollmentRestoreForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders restore confirmation with status-preserved messaging", () => {
    const html = renderToStaticMarkup(
      <EnrollmentRestoreForm
        organizationId={ORG_ID}
        enrollment={sampleArchivedEnrollmentDetail}
        listState={listState}
        backHref={`/enrollments/${sampleArchivedEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("Restore enrollment");
    expect(html).toContain(`lifecycle status remains ${sampleArchivedEnrollmentDetail.statusLabel}`);
    expect(html).toContain("No lifecycle status change occurs during restore");
  });

  it("does not invoke restoreEnrollmentAction during static render (no mutation on cancel/render)", () => {
    renderToStaticMarkup(
      <EnrollmentRestoreForm
        organizationId={ORG_ID}
        enrollment={sampleArchivedEnrollmentDetail}
        listState={listState}
        backHref={`/enrollments/${sampleArchivedEnrollmentDetail.id}`}
      />,
    );
    expect(restoreActionMock).not.toHaveBeenCalled();
  });
});
