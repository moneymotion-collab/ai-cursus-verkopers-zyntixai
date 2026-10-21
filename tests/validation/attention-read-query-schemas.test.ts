import { describe, expect, it } from "vitest";
import {
  normalizeAttentionPagination,
  validateAttentionItemIdQuery,
  validateAttentionListQuery,
} from "@/features/attention/validation/read-query-schemas";
import {
  ATTENTION_ITEM_ID,
  ENROLLMENT_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

describe("attention read query schemas", () => {
  it("accepts a valid list query and applies defaults", () => {
    const parsed = validateAttentionListQuery({
      organizationId: ORG_ID,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.filters.includeArchived).toBe(false);
      expect(parsed.data.pagination.page).toBe(1);
      expect(parsed.data.pagination.pageSize).toBe(25);
      expect(parsed.data.sort.field).toBe("created_at");
      expect(parsed.data.sort.direction).toBe("desc");
    }
  });

  it("accepts known filters and rejects unknown status/severity/sort", () => {
    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        filters: {
          status: ["open", "acknowledged"],
          severity: "critical",
          enrollmentId: ENROLLMENT_ID,
          acknowledged: false,
          assigneeMemberId: null,
        },
        sort: { field: "severity", direction: "asc" },
      }).success,
    ).toBe(true);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        filters: { status: "snoozed" },
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        filters: { severity: "urgent" },
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        sort: { field: "title", direction: "asc" },
      }).success,
    ).toBe(false);
  });

  it("rejects invalid UUIDs, oversized pages, inverted ranges, and extras", () => {
    expect(
      validateAttentionListQuery({
        organizationId: "not-a-uuid",
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        pagination: { page: 0, pageSize: 25 },
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 101 },
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        filters: {
          createdFrom: "2026-08-05T00:00:00.000Z",
          createdTo: "2026-08-01T00:00:00.000Z",
        },
      }).success,
    ).toBe(false);

    expect(
      validateAttentionListQuery({
        organizationId: ORG_ID,
        unexpected: true,
      }).success,
    ).toBe(false);
  });

  it("validates attention item id queries", () => {
    expect(
      validateAttentionItemIdQuery({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
      }).success,
    ).toBe(true);

    expect(
      validateAttentionItemIdQuery({
        organizationId: ORG_ID,
        attentionItemId: "bad",
      }).success,
    ).toBe(false);
  });

  it("normalizes pagination with safe defaults on invalid input", () => {
    expect(normalizeAttentionPagination({})).toEqual({
      page: 1,
      pageSize: 25,
      offset: 0,
      limit: 25,
    });
    expect(normalizeAttentionPagination({ page: 2, pageSize: 10 })).toEqual({
      page: 2,
      pageSize: 10,
      offset: 10,
      limit: 10,
    });
    expect(normalizeAttentionPagination({ page: -1, pageSize: 999 })).toEqual({
      page: 1,
      pageSize: 25,
      offset: 0,
      limit: 25,
    });
  });
});
