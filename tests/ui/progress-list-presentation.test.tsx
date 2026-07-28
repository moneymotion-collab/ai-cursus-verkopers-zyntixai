import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressListPresentation } from "@/features/progress/ui/progress-list";
import { ProgressListFilters } from "@/features/progress/ui/progress-list-filters";
import { mapProgressFactListItem } from "@/features/progress/server/map-progress-read-model";
import {
  MEMBER_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
  sampleProgressFactListRow,
} from "../helpers/progress-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const listState = {
  org: ORG_ID,
  includeVoided: false,
  sort: "occurred_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

const sampleItem = mapProgressFactListItem(sampleProgressFactListRow, {
  customerDisplayName: "Acme Corp",
  programName: "Growth Lab",
});

describe("ProgressListPresentation", () => {
  it("renders title, type, customer, program, recorder, and detail links", () => {
    const html = renderToStaticMarkup(
      <ProgressListPresentation
        facts={[sampleItem]}
        timeZone="UTC"
        listState={listState}
        recorderLabels={{ [MEMBER_ID]: "Team member" }}
        emptyTitle="No progress records yet"
        emptyDescription="Progress facts will appear here."
      />,
    );

    expect(html).toContain("Module 1 complete");
    expect(html).toContain("Milestone reached");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Team member");
    expect(html).toContain(`/progress/${PROGRESS_FACT_ID}`);
    expect(html).not.toContain("Create progress");
    expect(html).not.toContain("Void");
    expect(html).not.toContain("recorded_by_member_id");
  });

  it("shows empty state without mutation CTAs", () => {
    const html = renderToStaticMarkup(
      <ProgressListPresentation
        facts={[]}
        timeZone="UTC"
        listState={listState}
        recorderLabels={{}}
        emptyTitle="No progress records yet"
        emptyDescription="Progress facts for enrollments will appear here once recorded."
      />,
    );

    expect(html).toContain("No progress records yet");
    expect(html).not.toContain("Record progress");
    expect(html).not.toContain("/progress/new");
  });

  it("shows voided badge when includeVoided list contains voided facts", () => {
    const voided = mapProgressFactListItem(
      {
        ...sampleProgressFactListRow,
        voided_at: "2026-07-21T12:00:00.000Z",
      },
      {
        customerDisplayName: "Acme Corp",
        programName: "Growth Lab",
      },
    );
    const html = renderToStaticMarkup(
      <ProgressListPresentation
        facts={[voided]}
        timeZone="UTC"
        listState={{ ...listState, includeVoided: true }}
        recorderLabels={{ [MEMBER_ID]: "Team member" }}
        emptyTitle="No voided progress"
        emptyDescription="None"
      />,
    );
    expect(html).toContain("Voided");
  });

  it("shows voided toggle only for owner/admin filters", () => {
    const ownerHtml = renderToStaticMarkup(
      <ProgressListFilters urlState={listState} role="owner" />,
    );
    const staffHtml = renderToStaticMarkup(
      <ProgressListFilters urlState={listState} role="staff" />,
    );
    expect(ownerHtml).toContain("Show voided progress");
    expect(staffHtml).not.toContain("Show voided progress");
  });
});
