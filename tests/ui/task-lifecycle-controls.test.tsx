import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import { TaskDetail } from "@/features/tasks/ui/task-detail";
import type { TaskDetailViewModel } from "@/features/tasks/ui/load-task-detail";
import {
  canShowArchiveWorkflow,
  canShowCancelWorkflow,
  canShowCompleteWorkflow,
  canShowRestoreWorkflow,
} from "@/features/tasks/ui/task-workflow-visibility";

const task: TaskReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  title: "Prepare onboarding",
  description: "Checklist",
  status: "open",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: null,
  createdByMemberId: "33333333-3333-4333-8333-333333333333",
  linkedContext: { kind: "customer", customerId: "44444444-4444-4444-8444-444444444444" },
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

const viewModel: TaskDetailViewModel = {
  task,
  labels: {
    assignee: "Unassigned",
    linkedContext: "Acme Customer",
    linkedContextKind: "Customer",
    customer: "Acme Customer",
  },
  history: [],
  historyState: { kind: "empty" },
  organizationTimezone: "UTC",
  backHref: "/tasks",
};

function withStatus(status: TaskReadModel["status"], archived = false): TaskReadModel {
  return {
    ...task,
    status,
    archivedAt: archived ? "2026-07-17T08:00:00.000Z" : null,
    derived: {
      ...task.derived,
      terminal: status !== "open",
      archived,
    },
  };
}

describe("lifecycle workflow visibility", () => {
  it("shows complete and cancel for owner/admin/staff on open tasks", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(canShowCompleteWorkflow(task, role)).toBe(true);
      expect(canShowCancelWorkflow(task, role)).toBe(true);
      expect(canShowArchiveWorkflow(task, role)).toBe(false);
      expect(canShowRestoreWorkflow(task, role)).toBe(false);
    }
  });

  it("hides lifecycle controls for viewer on open tasks", () => {
    expect(canShowCompleteWorkflow(task, "viewer")).toBe(false);
    expect(canShowCancelWorkflow(task, "viewer")).toBe(false);
  });

  it("shows archive only for owner/admin on terminal non-archived tasks", () => {
    const completed = withStatus("completed");
    expect(canShowArchiveWorkflow(completed, "owner")).toBe(true);
    expect(canShowArchiveWorkflow(completed, "staff")).toBe(false);
    expect(canShowCompleteWorkflow(completed, "owner")).toBe(false);
  });

  it("shows restore only for owner/admin on archived terminal tasks", () => {
    const archived = withStatus("completed", true);
    expect(canShowRestoreWorkflow(archived, "owner")).toBe(true);
    expect(canShowRestoreWorkflow(archived, "staff")).toBe(false);
  });
});

describe("task detail lifecycle controls", () => {
  it("renders complete and cancel links for open tasks", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={viewModel}
        workflowLinks={{
          complete: "/tasks/11111111-1111-4111-8111-111111111111/complete",
          cancel: "/tasks/11111111-1111-4111-8111-111111111111/cancel",
        }}
      />,
    );
    expect(html).toContain("Complete task");
    expect(html).toContain("Cancel task");
    expect(html.toLowerCase()).not.toContain("reopen");
    expect(html.toLowerCase()).not.toContain("delete");
  });

  it("renders archive link for terminal tasks", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={{
          ...viewModel,
          task: {
            ...task,
            status: "completed",
            completedAt: "2026-07-16T08:00:00.000Z",
            derived: { ...task.derived, terminal: true },
          },
        }}
        workflowLinks={{
          archive: "/tasks/11111111-1111-4111-8111-111111111111/archive",
        }}
      />,
    );
    expect(html).toContain("Archive task");
    expect(html).not.toContain("Complete task");
    expect(html).not.toContain("Cancel task");
  });

  it("renders restore link for archived terminal tasks", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={{
          ...viewModel,
          task: {
            ...task,
            status: "cancelled",
            cancelledAt: "2026-07-16T08:00:00.000Z",
            archivedAt: "2026-07-17T08:00:00.000Z",
            derived: { ...task.derived, terminal: true, archived: true },
          },
        }}
        workflowLinks={{
          restore: "/tasks/11111111-1111-4111-8111-111111111111/restore",
        }}
      />,
    );
    expect(html).toContain("Restore from archive");
    expect(html.toLowerCase()).not.toContain("reopen");
  });
});
