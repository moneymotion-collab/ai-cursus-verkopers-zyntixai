import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerStatusForm } from "@/features/customers/ui/customer-status-form";
import { getAllowedCustomerStatusTransitions } from "@/features/customers/domain/status";
import { sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CustomerStatusForm", () => {
  it("shows current status and allowed targets only", () => {
    const allowedTargets = getAllowedCustomerStatusTransitions(sampleCustomerDetail.status);
    const html = renderToStaticMarkup(
      <CustomerStatusForm
        organizationId={sampleCustomerDetail.organizationId}
        customer={sampleCustomerDetail}
        allowedTargets={allowedTargets}
        listState={{ org: sampleCustomerDetail.organizationId, archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        cancelHref={`/customers/${sampleCustomerDetail.id}`}
      />,
    );
    expect(html).toContain("Change customer status");
    expect(html).toContain("Current customer status:");
    expect(html).toContain("New customer status");
    expect(html).toContain("Active");
    for (const status of allowedTargets) {
      expect(html).toContain(`id="status-${status}"`);
    }
    expect(html).not.toContain('id="status-active"');
    expect(html).not.toContain(">Ended<");
    expect(html).toContain('id="status-reason"');
  });
});
