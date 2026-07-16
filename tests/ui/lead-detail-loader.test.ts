import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadLeadDetailPage } from "@/features/leads/ui/load-lead-detail";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import {
  getLeadById,
  listLeadRelatedTasks,
  listLeadStageHistory,
  listLeadStatusHistory,
} from "@/features/leads/server/lead-read-queries";
import { resolveLeadPageOrganization } from "@/features/leads/server/resolve-lead-page-organization";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";

const sampleLead: LeadDetailReadModel = {
  id: LEAD_ID,
  organizationId: ORG_ID,
  displayName: "Prospect Co",
  firstName: "Pat",
  lastName: "Prospect",
  email: "ops@prospect.test",
  phone: "+1",
  status: "open",
  statusLabel: "Open",
  ownerMemberId: null,
  ownerLabel: "Unassigned",
  createdByMemberId: null,
  createdByLabel: "System",
  stage: {
    stageId: "44444444-4444-4444-8444-444444444444",
    name: "New",
    position: 0,
    stageCategory: "new",
    stageCategoryLabel: "New",
    isDefault: true,
  },
  sourceType: "manual",
  sourceDetail: null,
  pursuitLabel: null,
  convertedCustomer: null,
  archivedAt: null,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  derived: {
    isArchived: false,
    isConverted: false,
    isConvertible: true,
    allowedStatusTransitions: ["lost", "disqualified"],
  },
};

vi.mock("@/features/leads/server/resolve-lead-page-organization", () => ({
  resolveLeadPageOrganization: vi.fn(),
}));

vi.mock("@/features/leads/server/lead-read-queries", () => ({
  getLeadById: vi.fn(),
  listLeadStatusHistory: vi.fn(),
  listLeadStageHistory: vi.fn(),
  listLeadRelatedTasks: vi.fn(),
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

const pageOrgMock = vi.mocked(resolveLeadPageOrganization);
const getLeadByIdMock = vi.mocked(getLeadById);
const statusHistoryMock = vi.mocked(listLeadStatusHistory);
const stageHistoryMock = vi.mocked(listLeadStageHistory);
const relatedTasksMock = vi.mocked(listLeadRelatedTasks);

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
  getLeadByIdMock.mockResolvedValue({ ok: true, data: sampleLead });
  statusHistoryMock.mockResolvedValue({ ok: true, data: [] });
  stageHistoryMock.mockResolvedValue({ ok: true, data: [] });
  relatedTasksMock.mockResolvedValue({
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

describe("loadLeadDetailPage", () => {
  it("returns unavailable for invalid lead id without leaking existence", async () => {
    const result = await loadLeadDetailPage(createSupabase(), "not-a-uuid", { org: ORG_ID });
    expect(result.kind).toBe("lead_unavailable");
    expect(getLeadByIdMock).not.toHaveBeenCalled();
  });

  it("loads detail panels for accessible leads", async () => {
    const result = await loadLeadDetailPage(createSupabase(), LEAD_ID, { org: ORG_ID });
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.data.lead.displayName).toBe("Prospect Co");
      expect(result.data.statusHistoryState.kind).toBe("empty");
      expect(result.data.stageHistoryState.kind).toBe("empty");
      expect(result.data.relatedTasksState.kind).toBe("empty");
    }
  });

  it("returns unavailable when lead read fails with permission-safe error", async () => {
    getLeadByIdMock.mockResolvedValue({
      ok: false,
      error: {
        code: "LEAD_UNAVAILABLE",
        message: "Lead unavailable",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await loadLeadDetailPage(createSupabase(), LEAD_ID, { org: ORG_ID });
    expect(result.kind).toBe("lead_unavailable");
  });
});
