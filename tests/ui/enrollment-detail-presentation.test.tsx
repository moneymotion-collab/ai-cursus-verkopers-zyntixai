import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EnrollmentDetail,
  EnrollmentUnavailableDetail,
} from "@/features/enrollments/ui/enrollment-detail";
import type { EnrollmentDetailViewModel } from "@/features/enrollments/ui/load-enrollment-detail-page";
import {
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
  ENROLLMENT_ID,
  ORG_ID,
} from "../helpers/enrollment-test-fixtures";
import { sampleEnrollmentOperationalSnapshot } from "../helpers/enrollment-operational-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const baseViewModel: EnrollmentDetailViewModel = {
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
  history: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      transitionLabel: "Pending → Active",
      fromStatusLabel: "Pending",
      toStatusLabel: "Active",
      sourceLabel: "Manual",
      reason: null,
      actorLabel: "Jordan Lee",
      timestampLabel: "Jul 1, 2026, 10:00 AM",
    },
  ],
  historyState: { kind: "ready" },
  ownerLabel: "Jordan Lee",
  sourceLabel: "Manual",
  organizationTimezone: "UTC",
  backHref: "/enrollments",
  customerLabel: "Acme Corp",
  programLabel: "Growth Lab",
  customerHref: "/customers/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb?org=11111111-1111-4111-8111-111111111111",
  programHref: "/programs/22222222-2222-4222-8222-222222222222?org=11111111-1111-4111-8111-111111111111",
  operational: sampleEnrollmentOperationalSnapshot(),
};

describe("EnrollmentDetail read-only presentation (no workflow links)", () => {
  it("renders enrollment details, linked customer/program, owner, source and history without mutation controls", () => {
    const html = renderToStaticMarkup(<EnrollmentDetail viewModel={baseViewModel} />);

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("Manual");
    expect(html).toContain("Status history");
    expect(html).toContain('href="/customers/');
    expect(html).toContain('href="/programs/');

    expect(html).not.toContain("Change status");
    expect(html).not.toContain("Archive enrollment");
    expect(html).not.toContain("Restore enrollment");
    expect(html).not.toContain("Edit owner");
  });

  it("renders archived badge for archived enrollments without workflow links", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={{ ...baseViewModel, enrollment: sampleArchivedEnrollmentDetail }}
      />,
    );

    expect(html).toContain("Archived");
    expect(html).not.toContain("Restore enrollment");
    expect(html).not.toContain("Archive enrollment");
  });

  it("mentions Progress workspace management without deferred copy, and omits progress links when not provided", () => {
    const html = renderToStaticMarkup(<EnrollmentDetail viewModel={baseViewModel} />);
    expect(html.toLowerCase()).not.toContain("deferred");
    expect(html).not.toContain("Progress tracking within this enrollment is deferred to a later phase.");
    expect(html).toContain("Progress");
    expect(html).toContain("Last meaningful progress");
    expect(html).not.toContain('aria-label="Progress actions"');
    expect(html).not.toContain("View progress");
    expect(html).not.toContain("Record progress");
  });

  it("renders View progress and optional Record progress when progressLinks are provided", () => {
    const withViewOnly = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={baseViewModel}
        progressLinks={{
          viewProgressHref: "/progress?org=org-1&enrollmentId=e1",
        }}
      />,
    );
    expect(withViewOnly).toContain('aria-label="Progress actions"');
    expect(withViewOnly).toContain("View progress");
    expect(withViewOnly).toContain('href="/progress?org=org-1&amp;enrollmentId=e1"');
    expect(withViewOnly).not.toContain("Record progress");

    const withRecord = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={baseViewModel}
        progressLinks={{
          viewProgressHref: "/progress?org=org-1&enrollmentId=e1",
          recordProgressHref: "/progress/new?org=org-1&enrollmentId=e1",
        }}
      />,
    );
    expect(withRecord).toContain("Record progress");
    expect(withRecord).toContain('href="/progress/new?org=org-1&amp;enrollmentId=e1"');
  });

  it("renders Attention summary and View all attention when attentionLinks are provided", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={baseViewModel}
        attentionLinks={{
          viewAttentionHref: `/attention?org=${ORG_ID}&enrollmentId=${ENROLLMENT_ID}`,
        }}
      />,
    );
    expect(html).toContain('aria-label="Attention actions"');
    expect(html).toContain("View all attention");
    expect(html).toContain("No open Attention for this enrollment.");
    expect(html).toContain(
      `href="/attention?org=${ORG_ID}&amp;enrollmentId=${ENROLLMENT_ID}"`,
    );
    expect(html).not.toContain("attention items found");
  });

  it("renders unavailable detail without enumeration hints", () => {
    const html = renderToStaticMarkup(
      <EnrollmentUnavailableDetail backHref="/enrollments" />,
    );
    expect(html).toContain("Enrollment unavailable");
    expect(html).not.toContain("does not exist in another organization");
  });
});

describe("EnrollmentDetail workflow links by role", () => {
  it("shows edit/status/archive links for owner/admin on a non-archived, terminal-eligible-for-status enrollment", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={baseViewModel}
        workflowLinks={{
          edit: "/enrollments/e1/edit",
          status: "/enrollments/e1/status",
        }}
      />,
    );

    expect(html).toContain('href="/enrollments/e1/edit"');
    expect(html).toContain("Edit owner");
    expect(html).toContain('href="/enrollments/e1/status"');
    expect(html).toContain("Change status");
    expect(html).not.toContain("Archive enrollment");
    expect(html).not.toContain("Restore enrollment");
  });

  it("shows the archive link only when provided (owner/admin, terminal, non-archived)", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={baseViewModel}
        workflowLinks={{ archive: "/enrollments/e1/archive" }}
      />,
    );

    expect(html).toContain('href="/enrollments/e1/archive"');
    expect(html).toContain("Archive enrollment");
    expect(html).not.toContain("Edit owner");
    expect(html).not.toContain("Change status");
    expect(html).not.toContain("Restore enrollment");
  });

  it("shows restore only for owner/admin on archived enrollments, never edit/status/archive", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={{ ...baseViewModel, enrollment: sampleArchivedEnrollmentDetail }}
        workflowLinks={{ restore: "/enrollments/e1/restore" }}
      />,
    );

    expect(html).toContain('href="/enrollments/e1/restore"');
    expect(html).toContain("Restore enrollment");
    expect(html).not.toContain("Edit owner");
    expect(html).not.toContain("Change status");
    expect(html).not.toContain("Archive enrollment");
  });

  it("renders no workflow nav at all when workflowLinks is omitted (viewer read-only)", () => {
    const html = renderToStaticMarkup(<EnrollmentDetail viewModel={baseViewModel} />);
    expect(html).not.toContain('aria-label="Enrollment actions"');
  });

  it("renders no workflow links when workflowLinks is an empty object (all denied)", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail viewModel={baseViewModel} workflowLinks={{}} />,
    );
    expect(html).toContain('aria-label="Enrollment actions"');
    expect(html).not.toContain("Edit owner");
    expect(html).not.toContain("Change status");
    expect(html).not.toContain("Archive enrollment");
    expect(html).not.toContain("Restore enrollment");
  });
});
