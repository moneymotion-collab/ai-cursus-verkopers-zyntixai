import { describe, expect, it } from "vitest";
import {
  buildBackToCustomersHref,
  buildCustomerDetailHref,
  parseCustomerListReturnState,
} from "@/features/customers/ui/customer-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

describe("customer navigation", () => {
  it("builds detail and back links preserving allowed list state", () => {
    const listState = parseCustomerListReturnState(
      {
        org: ORG_ID,
        status: "active",
        q: "acme",
        page: "2",
      },
      "staff",
    );

    expect(buildBackToCustomersHref(listState)).toContain("/customers?");
    expect(buildBackToCustomersHref(listState)).toContain(`org=${ORG_ID}`);
    expect(buildBackToCustomersHref(listState)).toContain("status=active");
    expect(buildCustomerDetailHref(CUSTOMER_ID, listState)).toContain(`/customers/${CUSTOMER_ID}`);
    expect(buildCustomerDetailHref(CUSTOMER_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildCustomerDetailHref(CUSTOMER_ID, listState)).toContain("status=active");
    expect(buildCustomerDetailHref(CUSTOMER_ID, listState)).toContain("q=acme");
    expect(buildCustomerDetailHref(CUSTOMER_ID, listState)).toContain("page=2");
  });

  it("rejects arbitrary return parameters", () => {
    const listState = parseCustomerListReturnState(
      {
        org: ORG_ID,
        evil: "payload",
        returnTo: "/admin",
      },
      "staff",
    );

    expect(buildBackToCustomersHref(listState)).not.toContain("evil");
    expect(buildBackToCustomersHref(listState)).not.toContain("returnTo");
  });
});
