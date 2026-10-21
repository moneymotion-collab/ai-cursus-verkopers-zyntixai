import type { TaskHistoryReadEntry } from "@/features/tasks/domain/read-types";
import type { TaskStatus } from "@/features/tasks/domain/types";
import type { TaskHistoryPresentationItem } from "@/features/tasks/ui/load-task-detail";
import {
  resolveMemberLabel,
  type TaskDisplayLabelBundle,
} from "@/features/tasks/ui/resolve-task-display-labels";

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SOURCE_LABELS = {
  manual: "Manual",
  system: "System",
} as const;

export function formatHistoryTransitionLabel(entry: TaskHistoryReadEntry): string {
  if (entry.fromStatus === null) {
    return "Task created";
  }
  if (entry.toStatus === "completed") {
    return "Task completed";
  }
  if (entry.toStatus === "cancelled") {
    return "Task cancelled";
  }
  return `Status changed to ${STATUS_LABELS[entry.toStatus]}`;
}

export function buildHistoryPresentationItems(
  history: TaskHistoryReadEntry[],
  labels: TaskDisplayLabelBundle,
  timeZone: string,
  formatTimestamp: (iso: string, tz: string) => string,
): TaskHistoryPresentationItem[] {
  return history.map((entry) => ({
    id: entry.id,
    transitionLabel: formatHistoryTransitionLabel(entry),
    fromStatusLabel: entry.fromStatus ? STATUS_LABELS[entry.fromStatus] : null,
    toStatusLabel: STATUS_LABELS[entry.toStatus],
    actorLabel: resolveMemberLabel(entry.changedByMemberId, labels),
    sourceLabel: SOURCE_LABELS[entry.source],
    reason: entry.reason,
    timestampLabel: formatTimestamp(entry.createdAt, timeZone),
  }));
}

/**
 * History is ordered newest-first, matching the authoritative D4.2 read contract.
 */
export const HISTORY_PRESENTATION_ORDER = "newest-first" as const;
