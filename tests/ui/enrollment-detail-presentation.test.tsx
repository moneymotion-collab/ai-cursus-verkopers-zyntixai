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
} from "../helpers/enrollment-test-fixtures";

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
};

describe("EnrollmentDetail read-only presentation", () => {
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
    expect(html).not.toContain("Edit enrollment");
    expect(html).not.toContain("Edit owner");
  });

  it("renders archived badge for archived enrollments without exposing restore controls", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={{ ...baseViewModel, enrollment: sampleArchivedEnrollmentDetail }}
      />,
    );

    expect(html).toContain("Archived");
    expect(html).not.toContain("Restore enrollment");
    expect(html).not.toContain("Archive enrollment");
  });

  it("stays read-only for staff/viewer permission sets", () => {
    const html = renderToStaticMarkup(
      <EnrollmentDetail
        viewModel={{
          ...baseViewModel,
          permissions: {
            canListEnrollments: true,
            canViewEnrollment: true,
            canViewArchivedEnrollments: false,
            canCreateEnrollment: false,
            canUpdateOwnerOrMetadata: false,
            canTransitionEnrollmentStatus: false,
            canArchiveEnrollment: false,
            canRestoreEnrollment: false,
            canViewEnrollmentHistory: true,
          },
        }}
      />,
    );

    expect(html).not.toContain("Change status");
    expect(html).not.toContain("Archive enrollment");
    expect(html).not.toContain("Restore enrollment");
    expect(html).not.toContain("Edit enrollment");
  });

  it("mentions the deferred lifecycle/edit/archive boundary", () => {
    const html = renderToStaticMarkup(<EnrollmentDetail viewModel={baseViewModel} />);
    expect(html.toLowerCase()).toContain("deferred");
  });

  it("renders unavailable detail without enumeration hints", () => {
    const html = renderToStaticMarkup(
      <EnrollmentUnavailableDetail backHref="/enrollments" />,
    );
    expect(html).toContain("Enrollment unavailable");
    expect(html).not.toContain("does not exist in another organization");
  });
});
