import { describe, expect, it } from "vitest";
import {
  buildProgressListQueryString,
  canViewVoidedProgressFilter,
  parseProgressListSearchParams,
} from "@/features/progress/ui/progress-list-search-params";
import { ORG_ID, ENROLLMENT_ID, CUSTOMER_ID, PROGRAM_ID } from "../helpers/progress-test-fixtures";

describe("progress list search params", () => {
  it("parses default list state with voided excluded", () => {
    const parsed = parseProgressListSearchParams({ org: ORG_ID }, { role: "staff" });
    expect(parsed.urlState.includeVoided).toBe(false);
    expect(parsed.listInput.filters.includeVoided).toBe(false);
    expect(parsed.listInput.sort).toEqual({ field: "occurred_at", direction: "desc" });
  });

  it("allows owner/admin includeVoided and strips it for staff/viewer", () => {
    const owner = parseProgressListSearchParams(
      { org: ORG_ID, includeVoided: "true" },
      { role: "owner" },
    );
    expect(owner.urlState.includeVoided).toBe(true);
    expect(canViewVoidedProgressFilter("owner")).toBe(true);
    expect(canViewVoidedProgressFilter("admin")).toBe(true);

    const staff = parseProgressListSearchParams(
      { org: ORG_ID, includeVoided: "true" },
      { role: "staff" },
    );
    expect(staff.urlState.includeVoided).toBe(false);
    expect(staff.warnings).toContain("include_voided_not_allowed");
    expect(canViewVoidedProgressFilter("staff")).toBe(false);
    expect(canViewVoidedProgressFilter("viewer")).toBe(false);
  });

  it("parses fact type, search, context ids, sort, and pagination", () => {
    const parsed = parseProgressListSearchParams(
      {
        org: ORG_ID,
        factType: "milestone_reached",
        q: " module ",
        enrollmentId: ENROLLMENT_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        sort: "recorded_at",
        direction: "asc",
        page: "2",
        pageSize: "10",
      },
      { role: "owner" },
    );

    expect(parsed.urlState.factType).toBe("milestone_reached");
    expect(parsed.urlState.q).toBe("module");
    expect(parsed.urlState.enrollmentId).toBe(ENROLLMENT_ID);
    expect(parsed.urlState.customerId).toBe(CUSTOMER_ID);
    expect(parsed.urlState.programId).toBe(PROGRAM_ID);
    expect(parsed.listInput.sort).toEqual({ field: "recorded_at", direction: "asc" });
    expect(parsed.listInput.pagination).toEqual({ page: 2, pageSize: 10 });
  });

  it("builds query strings without default sort/direction/page noise", () => {
    expect(
      buildProgressListQueryString({
        org: ORG_ID,
        includeVoided: false,
        sort: "occurred_at",
        direction: "desc",
        page: 1,
        pageSize: 25,
      }),
    ).toBe(`?org=${ORG_ID}`);

    expect(
      buildProgressListQueryString({
        org: ORG_ID,
        includeVoided: true,
        factType: "session_attended",
        q: "live",
        sort: "fact_type",
        direction: "asc",
        page: 3,
        pageSize: 50,
        enrollmentId: ENROLLMENT_ID,
      }),
    ).toContain("includeVoided=true");
  });
});
