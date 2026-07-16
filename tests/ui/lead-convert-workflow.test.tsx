import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadConvertForm } from "@/features/leads/ui/lead-convert-form";
import { CUSTOMER_ID } from "../helpers/lead-read-query-mocks";
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

describe("LeadConvertForm", () => {
  it("supports new and existing customer conversion paths", () => {
    const html = renderToStaticMarkup(
      <LeadConvertForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        customerOptions={{
          customers: [{ value: CUSTOMER_ID, label: "Existing Customer" }],
          capped: false,
        }}
        listState={listState}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Convert lead to customer");
    expect(html).toContain("Create a new customer from this lead");
    expect(html).toContain("Link to an existing customer");
    expect(html).toContain('id="convert-mode-existing"');
    expect(html).toContain("Convert to customer");
    expect(html).not.toContain("transitionLeadStatusAction");
  });
});
