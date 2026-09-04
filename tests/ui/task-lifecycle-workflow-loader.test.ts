import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { Database } from "@/types/database";
import {
  loadTaskArchivePage,
  loadTaskCancelPage,
  loadTaskCompletePage,
  loadTaskRestorePage,
} from "@/features/tasks/ui/load-task-lifecycle-workflow-page";
import { getTaskById } from "@/features/tasks/server/task-read-queries";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";
import {
  canShowArchiveWorkflow,
  canShowCancelWorkflow,
  canShowCompleteWorkflow,
  canShowRestoreWorkflow,
} from "@/features/tasks/ui/task-workflow-visibility";

const ORG_A = "02016e91-7237-4a20-aec3-6275d2e8a67f";
const ORG_B = "e6e4c376-697c-4863-bb30-fd52b7256ff9";
const TASK_ID = "11111111-1111-4111-8111-111111111111";

const openTask: TaskReadModel = {
  id: TASK_ID,
  organizationId: ORG_A,
  title: "Prepare onboarding",
  description: null,
  status: "open",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: null,
  createdByMemberId: "33333333-3333-4333-8333-333333333333",
  linkedContext: { kind: "lead", leadId: "44444444-4444-4444-8444-444444444444" },
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
    dueState: "upcoming",
  },
};

vi.mock("@/features/tasks/ui/resolve-task-page-organization", () => ({
  resolveTaskPageOrganization: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  getTaskById: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveTaskPageOrganization);
const getTaskByIdMock = vi.mocked(getTaskById);

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

function completedTask(): TaskReadModel {
  return {
    ...openTask,
    status: "completed",
    completedAt: "2026-07-16T08:00:00.000Z",
    derived: { ...openTask.derived, terminal: true },
  };
}

function archivedCompletedTask(): TaskReadModel {
  return {
    ...completedTask(),
    archivedAt: "2026-07-17T08:00:00.000Z",
    derived: { ...completedTask().derived, archived: true },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("staff"));
  getTaskByIdMock.mockResolvedValue({ ok: true, data: openTask });
});

describe("loadTaskLifecycleWorkflowPage", () => {
  it("returns auth_required without querying tasks", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadTaskCompletePage(createSupabase(), TASK_ID, {}, canShowCompleteWorkflow);
    expect(result.kind).toBe("auth_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_unavailable without querying tasks", async () => {
    pageOrgMock.mockResolvedValue({ kind: "organization_unavailable" });
    const result = await loadTaskCancelPage(createSupabase(), TASK_ID, {}, canShowCancelWorkflow);
    expect(result.kind).toBe("organization_unavailable");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_required for multi-org without selection", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskArchivePage(createSupabase(), TASK_ID, {}, canShowArchiveWorkflow);
    expect(result.kind).toBe("organization_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("returns organization_required for invalid org without task query", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskRestorePage(
      createSupabase(),
      TASK_ID,
      { org: "00000000-0000-4000-8000-000000000001" },
      canShowRestoreWorkflow,
    );
    expect(result.kind).toBe("organization_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("maps invalid task UUID without query", async () => {
    const result = await loadTaskCompletePage(createSupabase(), "bad-id", {}, canShowCompleteWorkflow);
    expect(result.kind).toBe("invalid_task");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });

  it("maps missing task to task_unavailable", async () => {
    getTaskByIdMock.mockResolvedValue({
      ok: false,
      error: {
        code: "TASK_NOT_FOUND",
        message: "hidden",
        retryable: false,
        category: "not_found",
      },
    });
    const result = await loadTaskCancelPage(createSupabase(), TASK_ID, {}, canShowCancelWorkflow);
    expect(result.kind).toBe("task_unavailable");
  });

  it("returns action_unavailable when complete is not eligible", async () => {
    getTaskByIdMock.mockResolvedValue({ ok: true, data: completedTask() });
    const result = await loadTaskCompletePage(createSupabase(), TASK_ID, {}, canShowCompleteWorkflow);
    expect(result.kind).toBe("action_unavailable");
    if (result.kind === "action_unavailable") {
      expect(result.message).toContain("cannot be completed");
      expect(result.backHref).toContain(TASK_ID);
    }
  });

  it("returns action_unavailable when archive is not eligible for open tasks", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    const result = await loadTaskArchivePage(createSupabase(), TASK_ID, {}, canShowArchiveWorkflow);
    expect(result.kind).toBe("action_unavailable");
  });

  it("returns action_unavailable when staff attempts archive", async () => {
    getTaskByIdMock.mockResolvedValue({ ok: true, data: completedTask() });
    const result = await loadTaskArchivePage(createSupabase(), TASK_ID, {}, canShowArchiveWorkflow);
    expect(result.kind).toBe("action_unavailable");
  });

  it("returns ready for owner archive on terminal task", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    getTaskByIdMock.mockResolvedValue({ ok: true, data: completedTask() });
    const result = await loadTaskArchivePage(createSupabase(), TASK_ID, {}, canShowArchiveWorkflow);
    expect(result.kind).toBe("ready");
  });

  it("returns ready for owner restore on archived terminal task", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("admin"));
    getTaskByIdMock.mockResolvedValue({ ok: true, data: archivedCompletedTask() });
    const result = await loadTaskRestorePage(createSupabase(), TASK_ID, {}, canShowRestoreWorkflow);
    expect(result.kind).toBe("ready");
  });

  it("returns action_unavailable when restore requested for non-archived task", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    getTaskByIdMock.mockResolvedValue({ ok: true, data: completedTask() });
    const result = await loadTaskRestorePage(createSupabase(), TASK_ID, {}, canShowRestoreWorkflow);
    expect(result.kind).toBe("action_unavailable");
  });
});
