import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadStageForm } from "@/features/leads/ui/lead-stage-form";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const NEXT_STAGE_ID = "55555555-5555-4555-8555-555555555555";

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("LeadStageForm", () => {
  it("shows current stage and selectable targets", () => {
    const html = renderToStaticMarkup(
      <LeadStageForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        stageOptions={[
          {
            stageId: NEXT_STAGE_ID,
            name: "Qualified",
            position: 2,
            stageCategory: "qualified",
            stageCategoryLabel: "Qualified",
            isDefault: false,
            isArchived: false,
          },
        ]}
        listState={listState}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Change pipeline stage");
    expect(html).toContain("Current pipeline stage");
    expect(html).toContain("New");
    expect(html).toContain("Qualified");
    expect(html).toContain("Update pipeline stage");
    expect(html).not.toContain("converted");
  });
});
