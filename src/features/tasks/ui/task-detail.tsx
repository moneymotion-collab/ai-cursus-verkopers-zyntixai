import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskStatus } from "@/features/tasks/domain/types";
import { Badge } from "@/components/ui/badge";
import type { TaskDetailViewModel } from "@/features/tasks/ui/load-task-detail";
import {
  formatDueStateLabel,
  formatTaskDueAt,
} from "@/features/tasks/ui/task-presentation";
import { TaskHistorySection } from "@/features/tasks/ui/task-history";
import styles from "./task-detail.module.css";

type TaskWorkflowLinks = {
  edit?: string;
  reassign?: string;
  reschedule?: string;
  complete?: string;
  cancel?: string;
  archive?: string;
  restore?: string;
};

type TaskDetailProps = {
  viewModel: TaskDetailViewModel;
  reloadHref?: string;
  workflowLinks?: TaskWorkflowLinks;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
} as const;

const SOURCE_LABELS = {
  manual: "Manual",
  system: "System",
} as const;

function badgeVariantForStatus(label: string): "neutral" | "success" | "danger" {
  if (label === "Completed") return "success";
  if (label === "Cancelled") return "danger";
  return "neutral";
}

function badgeVariantForDueState(label: string | null): "neutral" | "warning" | "danger" | "info" {
  if (label === "Overdue") return "danger";
  if (label === "Due today") return "warning";
  if (label === "Upcoming") return "info";
  return "neutral";
}

function findTerminalHistoryReason(
  task: TaskReadModel,
  history: TaskDetailViewModel["history"],
  status: "completed" | "cancelled",
): string | null {
  const match = history.find((entry) => entry.toStatusLabel === STATUS_LABELS[status]);
  return match?.reason ?? null;
}

export function TaskDetail({ viewModel, reloadHref, workflowLinks }: TaskDetailProps) {
  const { task, labels, history, historyState, organizationTimezone, backHref } = viewModel;
  const statusLabel = STATUS_LABELS[task.status];
  const dueStateLabel = formatDueStateLabel(task);
  const completionReason =
    task.status === "completed"
      ? findTerminalHistoryReason(task, history, "completed")
      : null;
  const cancellationReason =
    task.status === "cancelled"
      ? findTerminalHistoryReason(task, history, "cancelled")
      : null;

  return (
    <article className={styles.taskDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to tasks
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>{task.title}</h1>
        <div className={styles.badgeRow}>
          <Badge variant={badgeVariantForStatus(statusLabel)}>{statusLabel}</Badge>
          {task.derived.archived ? <Badge variant="info">Archived</Badge> : null}
          {dueStateLabel ? (
            <Badge variant={badgeVariantForDueState(dueStateLabel)}>{dueStateLabel}</Badge>
          ) : null}
          <Badge variant="neutral">{PRIORITY_LABELS[task.priority]}</Badge>
          <Badge variant="neutral">{SOURCE_LABELS[task.source]}</Badge>
        </div>
        {workflowLinks ? (
          <nav className={styles.workflowLinks} aria-label="Task actions">
            {workflowLinks.edit ? <a href={workflowLinks.edit}>Edit details</a> : null}
            {workflowLinks.reassign ? <a href={workflowLinks.reassign}>Reassign</a> : null}
            {workflowLinks.reschedule ? <a href={workflowLinks.reschedule}>Reschedule</a> : null}
            {workflowLinks.complete ? <a href={workflowLinks.complete}>Complete task</a> : null}
            {workflowLinks.cancel ? <a href={workflowLinks.cancel}>Cancel task</a> : null}
            {workflowLinks.archive ? <a href={workflowLinks.archive}>Archive task</a> : null}
            {workflowLinks.restore ? <a href={workflowLinks.restore}>Restore from archive</a> : null}
          </nav>
        ) : null}
      </header>

      <section className={styles.section} aria-labelledby="task-description-title">
        <h2 id="task-description-title">Description</h2>
        {task.description ? (
          <p className={styles.description}>{task.description}</p>
        ) : (
          <p className={styles.emptyDescription}>No description provided.</p>
        )}
      </section>

      <div className={styles.metaGrid}>
        <section className={styles.section} aria-labelledby="task-operational-title">
          <h2 id="task-operational-title">Operational details</h2>
          <dl className={styles.metaList}>
            <div>
              <dt>Due</dt>
              <dd>{formatTaskDueAt(task.dueAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{organizationTimezone}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{labels.assignee}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTaskDueAt(task.createdAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTaskDueAt(task.updatedAt, organizationTimezone)}</dd>
            </div>
            {labels.creator ? (
              <div>
                <dt>Created by</dt>
                <dd>{labels.creator}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="task-linked-context-title">
          <h2 id="task-linked-context-title">Linked context</h2>
          <dl className={styles.metaList}>
            <div>
              <dt>Context type</dt>
              <dd>{labels.linkedContextKind}</dd>
            </div>
            <div>
              <dt>Label</dt>
              <dd>{labels.linkedContext}</dd>
            </div>
            {labels.lead ? (
              <div>
                <dt>Lead</dt>
                <dd>{labels.lead}</dd>
              </div>
            ) : null}
            {labels.customer ? (
              <div>
                <dt>Customer</dt>
                <dd>{labels.customer}</dd>
              </div>
            ) : null}
            {labels.program ? (
              <div>
                <dt>Program</dt>
                <dd>{labels.program}</dd>
              </div>
            ) : null}
            {labels.project ? (
              <div>
                <dt>Project</dt>
                <dd>{labels.project}</dd>
              </div>
            ) : null}
            {task.predecessorTaskId ? (
              <div>
                <dt>Predecessor task</dt>
                <dd>Linked predecessor task</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {(task.status === "completed" || task.status === "cancelled" || task.derived.archived) && (
          <section className={styles.section} aria-labelledby="task-lifecycle-title">
            <h2 id="task-lifecycle-title">Lifecycle details</h2>
            <dl className={styles.metaList}>
              {task.status === "completed" && task.completedAt ? (
                <div>
                  <dt>Completed</dt>
                  <dd>{formatTaskDueAt(task.completedAt, organizationTimezone)}</dd>
                </div>
              ) : null}
              {completionReason ? (
                <div>
                  <dt>Completion note</dt>
                  <dd>{completionReason}</dd>
                </div>
              ) : null}
              {task.status === "cancelled" && task.cancelledAt ? (
                <div>
                  <dt>Cancelled</dt>
                  <dd>{formatTaskDueAt(task.cancelledAt, organizationTimezone)}</dd>
                </div>
              ) : null}
              {cancellationReason ? (
                <div>
                  <dt>Cancellation reason</dt>
                  <dd>{cancellationReason}</dd>
                </div>
              ) : null}
              {task.derived.archived && task.archivedAt ? (
                <div>
                  <dt>Archived</dt>
                  <dd>{formatTaskDueAt(task.archivedAt, organizationTimezone)}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        )}
      </div>

      <TaskHistorySection
        history={history}
        historyState={historyState}
        reloadHref={reloadHref}
      />
    </article>
  );
}

export function TaskUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="task-unavailable-title">
      <a className={styles.backLink} href={backHref}>
        Back to tasks
      </a>
      <h1 id="task-unavailable-title">Task unavailable</h1>
      <p>This task does not exist or is not available in the selected organization.</p>
    </section>
  );
}
