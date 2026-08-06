import { describe, expect, it } from "vitest";
import {
  ATTENTION_LIST_DEFAULT_PAGE_SIZE,
  ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
  ATTENTION_LIST_DEFAULT_SORT_FIELD,
  attentionListFilterWarningMessage,
  buildAttentionListHref,
  buildAttentionListQueryString,
  buildAttentionListResetHref,
  canViewArchivedAttentionFilter,
  hasAttentionListActiveFilters,
  parseAttentionListSearchParams,
} from "@/features/attention/ui/attention-list-search-params";
import { ORG_ID } from "../helpers/attention-test-fixtures";

describe("attention list search params (B1.7.5-C)", () => {
  it("parses default UX state as last_detected_at desc without inventing filters", () => {
    const parsed = parseAttentionListSearchParams({ org: ORG_ID }, { role: "viewer" });
    expect(parsed.urlState).toMatchObject({
      org: ORG_ID,
      includeArchived: false,
      sort: ATTENTION_LIST_DEFAULT_SORT_FIELD,
      direction: ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
      page: 1,
      pageSize: ATTENTION_LIST_DEFAULT_PAGE_SIZE,
    });
    expect(parsed.listInput.sort).toEqual({
      field: "last_detected_at",
      direction: "desc",
    });
    expect(parsed.listInput.filters).toEqual({ includeArchived: false });
    expect(parsed.warnings).toEqual([]);
  });

  it("maps supported filters and unassigned assignee", () => {
    const parsed = parseAttentionListSearchParams(
      {
        org: ORG_ID,
        status: "open",
        severity: "high",
        assignee: "unassigned",
        acknowledged: "false",
      },
      { role: "staff" },
    );
    expect(parsed.listInput.filters).toEqual({
      includeArchived: false,
      status: "open",
      severity: "high",
      assigneeMemberId: null,
      acknowledged: false,
    });
    expect(hasAttentionListActiveFilters(parsed.urlState)).toBe(true);
  });

  it("ignores invalid enums and normalizes bad pages", () => {
    const parsed = parseAttentionListSearchParams(
      {
        status: "not-a-status",
        severity: "nope",
        sort: "not-a-sort",
        direction: "sideways",
        page: "0",
        pageSize: "-5",
        acknowledged: "maybe",
        assignee: "bad",
        unknown: "x",
      },
      { role: "owner" },
    );
    expect(parsed.urlState.status).toBeUndefined();
    expect(parsed.urlState.severity).toBeUndefined();
    expect(parsed.urlState.sort).toBe("last_detected_at");
    expect(parsed.urlState.direction).toBe("desc");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(25);
    expect(parsed.warnings).toEqual(
      expect.arrayContaining([
        "invalid_status",
        "invalid_severity",
        "invalid_sort",
        "invalid_direction",
        "invalid_acknowledged",
        "invalid_assignee",
      ]),
    );
  });

  it("uses first value for duplicate keys and caps pageSize", () => {
    const parsed = parseAttentionListSearchParams(
      {
        status: ["open", "resolved"],
        page: ["2", "9"],
        pageSize: ["999", "10"],
      },
      { role: "admin" },
    );
    expect(parsed.urlState.status).toBe("open");
    expect(parsed.urlState.page).toBe(2);
    expect(parsed.urlState.pageSize).toBe(100);
  });

  it("blocks includeArchived for viewer and allows for owner", () => {
    const denied = parseAttentionListSearchParams(
      { includeArchived: "true" },
      { role: "viewer" },
    );
    expect(denied.urlState.includeArchived).toBe(false);
    expect(denied.listInput.filters.includeArchived).toBe(false);
    expect(denied.warnings).toContain("include_archived_not_allowed");
    expect(attentionListFilterWarningMessage(denied.warnings)).toContain(
      "owners and admins",
    );
    expect(canViewArchivedAttentionFilter("viewer")).toBe(false);

    const allowed = parseAttentionListSearchParams(
      { includeArchived: "true" },
      { role: "owner" },
    );
    expect(allowed.urlState.includeArchived).toBe(true);
    expect(allowed.listInput.filters.includeArchived).toBe(true);
    expect(canViewArchivedAttentionFilter("owner")).toBe(true);
  });

  it("canonicalizes defaults out of the query string and resets cleanly", () => {
    const qs = buildAttentionListQueryString({
      org: ORG_ID,
      includeArchived: false,
      sort: "last_detected_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });
    expect(qs).toBe(`?org=${ORG_ID}`);

    const withState = buildAttentionListQueryString({
      org: ORG_ID,
      status: "open",
      sort: "created_at",
      direction: "asc",
      page: 3,
      pageSize: 25,
      includeArchived: false,
    });
    expect(withState).toContain("status=open");
    expect(withState).toContain("sort=created_at");
    expect(withState).toContain("direction=asc");
    expect(withState).toContain("page=3");
    expect(withState).not.toContain("pageSize=");

    const reset = buildAttentionListResetHref({
      org: ORG_ID,
      status: "open",
      includeArchived: true,
      sort: "severity",
      direction: "asc",
      page: 4,
      pageSize: 50,
    });
    expect(reset).toBe(`/attention?org=${ORG_ID}`);
    expect(buildAttentionListHref({
      org: ORG_ID,
      includeArchived: false,
      sort: "last_detected_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    })).toBe(`/attention?org=${ORG_ID}`);
  });

  it("accepts relationship context UUIDs and rejects invalid ones", () => {
    const ok = parseAttentionListSearchParams(
      {
        enrollmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        customerId: "not-a-uuid",
      },
      { role: "staff" },
    );
    expect(ok.urlState.enrollmentId).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(ok.urlState.customerId).toBeUndefined();
    expect(ok.warnings).toContain("invalid_customer_id");
  });
});
