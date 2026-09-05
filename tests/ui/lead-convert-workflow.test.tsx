import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CONVERT_EXISTING_CUSTOMER_EFFECT,
  CONVERT_LEAD_CONFIRMATION_DESCRIPTION,
  CONVERT_NEW_CUSTOMER_EFFECT,
  LeadConvertForm,
} from "@/features/leads/ui/lead-convert-form";
import { CUSTOMER_ID } from "../helpers/lead-read-query-mocks";
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

describe("LeadConvertForm", () => {
  it("supports new and existing customer conversion paths with accurate status copy", () => {
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
    expect(html).toContain(CONVERT_LEAD_CONFIRMATION_DESCRIPTION);
    expect(html).toContain("Create a new customer from this lead");
    expect(html).toContain("Link to an existing customer");
    expect(html).toContain('id="convert-mode-existing"');
    expect(html).toContain("Convert to customer");
    expect(html).toContain("<dt>Lead name</dt>");
    expect(html).toContain("<dt>Assigned to</dt>");
    expect(html).toContain(CONVERT_NEW_CUSTOMER_EFFECT);
    expect(html).toContain("Onboarding");
    expect(html).toContain("Lead status becomes Converted");
    expect(html).not.toContain("This is separate from changing lead status");
    expect(html).not.toContain("transitionLeadStatusAction");
  });

  it("documents distinct create vs link-existing confirmation effects", () => {
    expect(CONVERT_NEW_CUSTOMER_EFFECT).toContain("A new customer will be created");
    expect(CONVERT_NEW_CUSTOMER_EFFECT).toContain("Onboarding");
    expect(CONVERT_NEW_CUSTOMER_EFFECT).toContain("Lead status becomes Converted");

    expect(CONVERT_EXISTING_CUSTOMER_EFFECT).toContain("linked to the selected existing customer");
    expect(CONVERT_EXISTING_CUSTOMER_EFFECT).toContain("Lead status becomes Converted");
    expect(CONVERT_EXISTING_CUSTOMER_EFFECT).toContain("No new customer is created");
    expect(CONVERT_EXISTING_CUSTOMER_EFFECT).not.toContain("Onboarding");
  });

  it("uses Client terminology throughout the Service conversion workflow", () => {
    const html = renderToStaticMarkup(
      <LeadConvertForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        customerOptions={{
          customers: [{ value: CUSTOMER_ID, label: "Existing Client" }],
          capped: true,
        }}
        listState={listState}
        cancelHref={`/leads/${sampleLeadDetail.id}`}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      />,
    );

    expect(html).toContain("Convert lead to client");
    expect(html).toContain("create or link a client");
    expect(html).toContain("Create a new client from this lead");
    expect(html).toContain("Link to an existing client");
    expect(html).toContain("Convert to client");
    expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/\bcustomer(?:s)?\b/i);
  });
});
