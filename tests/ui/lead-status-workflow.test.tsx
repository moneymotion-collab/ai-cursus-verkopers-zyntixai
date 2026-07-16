import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadStatusForm } from "@/features/leads/ui/lead-status-form";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("LeadStatusForm", () => {
  it("shows current status and valid targets without converted", () => {
    const html = renderToStaticMarkup(
      <LeadStatusForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        allowedTargets={["lost", "disqualified"]}
        listState={listState}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Change lead status");
    expect(html).toContain("Open");
    expect(html).toContain("Lost");
    expect(html).toContain("Disqualified");
    expect(html).toContain("Use convert to customer");
    expect(html).not.toContain("Converted");
    expect(html).not.toContain('value="converted"');
  });
});
