import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TaskDetailViewModel } from "@/features/tasks/ui/load-task-detail";
import { TaskDetail, TaskUnavailableDetail } from "@/features/tasks/ui/task-detail";

const baseTask = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  title: "Prepare onboarding checklist",
  description: "Gather documents",
  status: "open" as const,
  taskType: "general" as const,
  priority: "high" as const,
  source: "manual" as const,
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: "33333333-3333-4333-8333-333333333333",
  createdByMemberId: "33333333-3333-4333-8333-333333333333",
  linkedContext: { kind: "customer" as const, customerId: "44444444-4444-4444-8444-444444444444" },
  predecessorTaskId: null,
  archivedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-07-10T08:00:00.000Z",
  updatedAt: "2026-07-11T08:00:00.000Z",
  derived: {
    terminal: false,
    archived: false,
    overdue: true,
    dueToday: false,
    upcoming: false,
    dueState: "overdue" as const,
  },
};

function buildViewModel(overrides: Partial<TaskDetailViewModel> = {}): TaskDetailViewModel {
  return {
    task: baseTask,
    labels: {
      assignee: "Alex Morgan",
      creator: "Alex Morgan",
      linkedContext: "Acme Customer",
      linkedContextKind: "Customer",
      customer: "Acme Customer",
    },
    history: [],
    historyState: { kind: "empty" },
    organizationTimezone: "UTC",
    backHref: "/tasks",
    ...overrides,
  };
}

describe("TaskDetail presentation", () => {
  it("renders open task metadata and due-state badge", () => {
    const html = renderToStaticMarkup(<TaskDetail viewModel={buildViewModel()} />);
    expect(html).toContain("<h1");
    expect(html).toContain("Prepare onboarding checklist");
    expect(html).toContain("Overdue");
    expect(html).toContain("Manual");
    expect(html).toContain("Alex Morgan");
    expect(html).toContain("Acme Customer");
    expect(html).not.toContain("11111111-1111-4111-8111-111111111111");
  });

  it("renders completed task without due-state badge", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={buildViewModel({
          task: {
            ...baseTask,
            status: "completed",
            completedAt: "2026-07-16T10:00:00.000Z",
            derived: {
              terminal: true,
              archived: false,
              overdue: false,
              dueToday: false,
              upcoming: false,
              dueState: "none",
            },
          },
          history: [
            {
              id: "h1",
              transitionLabel: "Task completed",
              fromStatusLabel: "Open",
              toStatusLabel: "Completed",
              actorLabel: "Alex Morgan",
              sourceLabel: "Manual",
              reason: "Done",
              timestampLabel: "Jul 16, 2026",
            },
          ],
          historyState: { kind: "ready" },
        })}
      />,
    );

    expect(html).toContain("Completed");
    expect(html).not.toContain("Overdue");
    expect(html).toContain("Completion note");
    expect(html).toContain("Done");
  });

  it("renders cancelled and archived badges separately", () => {
    const html = renderToStaticMarkup(
      <TaskDetail
        viewModel={buildViewModel({
          task: {
            ...baseTask,
            status: "cancelled",
            cancelledAt: "2026-07-16T10:00:00.000Z",
            archivedAt: "2026-07-17T10:00:00.000Z",
            derived: {
              terminal: true,
              archived: true,
              overdue: false,
              dueToday: false,
              upcoming: false,
              dueState: "none",
            },
          },
          history: [
            {
              id: "h2",
              transitionLabel: "Task cancelled",
              fromStatusLabel: "Open",
              toStatusLabel: "Cancelled",
              actorLabel: "Alex Morgan",
              sourceLabel: "Manual",
              reason: "No longer needed",
              timestampLabel: "Jul 16, 2026",
            },
          ],
          historyState: { kind: "ready" },
        })}
      />,
    );

    expect(html).toContain("Cancelled");
    expect(html).toContain("Archived");
    expect(html).toContain("Cancellation reason");
    expect(html).not.toContain("Reopen");
    expect(html).not.toContain("Restore");
  });

  it("does not render mutation controls", () => {
    const html = renderToStaticMarkup(<TaskDetail viewModel={buildViewModel()} />);
    const lower = html.toLowerCase();
    expect(lower).not.toContain("edit task");
    expect(lower).not.toContain(">complete<");
    expect(lower).not.toContain("cancel task");
    expect(lower).not.toContain("archive task");
    expect(lower).not.toContain("reassign");
  });

  it("renders unavailable state safely", () => {
    const html = renderToStaticMarkup(<TaskUnavailableDetail backHref="/tasks?status=open" />);
    expect(html).toContain("Task unavailable");
    expect(html).toContain('href="/tasks?status=open"');
    expect(html).not.toContain("11111111");
  });
});
