import { describe, expect, it } from "vitest";
import {
  escapeCustomerIlikePattern,
  validateCustomerIdQuery,
  validateCustomerListQuery,
} from "@/features/customers/validation/read-query-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

describe("customer read query schemas", () => {
  it("applies list defaults", () => {
    const parsed = validateCustomerListQuery({ organizationId: ORG_ID });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pagination.page).toBe(1);
      expect(parsed.data.pagination.pageSize).toBe(25);
      expect(parsed.data.sort.field).toBe("display_name");
      expect(parsed.data.filters.includeArchived).toBe(false);
    }
  });

  it("rejects unknown fields", () => {
    const parsed = validateCustomerListQuery({
      organizationId: ORG_ID,
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("enforces page size maximum", () => {
    const parsed = validateCustomerListQuery({
      organizationId: ORG_ID,
      pagination: { pageSize: 101 },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts bounded search and status filters", () => {
    const parsed = validateCustomerListQuery({
      organizationId: ORG_ID,
      filters: {
        search: "  acme ",
        status: ["active", "onboarding"],
        ownerMemberId: MEMBER_ID,
        includeArchived: true,
      },
      sort: { field: "updated_at", direction: "desc" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(validateCustomerIdQuery({ organizationId: "bad", customerId: CUSTOMER_ID }).success).toBe(
      false,
    );
    expect(validateCustomerIdQuery({ organizationId: ORG_ID, customerId: "bad" }).success).toBe(
      false,
    );
  });

  it("escapes ilike metacharacters", () => {
    expect(escapeCustomerIlikePattern("100%_\\")).toBe("100\\%\\_\\\\");
  });
});
