import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadCustomerDetailPage } from "@/features/customers/ui/load-customer-detail";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import {
  getCustomerById,
  listCustomerEnrollmentSummaries,
  listCustomerStatusHistory,
} from "@/features/customers/server/customer-read-queries";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import { listTasksForCustomer } from "@/features/tasks/server/task-read-queries";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

const sampleCustomer: CustomerDetailReadModel = {
  id: CUSTOMER_ID,
  organizationId: ORG_ID,
  displayName: "Acme Corp",
  firstName: "Acme",
  lastName: "Corp",
  email: "ops@acme.test",
  phone: "+1",
  status: "active" as const,
  statusLabel: "Active",
  ownerMemberId: MEMBER_ID,
  ownerLabel: "Taylor Owner",
  createdByMemberId: MEMBER_ID,
  createdByLabel: "Taylor Owner",
  startedAt: "2026-07-14T10:00:00.000Z",
  endedAt: null,
  archivedAt: null,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  derived: {
    isArchived: false,
    allowedTransitions: ["paused", "completed", "cancelled", "churned"],
  },
};

vi.mock("@/features/customers/server/resolve-customer-page-organization", () => ({
  resolveCustomerPageOrganization: vi.fn(),
}));

vi.mock("@/features/customers/server/customer-read-queries", () => ({
  getCustomerById: vi.fn(),
  listCustomerStatusHistory: vi.fn(),
  listCustomerEnrollmentSummaries: vi.fn(),
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
  resolveMemberLabel: vi.fn(() => "Alex Morgan"),
  resolveTaskDisplayLabels: vi.fn(async () => ({
    members: {},
    leads: {},
    customers: {},
    programs: {},
  })),
}));

const pageOrgMock = vi.mocked(resolveCustomerPageOrganization);
const getCustomerByIdMock = vi.mocked(getCustomerById);
const historyMock = vi.mocked(listCustomerStatusHistory);
const enrollmentMock = vi.mocked(listCustomerEnrollmentSummaries);
const tasksMock = vi.mocked(listTasksForCustomer);

function createSupabase() {
  return {} as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue({
    kind: "ready",
    organizationId: ORG_ID,
    organizationName: "Org Alpha",
    organizationOptions: [{ organizationId: ORG_ID, role: "staff", displayName: "Org Alpha" }],
    role: "staff",
    timezone: "UTC",
    isMultiOrganization: false,
  });
  getCustomerByIdMock.mockResolvedValue({ ok: true, data: sampleCustomer });
  historyMock.mockResolvedValue({ ok: true, data: [] });
  enrollmentMock.mockResolvedValue({ ok: true, data: [] });
  tasksMock.mockResolvedValue({
    ok: true,
    data: {
      items: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    },
  });
});

describe("loadCustomerDetailPage", () => {
  it("returns unavailable for invalid customer IDs", async () => {
    const result = await loadCustomerDetailPage(createSupabase(), "bad-id", { org: ORG_ID });
    expect(result.kind).toBe("customer_unavailable");
    expect(getCustomerByIdMock).not.toHaveBeenCalled();
  });

  it("treats archived customers as unavailable for staff", async () => {
    getCustomerByIdMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...sampleCustomer,
        archivedAt: "2026-07-14T12:00:00.000Z",
        derived: { isArchived: true, allowedTransitions: [] },
      },
    });

    const result = await loadCustomerDetailPage(createSupabase(), CUSTOMER_ID, { org: ORG_ID });
    expect(result.kind).toBe("customer_unavailable");
    expect(historyMock).not.toHaveBeenCalled();
  });

  it("keeps identity visible when history panel fails", async () => {
    historyMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "history failed",
        retryable: true,
        category: "server",
      },
    });

    const result = await loadCustomerDetailPage(createSupabase(), CUSTOMER_ID, { org: ORG_ID });
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.data.customer.displayName).toBe("Acme Corp");
      expect(result.data.historyState.kind).toBe("error");
    }
  });

  it("maps foreign and missing customers to the same unavailable state", async () => {
    getCustomerByIdMock.mockResolvedValue({
      ok: false,
      error: {
        code: "CUSTOMER_UNAVAILABLE",
        message: "Customer not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const missing = await loadCustomerDetailPage(createSupabase(), CUSTOMER_ID, { org: ORG_ID });
    expect(missing.kind).toBe("customer_unavailable");
  });
});
