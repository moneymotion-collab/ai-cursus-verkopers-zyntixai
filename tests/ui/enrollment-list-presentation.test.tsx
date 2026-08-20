import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentListPresentation } from "@/features/enrollments/ui/enrollment-list";
import { EnrollmentListFilters } from "@/features/enrollments/ui/enrollment-list-filters";
import {
  MEMBER_ID,
  ORG_ID,
  sampleEnrollmentListItem,
} from "../helpers/enrollment-test-fixtures";
import { sampleEnrollmentListOperationalHints } from "../helpers/enrollment-operational-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "enrolled_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

const ownerLabels = { [MEMBER_ID]: "Jordan Lee" };
const emptyHints = { byEnrollmentId: {} };
const populatedHints = sampleEnrollmentListOperationalHints(sampleEnrollmentListItem.id);

describe("EnrollmentListPresentation", () => {
  it("renders customer, program, status, owner, and enrolled date with detail links", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListPresentation
        enrollments={[sampleEnrollmentListItem]}
        timeZone="UTC"
        listState={listState}
        ownerLabels={ownerLabels}
        operationalHints={populatedHints}
        emptyTitle="No enrollments yet"
        emptyDescription="Create an enrollment."
      />,
    );

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Active");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("Progress current");
    expect(html).toContain(`/enrollments/${sampleEnrollmentListItem.id}`);
    expect(html).not.toContain("organizationId");
    expect(html).not.toContain("created_by_member_id");
  });

  it("shows Unassigned when no owner is set", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListPresentation
        enrollments={[{ ...sampleEnrollmentListItem, ownerMemberId: null }]}
        timeZone="UTC"
        listState={listState}
        ownerLabels={{}}
        operationalHints={populatedHints}
        emptyTitle="No enrollments yet"
        emptyDescription="Create an enrollment."
      />,
    );

    expect(html).toContain("Unassigned");
  });

  it("renders archived badge for archived enrollments", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListPresentation
        enrollments={[
          {
            ...sampleEnrollmentListItem,
            archivedAt: "2026-07-20T09:00:00.000Z",
            derived: { isArchived: true, isOpen: false, isTerminal: true },
          },
        ]}
        timeZone="UTC"
        listState={listState}
        ownerLabels={ownerLabels}
        operationalHints={populatedHints}
        emptyTitle="No enrollments yet"
        emptyDescription="Create an enrollment."
      />,
    );

    expect(html).toContain("Archived");
  });

  it("renders empty state with create CTA", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListPresentation
        enrollments={[]}
        timeZone="UTC"
        listState={listState}
        ownerLabels={{}}
        operationalHints={emptyHints}
        emptyTitle="No enrollments yet"
        emptyDescription="An enrollment links a customer to a program."
        createHref="/enrollments/new"
      />,
    );

    expect(html).toContain("No enrollments yet");
    expect(html).toContain("Create enrollment");
    expect(html).toContain('href="/enrollments/new"');
  });

  it("renders no-results state with clear filters", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListPresentation
        enrollments={[]}
        timeZone="UTC"
        listState={{ ...listState, q: "zzz" }}
        ownerLabels={{}}
        operationalHints={emptyHints}
        emptyTitle="No enrollments match the selected filters."
        emptyDescription="Try adjusting filters."
        clearFiltersHref="/enrollments"
      />,
    );

    expect(html).toContain("No enrollments match the selected filters.");
    expect(html).toContain("Clear filters");
    expect(html).not.toContain("Create enrollment");
  });
});

describe("EnrollmentListFilters", () => {
  it("renders search, status, sort controls and archived for owner", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListFilters urlState={listState} role="owner" />,
    );

    expect(html).toContain('id="filter-enrollment-search"');
    expect(html).toContain('id="filter-enrollment-status"');
    expect(html).toContain('id="filter-enrollment-sort"');
    expect(html).toContain("Show archived enrollments");
    expect(html).toContain("Search by customer or program name");
    expect(html).toContain("Pending");
  });

  it("hides archived control for staff", () => {
    const html = renderToStaticMarkup(
      <EnrollmentListFilters urlState={listState} role="staff" />,
    );
    expect(html).not.toContain("Show archived enrollments");
  });
});
