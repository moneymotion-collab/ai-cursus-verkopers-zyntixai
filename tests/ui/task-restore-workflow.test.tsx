import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { restoreTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
import { TaskRestoreForm } from "@/features/tasks/ui/task-restore-form";
import { interpretTaskMutationResult } from "@/features/tasks/ui/task-form-state";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/tasks/actions/lifecycle-task-actions", () => ({
  completeTaskAction: vi.fn(),
  cancelTaskAction: vi.fn(),
  archiveTaskAction: vi.fn(),
  restoreTaskAction: vi.fn(),
}));

const task: TaskReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  title: "Prepare onboarding",
  description: null,
  status: "completed",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: null,
  createdByMemberId: "33333333-3333-4333-8333-333333333333",
  linkedContext: { kind: "lead", leadId: "44444444-4444-4444-8444-444444444444" },
  predecessorTaskId: null,
  archivedAt: "2026-07-17T08:00:00.000Z",
  completedAt: "2026-07-16T08:00:00.000Z",
  cancelledAt: null,
  createdAt: "2026-07-10T08:00:00.000Z",
  updatedAt: "2026-07-10T08:00:00.000Z",
  derived: {
    terminal: true,
    archived: true,
    overdue: false,
    dueToday: false,
    upcoming: false,
    dueState: "upcoming",
  },
};

const listState = {
  org: "22222222-2222-4222-8222-222222222222",
  status: "completed" as const,
  archived: true,
  page: 1,
  pageSize: 25,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TaskRestoreForm", () => {
  it("renders restore confirmation without reopen wording", () => {
    const html = renderToStaticMarkup(
      <TaskRestoreForm
        organizationId={task.organizationId}
        task={task}
        listState={listState}
        timeZone="UTC"
        assigneeLabel={null}
        backHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Restore from archive");
    expect(html).toContain("does not reopen");
    expect(html.toLowerCase()).not.toContain("reopen task");
    expect(restoreTaskAction).not.toHaveBeenCalled();
  });

  it("maps linked entity archived to safe restore message", () => {
    const result = interpretTaskMutationResult(
      {
        ok: false,
        committed: false,
        error: {
          code: "LINKED_ENTITY_ARCHIVED",
          message: "raw internal",
          retryable: false,
          category: "validation",
        },
      },
      { lifecycleOperation: "restore" },
    );
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("linked record is no longer available");
      expect(result.message).not.toContain("raw");
    }
  });

  it("maps restore success with list refresh only", () => {
    const result = interpretTaskMutationResult({
      ok: true,
      taskId: task.id,
      task: {} as never,
      committed: true,
      refreshRequired: false,
      refreshHints: { task: true, taskLists: true, taskHistory: false },
    });
    expect(result).toMatchObject({
      kind: "success",
      refreshLists: true,
      refreshHistory: false,
    });
  });

  it("maps committed refresh failure with restore-specific wording", () => {
    const result = interpretTaskMutationResult(
      {
        ok: false,
        committed: true,
        taskId: task.id,
        refreshHints: { task: true, taskLists: true, taskHistory: false },
        error: {
          code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
          message: "raw",
          retryable: false,
          category: "server",
          refreshRequired: true,
        },
      },
      { lifecycleOperation: "restore" },
    );
    expect(result.kind).toBe("reload_required");
    if (result.kind === "reload_required") {
      expect(result.message).toContain("was restored");
    }
  });
});
