import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadTaskDetailPage } from "@/features/tasks/ui/load-task-detail";
import { getTaskById, getTaskStatusHistory } from "@/features/tasks/server/task-read-queries";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";
import { resolveTaskDisplayLabels } from "@/features/tasks/ui/resolve-task-display-labels";

const ORG_A = "02016e91-7237-4a20-aec3-6275d2e8a67f";
const ORG_B = "e6e4c376-697c-4863-bb30-fd52b7256ff9";
const TASK_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

const sampleTask = {
  id: TASK_ID,
  organizationId: ORG_A,
  title: "Prepare onboarding",
  description: "Checklist",
  status: "open" as const,
  taskType: "general" as const,
  priority: "normal" as const,
  source: "manual" as const,
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: MEMBER_ID,
  createdByMemberId: MEMBER_ID,
  linkedContext: { kind: "lead" as const, leadId: "44444444-4444-4444-8444-444444444444" },
  predecessorTaskId: null,
  archivedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-07-10T08:00:00.000Z",
  updatedAt: "2026-07-10T08:00:00.000Z",
  derived: {
    terminal: false,
    archived: false,
    overdue: false,
    dueToday: false,
    upcoming: true,
    dueState: "upcoming" as const,
  },
};

vi.mock("@/features/tasks/ui/resolve-task-page-organization", () => ({
  resolveTaskPageOrganization: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  getTaskById: vi.fn(),
  getTaskStatusHistory: vi.fn(),
}));

vi.mock("@/features/tasks/ui/resolve-task-display-labels", () => ({
  collectLabelReferencesFromTaskDetail: vi.fn(() => ({
    memberIds: [MEMBER_ID],
    leadIds: [],
    customerIds: [],
    programIds: [],
  })),
  emptyLabelBundle: vi.fn(() => ({ members: {}, leads: {}, customers: {}, programs: {} })),
  resolveCustomerLabel: vi.fn(),
  resolveLeadLabel: vi.fn(),
  resolveLinkedContextLabel: vi.fn(() => "Linked lead"),
  resolveMemberLabel: vi.fn(() => "Alex Morgan"),
  resolveProgramLabel: vi.fn(),
  resolveTaskDisplayLabels: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveTaskPageOrganization);
const getTaskByIdMock = vi.mocked(getTaskById);
const getTaskStatusHistoryMock = vi.mocked(getTaskStatusHistory);
const resolveLabelsMock = vi.mocked(resolveTaskDisplayLabels);

const organizationOptions = [
  { organizationId: ORG_A, role: "staff" as const, displayName: "Org Alpha" },
  { organizationId: ORG_B, role: "owner" as const, displayName: "Org Beta" },
];

function createSupabase() {
  return {} as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "staff") {
  return {
    kind: "ready" as const,
    organizationId: ORG_A,
    organizationOptions,
    role,
    timeZone: "UTC",
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("staff"));
  getTaskByIdMock.mockResolvedValue({ ok: true, data: sampleTask });
  getTaskStatusHistoryMock.mockResolvedValue({
    ok: true,
    data: [
      {
        id: "hist-1",
        organizationId: ORG_A,
        taskId: TASK_ID,
        fromStatus: null,
        toStatus: "open",
        changedByMemberId: MEMBER_ID,
        reason: null,
        source: "manual",
        createdAt: "2026-07-10T08:00:00.000Z",
      },
    ],
  });
  resolveLabelsMock.mockResolvedValue({
    members: { [MEMBER_ID]: "Alex Morgan" },
    leads: {},
    customers: {},
    programs: {},
  });
});

describe("loadTaskDetailPage", () => {
  it("returns auth_required without querying tasks when unauthenticated", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(result.kind).toBe("auth_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_unavailable without querying tasks when no memberships", async () => {
    pageOrgMock.mockResolvedValue({ kind: "organization_unavailable" });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(result.kind).toBe("organization_unavailable");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_required for multi-org without selection without task query", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(result.kind).toBe("organization_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_required for multi-org invalid selection without task query", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {
      org: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.kind).toBe("organization_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("calls getTaskById once for valid organization context", async () => {
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, { org: ORG_A });
    expect(result.kind).toBe("ready");
    expect(getTaskByIdMock).toHaveBeenCalledTimes(1);
  });

  it("maps invalid task UUID to task_unavailable", async () => {
    const result = await loadTaskDetailPage(createSupabase(), "not-a-uuid", {});
    expect(result.kind).toBe("task_unavailable");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("maps TASK_NOT_FOUND to task_unavailable", async () => {
    getTaskByIdMock.mockResolvedValue({
      ok: false,
      error: {
        code: "TASK_NOT_FOUND",
        message: "Task not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(result.kind).toBe("task_unavailable");
    expect(getTaskStatusHistoryMock).not.toHaveBeenCalled();
  });

  it("queries history only after task success", async () => {
    await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(getTaskByIdMock).toHaveBeenCalledBefore(getTaskStatusHistoryMock);
  });

  it("keeps task visible when history loading fails", async () => {
    getTaskStatusHistoryMock.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "History failed",
        retryable: false,
        category: "validation",
      },
    });
    const result = await loadTaskDetailPage(createSupabase(), TASK_ID, {});
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.data.historyState.kind).toBe("error");
    }
  });
});
