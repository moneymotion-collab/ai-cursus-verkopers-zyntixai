import { describe, expect, it } from "vitest";
import {
  buildProgramListQueryString,
  canViewArchivedProgramFilter,
  parseProgramListSearchParams,
} from "@/features/programs/ui/program-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

describe("parseProgramListSearchParams", () => {
  it("applies defaults and normalizes search", () => {
    const parsed = parseProgramListSearchParams(
      { org: ORG_ID, q: "  growth lab  " },
      { role: "staff" },
    );

    expect(parsed.urlState.org).toBe(ORG_ID);
    expect(parsed.listInput.filters.search).toBe("growth lab");
    expect(parsed.urlState.sort).toBe("updated_at");
    expect(parsed.urlState.direction).toBe("desc");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(25);
  });

  it("accepts status and delivery mode filters", () => {
    const parsed = parseProgramListSearchParams(
      { org: ORG_ID, status: "active", deliveryMode: "cohort" },
      { role: "admin" },
    );

    expect(parsed.urlState.status).toBe("active");
    expect(parsed.urlState.deliveryMode).toBe("cohort");
    expect(parsed.listInput.filters.status).toBe("active");
    expect(parsed.listInput.filters.deliveryMode).toBe("cohort");
  });

  it("rejects archived filter for staff and viewer", () => {
    const staff = parseProgramListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "staff" },
    );
    expect(staff.urlState.archived).toBe(false);
    expect(staff.warnings).toContain("archived_not_allowed");
    expect(canViewArchivedProgramFilter("viewer")).toBe(false);
  });

  it("allows archived filter for owner and admin", () => {
    const owner = parseProgramListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "owner" },
    );
    expect(owner.urlState.archived).toBe(true);
    expect(canViewArchivedProgramFilter("admin")).toBe(true);
  });

  it("normalizes invalid sort, status, delivery and page values", () => {
    const parsed = parseProgramListSearchParams(
      {
        org: "not-a-uuid",
        status: "bogus",
        deliveryMode: "telepathy",
        sort: "secret",
        direction: "sideways",
        page: "0",
        pageSize: "9999",
      },
      { role: "owner" },
    );

    expect(parsed.urlState.org).toBeUndefined();
    expect(parsed.urlState.status).toBeUndefined();
    expect(parsed.urlState.deliveryMode).toBeUndefined();
    expect(parsed.urlState.sort).toBe("updated_at");
    expect(parsed.urlState.direction).toBe("desc");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(100);
    expect(parsed.warnings).toEqual(
      expect.arrayContaining([
        "invalid_org",
        "invalid_status",
        "invalid_delivery_mode",
        "invalid_sort",
        "invalid_direction",
      ]),
    );
  });

  it("builds query string preserving filters and pagination", () => {
    const query = buildProgramListQueryString({
      org: ORG_ID,
      status: "paused",
      deliveryMode: "hybrid",
      q: "lab",
      archived: true,
      sort: "name",
      direction: "asc",
      page: 2,
      pageSize: 50,
    });

    expect(query).toContain(`org=${ORG_ID}`);
    expect(query).toContain("status=paused");
    expect(query).toContain("deliveryMode=hybrid");
    expect(query).toContain("q=lab");
    expect(query).toContain("archived=true");
    expect(query).toContain("sort=name");
    expect(query).toContain("direction=asc");
    expect(query).toContain("page=2");
    expect(query).toContain("pageSize=50");
  });
});
