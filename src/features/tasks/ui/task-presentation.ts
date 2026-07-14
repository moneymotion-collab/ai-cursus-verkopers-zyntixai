import type { TaskListItemReadModel, TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskStatus } from "@/features/tasks/domain/types";
import { resolveEffectiveTimezone } from "@/features/tasks/domain/due-state";
import {
  emptyLabelBundle,
  resolveLinkedContextLabel,
  resolveMemberLabel,
  type TaskDisplayLabelBundle,
} from "@/features/tasks/ui/resolve-task-display-labels";

export type TaskListPresentationRow = {
  id: string;
  title: string;
  detailHref: string;
  statusLabel: string;
  dueStateLabel: string | null;
  dueAtLabel: string;
  priorityLabel: string;
  assigneeLabel: string;
  linkedContextLabel: string;
  sourceLabel: string;
  archivedLabel: string | null;
};

type TaskDueStateSource = Pick<TaskListItemReadModel, "status" | "derived"> | Pick<TaskReadModel, "status" | "derived">;

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DUE_STATE_LABELS = {
  overdue: "Overdue",
  due_today: "Due today",
  upcoming: "Upcoming",
} as const;

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
} as const;

const SOURCE_LABELS = {
  manual: "Manual",
  system: "System",
} as const;

export function formatTaskDueAt(isoTimestamp: string, timeZone: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const effectiveTz = resolveEffectiveTimezone(timeZone);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: effectiveTz,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function formatDueStateLabel(task: TaskDueStateSource): string | null {
  if (task.status !== "open" || task.derived.terminal) {
    return null;
  }

  const dueState = task.derived.dueState;
  if (dueState === "none") {
    return null;
  }

  return DUE_STATE_LABELS[dueState] ?? null;
}

export function toTaskListPresentationRow(
  task: TaskListItemReadModel,
  timeZone: string,
  options: {
    labels?: TaskDisplayLabelBundle;
    detailHref: string;
  },
): TaskListPresentationRow {
  const labelBundle = options.labels ?? emptyLabelBundle();

  return {
    id: task.id,
    title: task.title,
    detailHref: options.detailHref,
    statusLabel: STATUS_LABELS[task.status],
    dueStateLabel: formatDueStateLabel(task),
    dueAtLabel: formatTaskDueAt(task.dueAt, timeZone),
    priorityLabel: PRIORITY_LABELS[task.priority],
    assigneeLabel: resolveMemberLabel(task.assigneeMemberId, labelBundle),
    linkedContextLabel: resolveLinkedContextLabel(task.linkedContext, labelBundle),
    sourceLabel: SOURCE_LABELS[task.source],
    archivedLabel: task.derived.archived ? "Archived" : null,
  };
}

export function presentationContainsUuid(text: string): boolean {
  return UUID_PATTERN.test(text);
}

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
