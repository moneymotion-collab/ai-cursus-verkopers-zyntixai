import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadStatusForm } from "@/features/leads/ui/lead-status-form";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";
import { SERVICE_PRODUCT_TERMINOLOGY } from "../features/product-access/module-access-fixtures";

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
    expect(html).toContain("To complete a successful lead, use Convert to customer.");
    expect(html).not.toContain("won deals");
    expect(html).not.toContain("Converted");
    expect(html).not.toContain('value="converted"');
  });

  it("uses Client terminology in Service conversion guidance", () => {
    const html = renderToStaticMarkup(
      <LeadStatusForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        allowedTargets={["lost", "disqualified"]}
        listState={listState}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      />,
    );

    expect(html).toContain("Convert to client.");
    expect(html).not.toContain("Convert to customer.");
  });
});
