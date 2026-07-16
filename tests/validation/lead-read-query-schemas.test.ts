import { describe, expect, it } from "vitest";
import {
  escapeLeadIlikePattern,
  normalizeLeadPagination,
  validateLeadIdQuery,
  validateLeadListQuery,
} from "@/features/leads/validation/read-query-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";

describe("lead read query schemas", () => {
  it("applies list defaults", () => {
    const parsed = validateLeadListQuery({ organizationId: ORG_ID });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pagination.page).toBe(1);
      expect(parsed.data.pagination.pageSize).toBe(25);
      expect(parsed.data.sort.field).toBe("display_name");
      expect(parsed.data.filters.includeArchived).toBe(false);
    }
  });

  it("rejects unknown fields", () => {
    const parsed = validateLeadListQuery({
      organizationId: ORG_ID,
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("enforces page size maximum and invalid pagination", () => {
    expect(
      validateLeadListQuery({
        organizationId: ORG_ID,
        pagination: { pageSize: 101 },
      }).success,
    ).toBe(false);

    expect(
      validateLeadListQuery({
        organizationId: ORG_ID,
        pagination: { page: 0 },
      }).success,
    ).toBe(false);
  });

  it("accepts bounded search, status, stage, and owner filters", () => {
    const parsed = validateLeadListQuery({
      organizationId: ORG_ID,
      filters: {
        search: "  prospect ",
        status: ["open", "lost"],
        stageId: STAGE_ID,
        ownerMemberId: MEMBER_ID,
        includeArchived: true,
      },
      sort: { field: "updated_at", direction: "desc" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown statuses and malformed archived visibility", () => {
    expect(
      validateLeadListQuery({
        organizationId: ORG_ID,
        filters: { status: "active" },
      }).success,
    ).toBe(false);

    expect(
      validateLeadListQuery({
        organizationId: ORG_ID,
        filters: { includeArchived: "yes" },
      }).success,
    ).toBe(false);
  });

  it("rejects invalid UUIDs", () => {
    expect(validateLeadIdQuery({ organizationId: "bad", leadId: LEAD_ID }).success).toBe(false);
    expect(validateLeadIdQuery({ organizationId: ORG_ID, leadId: "bad" }).success).toBe(false);
  });

  it("normalizes pagination and escapes ilike metacharacters", () => {
    expect(normalizeLeadPagination({ page: 2, pageSize: 10 })).toEqual({
      page: 2,
      pageSize: 10,
      offset: 10,
      limit: 10,
    });
    expect(escapeLeadIlikePattern("100%_\\")).toBe("100\\%\\_\\\\");
  });
});
