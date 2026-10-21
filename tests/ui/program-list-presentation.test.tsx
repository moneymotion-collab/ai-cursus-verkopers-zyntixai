import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgramListPresentation } from "@/features/programs/ui/program-list";
import { ProgramListFilters } from "@/features/programs/ui/program-list-filters";
import { sampleProgramListItem, ORG_ID } from "../helpers/program-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "updated_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

describe("ProgramListPresentation", () => {
  it("renders title row fields and detail links", () => {
    const html = renderToStaticMarkup(
      <ProgramListPresentation
        programs={[sampleProgramListItem]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No programs yet"
        emptyDescription="Create a program."
      />,
    );

    expect(html).toContain("Growth Lab");
    expect(html).toContain("Active");
    expect(html).toContain("Cohort");
    expect(html).toContain("Open enrollments");
    expect(html).toContain(`/programs/${sampleProgramListItem.id}`);
    expect(html).not.toContain("organizationId");
    expect(html).not.toContain("created_by_member_id");
  });

  it("renders empty state with create CTA", () => {
    const html = renderToStaticMarkup(
      <ProgramListPresentation
        programs={[]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No programs yet"
        emptyDescription="A program is a structured offering."
        createHref="/programs/new"
      />,
    );

    expect(html).toContain("No programs yet");
    expect(html).toContain("structured offering");
    expect(html).toContain("Create program");
    expect(html).toContain('href="/programs/new"');
    expect(html.toLowerCase()).not.toContain("progress dashboard");
  });

  it("renders no-results state with clear filters", () => {
    const html = renderToStaticMarkup(
      <ProgramListPresentation
        programs={[]}
        timeZone="UTC"
        listState={{ ...listState, q: "zzz" }}
        emptyTitle="No programs match the selected filters."
        emptyDescription="Try adjusting filters."
        clearFiltersHref="/programs"
      />,
    );

    expect(html).toContain("No programs match the selected filters.");
    expect(html).toContain("Clear filters");
    expect(html).not.toContain("Create program");
  });
});

describe("ProgramListFilters", () => {
  it("renders search, status, delivery, sort controls and archived for owner", () => {
    const html = renderToStaticMarkup(
      <ProgramListFilters urlState={listState} role="owner" />,
    );

    expect(html).toContain('id="filter-program-search"');
    expect(html).toContain('id="filter-program-status"');
    expect(html).toContain('id="filter-program-delivery"');
    expect(html).toContain('id="filter-program-sort"');
    expect(html).toContain("Show archived programs");
    expect(html).toContain("Self-paced");
    expect(html).toContain("Draft");
  });

  it("hides archived control for staff", () => {
    const html = renderToStaticMarkup(
      <ProgramListFilters urlState={listState} role="staff" />,
    );
    expect(html).not.toContain("Show archived programs");
  });
});
