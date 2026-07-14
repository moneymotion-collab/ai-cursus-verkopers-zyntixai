import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { completeTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
import { TaskCompleteForm } from "@/features/tasks/ui/task-complete-form";
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

describe("TaskCompleteForm", () => {
  it("renders optional completion note and explicit heading", () => {
    const html = renderToStaticMarkup(
      <TaskCompleteForm
        organizationId={task.organizationId}
        task={task}
        listState={listState}
        timeZone="UTC"
        assigneeLabel={null}
        backHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Complete task");
    expect(html).toContain("Completion note (optional)");
    expect(html).toContain('id="complete-note"');
    expect(html).not.toContain("cancelReason");
    expect(html).not.toContain("Archive task");
    expect(completeTaskAction).not.toHaveBeenCalled();
  });

  it("maps committed refresh failure with operation-specific wording", () => {
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
      { lifecycleOperation: "complete" },
    );
    expect(result.kind).toBe("reload_required");
    if (result.kind === "reload_required") {
      expect(result.message).toContain("was completed");
      expect(result.message).not.toContain("failed");
    }
  });

  it("maps success refresh hints for list and history", () => {
    const result = interpretTaskMutationResult({
      ok: true,
      taskId: task.id,
      task: {} as never,
      committed: true,
      refreshRequired: false,
      refreshHints: { task: true, taskLists: true, taskHistory: true },
    });
    expect(result).toMatchObject({
      kind: "success",
      refreshLists: true,
      refreshHistory: true,
    });
  });
});
