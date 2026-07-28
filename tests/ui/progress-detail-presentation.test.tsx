import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ProgressDetail,
  ProgressUnavailableDetail,
} from "@/features/progress/ui/progress-detail";
import { mapProgressFactDetail } from "@/features/progress/server/map-progress-read-model";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  PROGRESS_FACT_ID,
  sampleProgressFactDetailRow,
} from "../helpers/progress-test-fixtures";
import type { ProgressDetailViewModel } from "@/features/progress/ui/load-progress-detail-page";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const fact = mapProgressFactDetail(sampleProgressFactDetailRow, {
  enrollment: {
    id: ENROLLMENT_ID,
    status: "active",
    archivedAt: null,
    customerId: CUSTOMER_ID,
    programId: PROGRAM_ID,
  },
  customer: {
    id: CUSTOMER_ID,
    displayName: "Acme Corp",
    status: "active",
    archivedAt: null,
  },
  program: {
    id: PROGRAM_ID,
    name: "Growth Lab",
    status: "active",
    archivedAt: null,
  },
});

const viewModel: ProgressDetailViewModel = {
  fact,
  titleLabel: "Module 1 complete",
  customerLabel: "Acme Corp",
  programLabel: "Growth Lab",
  enrollmentStatusLabel: "Active",
  enrollmentArchived: false,
  recorderLabel: "Team member",
  voidedByLabel: null,
  occurredAtLabel: "Jul 20, 2026, 10:00 AM",
  recordedAtLabel: "Jul 20, 2026, 10:05 AM",
  voidedAtLabel: null,
  customerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
  programHref: `/programs/${PROGRAM_ID}?org=${ORG_ID}`,
  enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
  correctedFromHref: null,
  backHref: `/progress?org=${ORG_ID}`,
  organizationTimezone: "UTC",
};

describe("ProgressDetail presentation", () => {
  it("renders fact fields and related context without mutation controls", () => {
    const html = renderToStaticMarkup(<ProgressDetail viewModel={viewModel} />);
    expect(html).toContain("Module 1 complete");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Active");
    expect(html).toContain("Team member");
    expect(html).toContain("Completed first module");
    expect(html).not.toContain("Record progress");
    expect(html).not.toContain("/progress/new");
    expect(html).not.toContain("/void");
    expect(html).not.toContain("/correct");
    expect(html).not.toContain(MEMBER_ID);
  });

  it("renders voided details read-only when voided", () => {
    const voidedFact = mapProgressFactDetail(
      {
        ...sampleProgressFactDetailRow,
        voided_at: "2026-07-22T09:00:00.000Z",
        voided_by_member_id: MEMBER_ID,
        void_reason: "Entered by mistake",
      },
      {
        enrollment: fact.enrollment,
        customer: fact.customer,
        program: fact.program,
      },
    );
    const html = renderToStaticMarkup(
      <ProgressDetail
        viewModel={{
          ...viewModel,
          fact: voidedFact,
          voidedByLabel: "Team member",
          voidedAtLabel: "Jul 22, 2026, 9:00 AM",
        }}
      />,
    );
    expect(html).toContain("Voided");
    expect(html).toContain("Entered by mistake");
    expect(html).toContain("read-only");
    expect(html).not.toContain("Restore");
  });

  it("renders archived enrollment badge when enrollment is archived", () => {
    const html = renderToStaticMarkup(
      <ProgressDetail
        viewModel={{
          ...viewModel,
          enrollmentArchived: true,
        }}
      />,
    );
    expect(html).toContain("Archived");
  });

  it("renders safe unavailable state", () => {
    const html = renderToStaticMarkup(
      <ProgressUnavailableDetail backHref={`/progress?org=${ORG_ID}`} />,
    );
    expect(html).toContain("Progress unavailable");
    expect(html).toContain("may have been removed or you may not have access");
    expect(html).toContain(`/progress?org=${ORG_ID}`);
  });

  it("does not render workflow links when none are provided", () => {
    const html = renderToStaticMarkup(<ProgressDetail viewModel={viewModel} />);
    expect(html).not.toContain("Void");
    expect(html).not.toContain("Correct");
  });

  it("renders void and correct links when provided", () => {
    const html = renderToStaticMarkup(
      <ProgressDetail
        viewModel={viewModel}
        workflowLinks={{
          void: `/progress/${PROGRESS_FACT_ID}/void?org=${ORG_ID}`,
          correct: `/progress/${PROGRESS_FACT_ID}/correct?org=${ORG_ID}`,
        }}
      />,
    );
    expect(html).toContain(`/progress/${PROGRESS_FACT_ID}/void?org=${ORG_ID}`);
    expect(html).toContain(`/progress/${PROGRESS_FACT_ID}/correct?org=${ORG_ID}`);
    expect(html).toContain("Void");
    expect(html).toContain("Correct");
  });

  it("renders only the provided workflow link, omitting the other", () => {
    const html = renderToStaticMarkup(
      <ProgressDetail
        viewModel={viewModel}
        workflowLinks={{ correct: `/progress/${PROGRESS_FACT_ID}/correct?org=${ORG_ID}` }}
      />,
    );
    expect(html).toContain(`/progress/${PROGRESS_FACT_ID}/correct?org=${ORG_ID}`);
    expect(html).not.toContain(`/progress/${PROGRESS_FACT_ID}/void`);
  });
});
