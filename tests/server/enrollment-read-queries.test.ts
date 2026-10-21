import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getEnrollmentById,
  listEnrollments,
  listEnrollmentStatusHistory,
} from "@/features/enrollments/server/enrollment-read-queries";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  USER_ID,
} from "../helpers/enrollment-test-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

type QueryResult = { data?: unknown; error?: unknown; count?: number | null };

function createChainableQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of [
    "eq",
    "is",
    "in",
    "or",
    "order",
    "ilike",
    "limit",
    "range",
    "maybeSingle",
  ]) {
    builder[method] = vi.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

type MockOptions = {
  enrollmentsList?: QueryResult;
  enrollmentDetail?: QueryResult;
  enrollmentHistory?: QueryResult;
  customerSearchIds?: QueryResult;
  programSearchIds?: QueryResult;
  customerLabels?: QueryResult;
  programLabels?: QueryResult;
  customerSummary?: QueryResult;
  programSummary?: QueryResult;
};

function createEnrollmentReadMockSupabase(options: MockOptions = {}) {
  const builders = {
    enrollmentsList: createChainableQuery(
      options.enrollmentsList ?? { data: [], count: 0, error: null },
    ),
    enrollmentDetail: createChainableQuery(
      options.enrollmentDetail ?? { data: null, error: null },
    ),
    enrollmentHistory: createChainableQuery(
      options.enrollmentHistory ?? { data: [], error: null },
    ),
    customerSearch: createChainableQuery(
      options.customerSearchIds ?? { data: [], error: null },
    ),
    programSearch: createChainableQuery(
      options.programSearchIds ?? { data: [], error: null },
    ),
    customerLabels: createChainableQuery(
      options.customerLabels ?? { data: [], error: null },
    ),
    programLabels: createChainableQuery(
      options.programLabels ?? { data: [], error: null },
    ),
    customerSummary: createChainableQuery(
      options.customerSummary ?? { data: null, error: null },
    ),
    programSummary: createChainableQuery(
      options.programSummary ?? { data: null, error: null },
    ),
  };

  const from = vi.fn((table: string) => {
    if (table === "enrollments") {
      return {
        select: vi.fn((_columns: string, opts?: { count?: string }) => {
          if (opts?.count === "exact") {
            return builders.enrollmentsList;
          }
          return builders.enrollmentDetail;
        }),
      };
    }

    if (table === "enrollment_status_history") {
      return { select: vi.fn(() => builders.enrollmentHistory) };
    }

    if (table === "customers") {
      return {
        select: vi.fn((columns: string) => {
          if (columns === "id") return builders.customerSearch;
          if (columns === "id, display_name") return builders.customerLabels;
          return builders.customerSummary;
        }),
      };
    }

    if (table === "programs") {
      return {
        select: vi.fn((columns: string) => {
          if (columns === "id") return builders.programSearch;
          if (columns === "id, name") return builders.programLabels;
          return builders.programSummary;
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    builders,
    from,
  };
}

function mockOrgRole(role: "owner" | "admin" | "staff" | "viewer") {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role,
      userId: USER_ID,
    },
  });
}

const rawListRow = {
  id: ENROLLMENT_ID,
  organization_id: ORG_ID,
  customer_id: CUSTOMER_ID,
  program_id: PROGRAM_ID,
  status: "active",
  owner_member_id: MEMBER_ID,
  enrolled_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-14T12:00:00.000Z",
  archived_at: null,
};

const rawDetailRow = {
  id: ENROLLMENT_ID,
  organization_id: ORG_ID,
  customer_id: CUSTOMER_ID,
  program_id: PROGRAM_ID,
  status: "active",
  owner_member_id: MEMBER_ID,
  created_by_member_id: MEMBER_ID,
  enrolled_at: "2026-07-01T10:00:00.000Z",
  started_at: "2026-07-01T10:00:00.000Z",
  completed_at: null,
  cancelled_at: null,
  source: "manual",
  metadata: {},
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-14T12:00:00.000Z",
  archived_at: null,
};

const archivedDetailRow = {
  ...rawDetailRow,
  status: "completed",
  archived_at: "2026-07-20T09:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockOrgRole("staff");
});

describe("listEnrollments", () => {
  it("returns paginated items scoped to the organization with customer/program labels", async () => {
    const { supabase, builders } = createEnrollmentReadMockSupabase({
      enrollmentsList: { data: [rawListRow], count: 1, error: null },
      customerLabels: {
        data: [{ id: CUSTOMER_ID, display_name: "Acme Corp" }],
        error: null,
      },
      programLabels: {
        data: [{ id: PROGRAM_ID, name: "Growth Lab" }],
        error: null,
      },
    });

    const result = await listEnrollments({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.customerDisplayName).toBe("Acme Corp");
    expect(result.data.items[0]?.programName).toBe("Growth Lab");
    expect(result.data.pagination.total).toBe(1);
    expect(builders.enrollmentsList.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(builders.enrollmentsList.is).toHaveBeenCalledWith("archived_at", null);
  });

  it("returns empty success for zero rows", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentsList: { data: [], count: 0, error: null },
    });

    const result = await listEnrollments({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toEqual([]);
    expect(result.data.pagination.total).toBe(0);
  });

  it("normalizes underlying query failures without leaking internals", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentsList: { data: null, count: null, error: new Error("fetch failed") },
    });

    const result = await listEnrollments({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NETWORK_ERROR");
    expect(result.error.message).not.toMatch(/fetch failed/i);
  });

  it("denies list access when organization membership cannot be resolved", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const { supabase } = createEnrollmentReadMockSupabase();
    const result = await listEnrollments({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
  });

  it("rejects malformed queries before touching the database", async () => {
    const { supabase, from } = createEnrollmentReadMockSupabase();

    const badOrg = await listEnrollments({ supabase, organizationId: "not-a-uuid" });
    expect(badOrg.ok).toBe(false);
    if (!badOrg.ok) expect(badOrg.error.code).toBe("INVALID_INPUT");

    const badPagination = await listEnrollments({
      supabase,
      organizationId: ORG_ID,
      pagination: { pageSize: 101 },
    });
    expect(badPagination.ok).toBe(false);
    if (!badPagination.ok) expect(badPagination.error.code).toBe("INVALID_INPUT");

    expect(from).not.toHaveBeenCalled();
  });

  it("forces archived_at is null for staff even when includeArchived is requested", async () => {
    const { supabase, builders } = createEnrollmentReadMockSupabase({
      enrollmentsList: { data: [], count: 0, error: null },
    });

    await listEnrollments({
      supabase,
      organizationId: ORG_ID,
      filters: { includeArchived: true },
    });

    expect(builders.enrollmentsList.is).toHaveBeenCalledWith("archived_at", null);
  });

  it("forces archived_at is null for viewer even when includeArchived is requested", async () => {
    mockOrgRole("viewer");
    const { supabase, builders } = createEnrollmentReadMockSupabase({
      enrollmentsList: { data: [], count: 0, error: null },
    });

    await listEnrollments({
      supabase,
      organizationId: ORG_ID,
      filters: { includeArchived: true },
    });

    expect(builders.enrollmentsList.is).toHaveBeenCalledWith("archived_at", null);
  });

  it("allows owner/admin to bypass the archived_at filter when includeArchived is true", async () => {
    for (const role of ["owner", "admin"] as const) {
      mockOrgRole(role);
      const { supabase, builders } = createEnrollmentReadMockSupabase({
        enrollmentsList: { data: [], count: 0, error: null },
      });

      await listEnrollments({
        supabase,
        organizationId: ORG_ID,
        filters: { includeArchived: true },
      });

      expect(builders.enrollmentsList.is).not.toHaveBeenCalled();
    }
  });
});

describe("getEnrollmentById", () => {
  it("returns detail with customer and program summaries", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: rawDetailRow, error: null },
      customerSummary: {
        data: {
          id: CUSTOMER_ID,
          display_name: "Acme Corp",
          status: "active",
          archived_at: null,
        },
        error: null,
      },
      programSummary: {
        data: { id: PROGRAM_ID, name: "Growth Lab", status: "active", archived_at: null },
        error: null,
      },
    });

    const result = await getEnrollmentById({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.customer?.displayName).toBe("Acme Corp");
    expect(result.data.program?.name).toBe("Growth Lab");
    expect(result.data.derived.allowedTransitions).toEqual([
      "paused",
      "completed",
      "cancelled",
    ]);
  });

  it("returns ENROLLMENT_UNAVAILABLE for a missing row", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: null, error: null },
    });

    const result = await getEnrollmentById({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
  });

  it("collapses foreign/permission-denied archived access to the same ENROLLMENT_UNAVAILABLE code", async () => {
    mockOrgRole("staff");
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: archivedDetailRow, error: null },
    });

    const result = await getEnrollmentById({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
    expect(result.error.message).not.toMatch(/archived/i);
  });

  it("rejects malformed enrollment ids before querying", async () => {
    const { supabase, from } = createEnrollmentReadMockSupabase();

    const result = await getEnrollmentById({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: "not-a-uuid",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_INPUT");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("listEnrollmentStatusHistory", () => {
  it("returns ordered status history for an accessible enrollment", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: rawDetailRow, error: null },
      enrollmentHistory: {
        data: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            organization_id: ORG_ID,
            enrollment_id: ENROLLMENT_ID,
            from_status: "pending",
            to_status: "active",
            changed_by_member_id: MEMBER_ID,
            reason: null,
            source: "manual",
            changed_at: "2026-07-01T10:00:00.000Z",
          },
        ],
        error: null,
      },
    });

    const result = await listEnrollmentStatusHistory({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.toStatusLabel).toBe("Active");
  });

  it("suppresses history when the enrollment itself is unavailable", async () => {
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: null, error: null },
    });

    const result = await listEnrollmentStatusHistory({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
  });

  it("denies history visibility for staff on an archived enrollment", async () => {
    mockOrgRole("staff");
    const { supabase } = createEnrollmentReadMockSupabase({
      enrollmentDetail: { data: archivedDetailRow, error: null },
    });

    const result = await listEnrollmentStatusHistory({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
  });

  it("rejects malformed queries before touching the database", async () => {
    const { supabase, from } = createEnrollmentReadMockSupabase();

    const result = await listEnrollmentStatusHistory({
      supabase,
      organizationId: ORG_ID,
      enrollmentId: "not-a-uuid",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_INPUT");
    expect(from).not.toHaveBeenCalled();
  });
});
