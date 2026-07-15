import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerEditForm } from "@/features/customers/ui/customer-edit-form";
import { sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CustomerEditForm", () => {
  it("renders prefilled approved profile fields only", () => {
    const html = renderToStaticMarkup(
      <CustomerEditForm
        organizationId={sampleCustomerDetail.organizationId}
        customer={sampleCustomerDetail}
        listState={{ org: sampleCustomerDetail.organizationId, archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        ownerOptions={{ members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }], capped: false }}
        cancelHref={`/customers/${sampleCustomerDetail.id}`}
      />,
    );
    expect(html).toContain("Edit customer");
    expect(html).toContain("Acme Corp");
    expect(html).toContain('id="edit-display-name"');
    expect(html).toContain('id="edit-email"');
    expect(html).not.toContain("Lifecycle status");
    expect(html).not.toContain("Archive state");
  });
});
