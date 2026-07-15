import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadCustomersPage } from "@/features/customers/ui/load-customers-page";
import { loadCustomerDetailPage } from "@/features/customers/ui/load-customer-detail";
import { listCustomers, getCustomerById } from "@/features/customers/server/customer-read-queries";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import { loadCustomerMemberFilterOptions } from "@/features/customers/server/load-customer-member-filter-options";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";

vi.mock("@/features/customers/server/resolve-customer-page-organization", () => ({
  resolveCustomerPageOrganization: vi.fn(),
}));

vi.mock("@/features/customers/server/customer-read-queries", () => ({
  listCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  listCustomerStatusHistory: vi.fn(),
  listCustomerEnrollmentSummaries: vi.fn(),
}));

vi.mock("@/features/customers/server/load-customer-member-filter-options", () => ({
  loadCustomerMemberFilterOptions: vi.fn(async () => []),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  listTasksForCustomer: vi.fn(),
}));

vi.mock("@/features/tasks/ui/resolve-task-display-labels", () => ({
  collectLabelReferencesFromListItems: vi.fn(() => ({
    memberIds: [],
    leadIds: [],
    customerIds: [],
    programIds: [],
  })),
  emptyLabelBundle: vi.fn(() => ({ members: {}, leads: {}, customers: {}, programs: {} })),
  resolveTaskDisplayLabels: vi.fn(async () => ({
    members: {},
    leads: {},
    customers: {},
    programs: {},
  })),
}));

const pageOrgMock = vi.mocked(resolveCustomerPageOrganization);
const listCustomersMock = vi.mocked(listCustomers);
const getCustomerByIdMock = vi.mocked(getCustomerById);
const memberOptionsMock = vi.mocked(loadCustomerMemberFilterOptions);

const organizationOptions = [
  { organizationId: ORG_A, role: "staff" as const, displayName: "Org Alpha" },
  { organizationId: ORG_B, role: "owner" as const, displayName: "Org Beta" },
];

function createSupabase() {
  return {} as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue({
    kind: "ready",
    organizationId: ORG_A,
    organizationName: "Org Alpha",
    organizationOptions,
    role: "staff",
    timezone: "UTC",
    isMultiOrganization: true,
  });
  listCustomersMock.mockResolvedValue({
    ok: true,
    data: {
      items: [],
      pagination: {
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    },
  });
  memberOptionsMock.mockResolvedValue([]);
});

describe("customers UI integration", () => {
  it("does not query customers when organization selection is required", async () => {
    pageOrgMock.mockResolvedValueOnce({
      kind: "organization_required",
      organizations: organizationOptions,
    });

    const result = await loadCustomersPage(createSupabase(), {});
    expect(result.kind).toBe("organization_required");
    expect(listCustomersMock).not.toHaveBeenCalled();
    expect(memberOptionsMock).not.toHaveBeenCalled();
  });

  it("does not query customers when unauthenticated", async () => {
    pageOrgMock.mockResolvedValueOnce({ kind: "auth_required" });
    const result = await loadCustomersPage(createSupabase(), {});
    expect(result.kind).toBe("auth_required");
    expect(listCustomersMock).not.toHaveBeenCalled();
  });

  it("loads customers when organization is ready", async () => {
    const result = await loadCustomersPage(createSupabase(), { org: ORG_A });
    expect(result.kind).toBe("success");
    expect(listCustomersMock).toHaveBeenCalledOnce();
  });

  it("does not load related reads when customer is unavailable", async () => {
    const { listCustomerStatusHistory, listCustomerEnrollmentSummaries } = await import(
      "@/features/customers/server/customer-read-queries"
    );
    const { listTasksForCustomer } = await import("@/features/tasks/server/task-read-queries");

    getCustomerByIdMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "CUSTOMER_UNAVAILABLE",
        message: "Customer not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await loadCustomerDetailPage(createSupabase(), CUSTOMER_ID, { org: ORG_A });
    expect(result.kind).toBe("customer_unavailable");
    expect(listCustomerStatusHistory).not.toHaveBeenCalled();
    expect(listCustomerEnrollmentSummaries).not.toHaveBeenCalled();
    expect(listTasksForCustomer).not.toHaveBeenCalled();
  });
});
