import { describe, expect, it } from "vitest";
import {
  buildCustomerArchiveHref,
  buildCustomerCreateHref,
  buildCustomerEditHref,
  buildCustomerRestoreHref,
  buildCustomerStatusHref,
} from "@/features/customers/ui/customer-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("customer workflow navigation", () => {
  it("preserves organization query on workflow hrefs", () => {
    expect(buildCustomerCreateHref(listState)).toContain(`org=${ORG_ID}`);
    expect(buildCustomerEditHref(CUSTOMER_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildCustomerStatusHref(CUSTOMER_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildCustomerArchiveHref(CUSTOMER_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildCustomerRestoreHref(CUSTOMER_ID, listState)).toContain(`org=${ORG_ID}`);
  });

  it("targets approved workflow route paths", () => {
    expect(buildCustomerCreateHref(listState)).toContain("/customers/new");
    expect(buildCustomerEditHref(CUSTOMER_ID, listState)).toContain(`/customers/${CUSTOMER_ID}/edit`);
    expect(buildCustomerStatusHref(CUSTOMER_ID, listState)).toContain(`/customers/${CUSTOMER_ID}/status`);
    expect(buildCustomerArchiveHref(CUSTOMER_ID, listState)).toContain(`/customers/${CUSTOMER_ID}/archive`);
    expect(buildCustomerRestoreHref(CUSTOMER_ID, listState)).toContain(`/customers/${CUSTOMER_ID}/restore`);
  });
});
