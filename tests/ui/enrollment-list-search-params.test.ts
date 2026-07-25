import { describe, expect, it } from "vitest";
import {
  buildEnrollmentListQueryString,
  canViewArchivedEnrollmentFilter,
  parseEnrollmentListSearchParams,
} from "@/features/enrollments/ui/enrollment-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

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
