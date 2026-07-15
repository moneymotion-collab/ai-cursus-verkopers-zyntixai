import { describe, expect, it } from "vitest";
import {
  getCustomerById,
  listCustomerEnrollmentSummaries,
  listCustomers,
  listCustomerStatusHistory,
} from "@/features/customers/server/customer-read-queries";
import {
  createCustomerReadMockSupabase,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  ORG_ID,
  PROGRAM_ID,
  sampleCustomerDetailRow,
  sampleCustomerListRow,
  USER_ID,
} from "../helpers/customer-read-query-mocks";

describe("listCustomers", () => {
  it("returns paginated list items with owner labels", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customersList: {
        data: [sampleCustomerListRow],
        count: 1,
        error: null,
      },
    });

    const result = await listCustomers({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].ownerLabel).toBe("Taylor Owner");
      expect(result.data.pagination.total).toBe(1);
    }
  });

  it("allows owner archived list requests to succeed", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "owner",
      customersList: { data: [sampleCustomerListRow], count: 1, error: null },
    });

    const result = await listCustomers({
      supabase,
      organizationId: ORG_ID,
      filters: { includeArchived: true },
    });

    expect(result.ok).toBe(true);
  });

  it("returns empty success for zero rows", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customersList: { data: [], count: 0, error: null },
    });

    const result = await listCustomers({
      supabase,
      organizationId: ORG_ID,
      filters: { search: "missing" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toEqual([]);
      expect(result.data.pagination.total).toBe(0);
    }
  });
});

describe("listCustomerStatusHistory", () => {
  it("returns ordered history with actor labels", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: sampleCustomerDetailRow, error: null },
      customerHistory: {
        data: [
          {
            id: "77777777-7777-4777-8777-777777777777",
            organization_id: ORG_ID,
            customer_id: CUSTOMER_ID,
            from_status: "onboarding",
            to_status: "active",
            changed_by_member_id: "33333333-3333-4333-8333-333333333333",
            reason: "Started",
            source: "manual",
            changed_at: "2026-07-14T10:00:00.000Z",
          },
        ],
        error: null,
      },
    });

    const result = await listCustomerStatusHistory({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].changedByLabel).toBe("Taylor Owner");
      expect(result.data[0].toStatusLabel).toBe("Active");
    }
  });

  it("returns unavailable when customer is inaccessible", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: null, error: null },
    });

    const result = await listCustomerStatusHistory({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CUSTOMER_UNAVAILABLE");
    }
  });
});

describe("listCustomerEnrollmentSummaries", () => {
  it("returns bounded enrollment summaries with program labels", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: sampleCustomerDetailRow, error: null },
      enrollments: {
        data: [
          {
            id: ENROLLMENT_ID,
            program_id: PROGRAM_ID,
            status: "active",
            enrolled_at: "2026-07-14T10:00:00.000Z",
          },
        ],
        error: null,
      },
    });

    const result = await listCustomerEnrollmentSummaries({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].programName).toBe("Trading Foundations");
    }
  });

  it("suppresses summaries for inaccessible customers", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: null, error: null },
    });

    const result = await listCustomerEnrollmentSummaries({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CUSTOMER_UNAVAILABLE");
    }
  });
});

describe("getCustomerById detail mapping", () => {
  it("excludes metadata and includes derived transitions", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: sampleCustomerDetailRow, error: null },
    });

    const result = await getCustomerById({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty("metadata");
      expect(result.data.derived.allowedTransitions).toEqual([
        "paused",
        "completed",
        "cancelled",
        "churned",
      ]);
    }
  });
});
