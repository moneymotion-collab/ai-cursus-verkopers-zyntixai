import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadEditForm } from "@/features/leads/ui/lead-edit-form";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/leads/actions/lead-actions", () => ({
  updateLeadProfileAction: vi.fn(),
}));

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("LeadEditForm", () => {
  it("renders prefilled approved profile fields only", () => {
    const html = renderToStaticMarkup(
      <LeadEditForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        listState={listState}
        ownerOptions={{
          members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }],
          capped: false,
        }}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Edit lead");
    expect(html).toContain("Prospect Co");
    expect(html).toContain('id="edit-lead-display-name"');
    expect(html).toContain("Source type");
    expect(html).toContain("Pursuit label");
    expect(html).not.toMatch(/pipeline stage/i);
    expect(html).not.toMatch(/toStatus/);
    expect(html).not.toMatch(/toStageId/);
    expect(html).not.toContain("Archive lead");
  });
});
