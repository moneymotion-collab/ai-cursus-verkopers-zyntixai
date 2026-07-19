import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createCustomerAction } from "@/features/customers/actions/customer-actions";
import { CustomerCreateForm } from "@/features/customers/ui/customer-create-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/customers/actions/customer-actions", () => ({
  createCustomerAction: vi.fn(),
}));

const createActionMock = vi.mocked(createCustomerAction);

const ownerOptions = {
  members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }],
  capped: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomerCreateForm", () => {
  it("renders approved Customer name terminology without lifecycle inputs", () => {
    const html = renderToStaticMarkup(
      <CustomerCreateForm
        organizationId="11111111-1111-4111-8111-111111111111"
        listState={{
          org: "11111111-1111-4111-8111-111111111111",
          archived: false,
          sort: "display_name",
          direction: "asc",
          page: 1,
          pageSize: 25,
        }}
        ownerOptions={ownerOptions}
        cancelHref="/customers"
      />,
    );
    expect(html).toContain("Create customer");
    expect(html).toContain("Customer details");
    expect(html).toContain("Customer name (required)");
    expect(html).toContain('id="create-display-name"');
    expect(html).toContain('name="displayName"');
    expect(html).toContain("Assigned to");
    expect(html).toContain('name="ownerMemberId"');
    expect(html).toContain("Unassigned");
    expect(html).toContain("Taylor Owner");
    expect(html).not.toContain("Display name (required)");
    expect(html).not.toContain(">Owner<");
    expect(html).not.toContain("Customer identity");
    expect(html.toLowerCase()).not.toContain("archive");
  });

  it("does not invoke createCustomerAction during static render", () => {
    renderToStaticMarkup(
      <CustomerCreateForm
        organizationId="11111111-1111-4111-8111-111111111111"
        listState={{ archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        ownerOptions={ownerOptions}
        cancelHref="/customers"
      />,
    );
    expect(createActionMock).not.toHaveBeenCalled();
  });
});
