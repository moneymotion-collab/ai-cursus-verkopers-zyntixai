import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import { TaskDetail } from "@/features/tasks/ui/task-detail";
import { TaskEditForm } from "@/features/tasks/ui/task-edit-form";
import { TaskReassignForm } from "@/features/tasks/ui/task-reassign-form";
import { TaskRescheduleForm } from "@/features/tasks/ui/task-reschedule-form";
import { emptyTaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import type { TaskDetailViewModel } from "@/features/tasks/ui/load-task-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

const listState = {
  org: "22222222-2222-4222-8222-222222222222",
  status: "open" as const,
  archived: false,
  page: 1,
  pageSize: 25,
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

describe("editable task workflow presentation", () => {
  it("renders workflow links for open tasks", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={viewModel}
        workflowLinks={{
          edit: "/tasks/11111111-1111-4111-8111-111111111111/edit",
          reassign: "/tasks/11111111-1111-4111-8111-111111111111/reassign",
          reschedule: "/tasks/11111111-1111-4111-8111-111111111111/reschedule",
        }}
      />,
    );
    expect(html).toContain("Edit details");
    expect(html).toContain("Reassign");
    expect(html).toContain("Reschedule");
  });

  it("renders edit form with allowed fields only", () => {
    const html = renderToStaticMarkup(
      <TaskEditForm
        organizationId={task.organizationId}
        task={task}
        listState={listState}
        cancelHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Edit task details");
    expect(html).toContain('id="edit-title"');
    expect(html).not.toContain("assignee");
    expect(html).not.toContain("due-date");
  });

  it("renders reassign form with labelled member options", () => {
    const html = renderToStaticMarkup(
      <TaskReassignForm
        organizationId={task.organizationId}
        task={task}
        listState={listState}
        options={{
          ...emptyTaskFormOptions(),
          members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Alex Morgan" }],
        }}
        cancelHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Unassigned");
    expect(html).toContain("Alex Morgan");
    expect(html.replace(/value="[^"]*"/g, "")).not.toContain("33333333-3333-4333-8333-333333333333");
  });

  it("renders reschedule form with organization timezone label", () => {
    const html = renderToStaticMarkup(
      <TaskRescheduleForm
        organizationId={task.organizationId}
        task={task}
        timeZone="UTC"
        dueDate="2026-07-15"
        dueTime="09:00"
        listState={listState}
        cancelHref="/tasks/11111111-1111-4111-8111-111111111111"
      />,
    );
    expect(html).toContain("Reschedule task");
    expect(html).toContain("UTC");
    expect(html).toContain('type="date"');
    expect(html).toContain('type="time"');
  });

  it("does not render lifecycle mutation controls", () => {
    const html = renderToStaticMarkup(
      <TaskDetail viewModel={viewModel} workflowLinks={{ edit: "/edit" }} />,
    );
    const lower = html.toLowerCase();
    expect(lower).not.toContain("cancel task");
    expect(lower).not.toContain("archive task");
    expect(lower).not.toContain("restore");
  });
});
