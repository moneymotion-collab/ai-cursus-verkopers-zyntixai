import { describe, expect, it } from "vitest";
import {
  buildClearEnrollmentContextHref,
  buildEnrollmentListQueryString,
  canViewArchivedEnrollmentFilter,
  hasEnrollmentRelationshipContext,
  parseEnrollmentListSearchParams,
} from "@/features/enrollments/ui/enrollment-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";

describe("parseEnrollmentListSearchParams", () => {
  it("applies defaults and normalizes search", () => {
    const parsed = parseEnrollmentListSearchParams(
      { org: ORG_ID, q: "  acme corp  " },
      { role: "staff" },
    );

    expect(parsed.urlState.org).toBe(ORG_ID);
    expect(parsed.listInput.filters.search).toBe("acme corp");
    expect(parsed.urlState.sort).toBe("enrolled_at");
    expect(parsed.urlState.direction).toBe("desc");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(25);
  });

  it("accepts a status filter", () => {
    const parsed = parseEnrollmentListSearchParams(
      { org: ORG_ID, status: "active" },
      { role: "admin" },
    );

    expect(parsed.urlState.status).toBe("active");
    expect(parsed.listInput.filters.status).toBe("active");
  });

  it("rejects archived filter for staff and viewer", () => {
    const staff = parseEnrollmentListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "staff" },
    );
    expect(staff.urlState.archived).toBe(false);
    expect(staff.warnings).toContain("archived_not_allowed");
    expect(canViewArchivedEnrollmentFilter("viewer")).toBe(false);

    const viewer = parseEnrollmentListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "viewer" },
    );
    expect(viewer.urlState.archived).toBe(false);
    expect(viewer.warnings).toContain("archived_not_allowed");
  });

  it("allows archived filter for owner and admin", () => {
    const owner = parseEnrollmentListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "owner" },
    );
    expect(owner.urlState.archived).toBe(true);
    expect(canViewArchivedEnrollmentFilter("admin")).toBe(true);
  });

  it("normalizes invalid org, status, sort, direction and page values", () => {
    const parsed = parseEnrollmentListSearchParams(
      {
        org: "not-a-uuid",
        status: "bogus",
        sort: "secret",
        direction: "sideways",
        page: "0",
        pageSize: "9999",
      },
      { role: "owner" },
    );

    expect(parsed.urlState.org).toBeUndefined();
    expect(parsed.urlState.status).toBeUndefined();
    expect(parsed.urlState.sort).toBe("enrolled_at");
    expect(parsed.urlState.direction).toBe("desc");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(100);
    expect(parsed.warnings).toEqual(
      expect.arrayContaining([
        "invalid_org",
        "invalid_status",
        "invalid_sort",
        "invalid_direction",
      ]),
    );
  });

  it("builds query string preserving filters and pagination", () => {
    const query = buildEnrollmentListQueryString({
      org: ORG_ID,
      status: "paused",
      q: "acme",
      archived: true,
      sort: "status",
      direction: "asc",
      page: 2,
      pageSize: 50,
    });

    expect(query).toContain(`org=${ORG_ID}`);
    expect(query).toContain("status=paused");
    expect(query).toContain("q=acme");
    expect(query).toContain("archived=true");
    expect(query).toContain("sort=status");
    expect(query).toContain("direction=asc");
    expect(query).toContain("page=2");
    expect(query).toContain("pageSize=50");
  });

  it("omits default sort/direction/page/pageSize from the query string", () => {
    const query = buildEnrollmentListQueryString({
      org: ORG_ID,
      archived: false,
      sort: "enrolled_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });

    expect(query).not.toContain("sort=");
    expect(query).not.toContain("direction=");
    expect(query).not.toContain("page=");
    expect(query).not.toContain("pageSize=");
  });
});

describe("parseEnrollmentListSearchParams — customerId/programId contextual params (B1.5.9)", () => {
  it("parses valid customerId and programId into urlState and filters", () => {
    const parsed = parseEnrollmentListSearchParams(
      { org: ORG_ID, customerId: CUSTOMER_ID, programId: PROGRAM_ID },
      { role: "staff" },
    );

    expect(parsed.urlState.customerId).toBe(CUSTOMER_ID);
    expect(parsed.urlState.programId).toBe(PROGRAM_ID);
    expect(parsed.listInput.filters.customerId).toBe(CUSTOMER_ID);
    expect(parsed.listInput.filters.programId).toBe(PROGRAM_ID);
    expect(parsed.warnings).toEqual([]);
  });

  it("omits an invalid customerId/programId from urlState and filters, and warns", () => {
    const parsed = parseEnrollmentListSearchParams(
      { org: ORG_ID, customerId: "not-a-uuid", programId: "also-not-a-uuid" },
      { role: "staff" },
    );

    expect(parsed.urlState.customerId).toBeUndefined();
    expect(parsed.urlState.programId).toBeUndefined();
    expect(parsed.listInput.filters.customerId).toBeUndefined();
    expect(parsed.listInput.filters.programId).toBeUndefined();
    expect(parsed.warnings).toEqual(
      expect.arrayContaining(["invalid_customer_id", "invalid_program_id"]),
    );
  });

  it("leaves customerId/programId undefined when absent, with no warnings", () => {
    const parsed = parseEnrollmentListSearchParams({ org: ORG_ID }, { role: "staff" });

    expect(parsed.urlState.customerId).toBeUndefined();
    expect(parsed.urlState.programId).toBeUndefined();
    expect(parsed.warnings).toEqual([]);
  });
});

describe("buildEnrollmentListQueryString — customerId/programId (B1.5.9)", () => {
  it("includes customerId and programId in the query string when present", () => {
    const query = buildEnrollmentListQueryString({
      org: ORG_ID,
      archived: false,
      sort: "enrolled_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(query).toContain(`customerId=${CUSTOMER_ID}`);
    expect(query).toContain(`programId=${PROGRAM_ID}`);
  });

  it("omits customerId/programId from the query string when absent", () => {
    const query = buildEnrollmentListQueryString({
      org: ORG_ID,
      archived: false,
      sort: "enrolled_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });

    expect(query).not.toContain("customerId=");
    expect(query).not.toContain("programId=");
  });
});

describe("hasEnrollmentRelationshipContext", () => {
  it("is true when either customerId or programId is present", () => {
    const base = {
      org: ORG_ID,
      archived: false,
      sort: "enrolled_at" as const,
      direction: "desc" as const,
      page: 1,
      pageSize: 25,
    };
    expect(hasEnrollmentRelationshipContext({ ...base, customerId: CUSTOMER_ID })).toBe(true);
    expect(hasEnrollmentRelationshipContext({ ...base, programId: PROGRAM_ID })).toBe(true);
    expect(
      hasEnrollmentRelationshipContext({
        ...base,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
      }),
    ).toBe(true);
  });

  it("is false when neither customerId nor programId is present", () => {
    expect(
      hasEnrollmentRelationshipContext({
        org: ORG_ID,
        archived: false,
        sort: "enrolled_at",
        direction: "desc",
        page: 1,
        pageSize: 25,
      }),
    ).toBe(false);
  });
});

describe("buildClearEnrollmentContextHref", () => {
  it("removes customerId/programId while preserving org/status/q/archived/sort/direction/pageSize, and resets page to 1", () => {
    const href = buildClearEnrollmentContextHref({
      org: ORG_ID,
      status: "paused",
      q: "acme",
      archived: true,
      sort: "status",
      direction: "asc",
      page: 3,
      pageSize: 50,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(href).toContain(`org=${ORG_ID}`);
    expect(href).toContain("status=paused");
    expect(href).toContain("q=acme");
    expect(href).toContain("archived=true");
    expect(href).toContain("sort=status");
    expect(href).toContain("direction=asc");
    expect(href).toContain("pageSize=50");
    expect(href).not.toContain("page=3");
    expect(href).not.toContain("customerId=");
    expect(href).not.toContain("programId=");
  });
});
