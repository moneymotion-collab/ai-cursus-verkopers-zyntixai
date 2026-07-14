import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { cancelTaskAction, completeTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
import { TaskCancelForm } from "@/features/tasks/ui/task-cancel-form";
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

const listState = {
  org: "22222222-2222-4222-8222-222222222222",
  status: "open" as const,
  archived: false,
  page: 1,
  pageSize: 25,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TaskCancelForm", () => {
  it("renders required cancellation reason with accessible association", () => {
    const html = renderToStaticMarkup(
      <TaskCancelForm
        organizationId={task.organizationId}
        task={task}
        listState={listState}
        timeZone="UTC"
        assigneeLabel={null}
        backHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Cancel task");
    expect(html).toContain("Cancellation reason");
    expect(html).toContain('id="cancel-reason"');
    expect(html).not.toContain("completionNote");
    expect(cancelTaskAction).not.toHaveBeenCalled();
    expect(completeTaskAction).not.toHaveBeenCalled();
  });

  it("maps committed refresh failure with cancel-specific wording", () => {
    const result = interpretTaskMutationResult(
      {
        ok: false,
        committed: true,
        taskId: task.id,
        refreshHints: { task: true, taskLists: true, taskHistory: true },
        error: {
          code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
          message: "raw",
          retryable: false,
          category: "server",
          refreshRequired: true,
        },
      },
      { lifecycleOperation: "cancel" },
    );
    expect(result.kind).toBe("reload_required");
    if (result.kind === "reload_required") {
      expect(result.message).toContain("was cancelled");
    }
  });

  it("maps invalid state to reload required without retry", () => {
    const result = interpretTaskMutationResult({
      ok: false,
      committed: false,
      error: {
        code: "INVALID_STATE_TRANSITION",
        message: "raw",
        retryable: false,
        category: "validation",
      },
    });
    expect(result.kind).toBe("reload_required");
    if (result.kind === "reload_required") {
      expect(result.committed).toBe(false);
      expect(result.message).toContain("must be reloaded");
    }
  });
});
