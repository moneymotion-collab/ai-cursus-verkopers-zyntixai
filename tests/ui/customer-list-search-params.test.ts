import { describe, expect, it } from "vitest";
import {
  buildCustomerListQueryString,
  canViewArchivedCustomerFilter,
  parseCustomerListSearchParams,
} from "@/features/customers/ui/customer-list-search-params";
import { CUSTOMER_OWNER_UNASSIGNED_VALUE } from "@/features/customers/ui/customer-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

describe("parseCustomerListSearchParams", () => {
  it("applies defaults and normalizes search", () => {
    const parsed = parseCustomerListSearchParams(
      { org: ORG_ID, q: "  acme@test.com  " },
      { role: "staff" },
    );

    expect(parsed.urlState.org).toBe(ORG_ID);
    expect(parsed.listInput.filters.search).toBe("acme@test.com");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(25);
  });

  it("rejects archived filter for staff", () => {
    const parsed = parseCustomerListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "staff" },
    );

    expect(parsed.urlState.archived).toBe(false);
    expect(parsed.warnings).toContain("archived_not_allowed");
  });

  it("allows archived filter for owner", () => {
    const parsed = parseCustomerListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "owner" },
    );

    expect(parsed.urlState.archived).toBe(true);
    expect(canViewArchivedCustomerFilter("owner")).toBe(true);
    expect(canViewArchivedCustomerFilter("viewer")).toBe(false);
  });

  it("maps owner unassigned and invalid owner safely", () => {
    const unassigned = parseCustomerListSearchParams(
      { org: ORG_ID, owner: CUSTOMER_OWNER_UNASSIGNED_VALUE },
      { role: "admin" },
    );
    expect(unassigned.listInput.filters.ownerIsUnassigned).toBe(true);

    const invalidOwner = parseCustomerListSearchParams(
      { org: ORG_ID, owner: "not-a-uuid" },
      { role: "admin", ownerOptions: [MEMBER_ID] },
    );
    expect(invalidOwner.urlState.owner).toBeUndefined();
    expect(invalidOwner.warnings).toContain("invalid_owner");
  });

  it("builds query string preserving filters and pagination", () => {
    const query = buildCustomerListQueryString({
      org: ORG_ID,
      status: "active",
      owner: MEMBER_ID,
      q: "acme",
      archived: true,
      sort: "updated_at",
      direction: "desc",
      page: 2,
      pageSize: 50,
    });

    expect(query).toContain(`org=${ORG_ID}`);
    expect(query).toContain("status=active");
    expect(query).toContain(`owner=${MEMBER_ID}`);
    expect(query).toContain("q=acme");
    expect(query).toContain("archived=true");
    expect(query).toContain("sort=updated_at");
    expect(query).toContain("direction=desc");
    expect(query).toContain("page=2");
    expect(query).toContain("pageSize=50");
  });
});
