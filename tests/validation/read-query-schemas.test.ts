import { describe, expect, it } from "vitest";
import {
  MAX_TASK_PAGE_SIZE,
  DEFAULT_TASK_PAGE_SIZE,
} from "@/features/tasks/domain/read-types";
import {
  normalizePagination,
  taskListQuerySchema,
  validateTaskIdQuery,
  validateTaskListQuery,
} from "@/features/tasks/validation/read-query-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";
const CUSTOMER_ID = "44444444-4444-4444-8444-444444444444";

describe("taskListQuerySchema", () => {
  it("accepts valid default filter", () => {
    const parsed = validateTaskListQuery({
      organizationId: ORG_ID,
      filters: {},
      pagination: {},
      sort: {},
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pagination.pageSize).toBe(DEFAULT_TASK_PAGE_SIZE);
      expect(parsed.data.filters.includeArchived).toBe(false);
    }
  });

  it("accepts maximum allowed page size", () => {
    const parsed = validateTaskListQuery({
      organizationId: ORG_ID,
      pagination: { pageSize: MAX_TASK_PAGE_SIZE },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.pagination.pageSize).toBe(MAX_TASK_PAGE_SIZE);
    }
  });

  it("rejects excessive page size", () => {
    const parsed = validateTaskListQuery({
      organizationId: ORG_ID,
      pagination: { pageSize: MAX_TASK_PAGE_SIZE + 1 },
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects negative page via normalizePagination fallback", () => {
    const normalized = normalizePagination({ page: -1, pageSize: 10 });
    expect(normalized.page).toBe(1);
    expect(normalized.offset).toBe(0);
  });

  it("rejects malformed UUID", () => {
    const parsed = validateTaskIdQuery({
      organizationId: "bad-id",
      taskId: TASK_ID,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const parsed = taskListQuerySchema.safeParse({
      organizationId: ORG_ID,
      filters: { status: "reopened" },
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects incompatible context filters", () => {
    const parsed = validateTaskListQuery({
      organizationId: ORG_ID,
      filters: {
        leadId: LEAD_ID,
        customerId: CUSTOMER_ID,
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("validateTaskIdQuery", () => {
  it("accepts valid task id query", () => {
    const parsed = validateTaskIdQuery({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(parsed.success).toBe(true);
  });
});
