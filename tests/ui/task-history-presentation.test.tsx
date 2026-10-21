import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TaskHistoryReadEntry } from "@/features/tasks/domain/read-types";
import {
  buildHistoryPresentationItems,
  formatHistoryTransitionLabel,
  HISTORY_PRESENTATION_ORDER,
} from "@/features/tasks/ui/task-history-presentation";
import { TaskHistorySection } from "@/features/tasks/ui/task-history";
import { emptyLabelBundle, resolveMemberLabel } from "@/features/tasks/ui/resolve-task-display-labels";
import { formatTaskDueAt } from "@/features/tasks/ui/task-presentation";

const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

const historyEntries: TaskHistoryReadEntry[] = [
  {
    id: "h-new",
    organizationId: "org",
    taskId: "task",
    fromStatus: "open",
    toStatus: "completed",
    changedByMemberId: MEMBER_ID,
    reason: "All steps done",
    source: "manual",
    createdAt: "2026-07-16T10:00:00.000Z",
  },
  {
    id: "h-old",
    organizationId: "org",
    taskId: "task",
    fromStatus: null,
    toStatus: "open",
    changedByMemberId: MEMBER_ID,
    reason: null,
    source: "manual",
    createdAt: "2026-07-10T08:00:00.000Z",
  },
];

describe("task history presentation", () => {
  it("labels created, completed and cancelled transitions", () => {
    expect(
      formatHistoryTransitionLabel({
        ...historyEntries[1],
        fromStatus: null,
        toStatus: "open",
      }),
    ).toBe("Task created");
    expect(formatHistoryTransitionLabel(historyEntries[0])).toBe("Task completed");
    expect(
      formatHistoryTransitionLabel({
        ...historyEntries[0],
        fromStatus: "open",
        toStatus: "cancelled",
      }),
    ).toBe("Task cancelled");
  });

  it("preserves newest-first ordering from D4.2", () => {
    const labels = {
      ...emptyLabelBundle(),
      members: { [MEMBER_ID]: "Alex Morgan" },
    };
    const items = buildHistoryPresentationItems(historyEntries, labels, "UTC", formatTaskDueAt);

    expect(HISTORY_PRESENTATION_ORDER).toBe("newest-first");
    expect(items[0].transitionLabel).toBe("Task completed");
    expect(items[1].transitionLabel).toBe("Task created");
    expect(items[0].actorLabel).toBe("Alex Morgan");
    expect(resolveMemberLabel(MEMBER_ID, labels)).toBe("Alex Morgan");
  });

  it("renders semantic ordered list with actor, reason and timestamp", () => {
    const labels = {
      ...emptyLabelBundle(),
      members: { [MEMBER_ID]: "Alex Morgan" },
    };
    const items = buildHistoryPresentationItems(historyEntries, labels, "UTC", formatTaskDueAt);
    const html = renderToStaticMarkup(
      <TaskHistorySection history={items} historyState={{ kind: "ready" }} />,
    );

    expect(html).toContain("<ol");
    expect(html).toContain("Task completed");
    expect(html).toContain("Alex Morgan");
    expect(html).toContain("All steps done");
    expect(html).not.toContain(MEMBER_ID);
    expect(html).not.toContain("archive");
    expect(html).not.toContain("restore");
  });

  it("renders empty and error states safely", () => {
    const emptyHtml = renderToStaticMarkup(
      <TaskHistorySection history={[]} historyState={{ kind: "empty" }} />,
    );
    expect(emptyHtml).toContain("No status history is available.");

    const errorHtml = renderToStaticMarkup(
      <TaskHistorySection
        history={[]}
        historyState={{ kind: "error", message: "Status history could not be loaded." }}
        reloadHref="/tasks/task-id"
      />,
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("Status history could not be loaded.");
    expect(errorHtml).toContain('href="/tasks/task-id"');
  });
});
