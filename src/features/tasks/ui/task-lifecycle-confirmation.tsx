import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskStatus } from "@/features/tasks/domain/types";
import { formatTaskDueAt } from "@/features/tasks/ui/task-presentation";
import styles from "./task-lifecycle.module.css";

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

type TaskLifecycleSummaryProps = {
  task: TaskReadModel;
  timeZone: string;
  assigneeLabel: string | null;
};

export function TaskLifecycleSummary({ task, timeZone, assigneeLabel }: TaskLifecycleSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-task-summary-title">
      <h2 id="lifecycle-task-summary-title">Task summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>Title</dt>
          <dd>{task.title}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{STATUS_LABELS[task.status]}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{formatTaskDueAt(task.dueAt, timeZone)}</dd>
        </div>
        {assigneeLabel ? (
          <div>
            <dt>Assignee</dt>
            <dd>{assigneeLabel}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

type TaskLifecycleFormShellProps = {
  heading: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function TaskLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel = "Back to task",
  children,
  pendingLabel,
  isPending,
}: TaskLifecycleFormShellProps) {
  return (
    <div className={styles.lifecycleForm}>
      <a className={styles.backLink} href={backHref}>
        {backLabel}
      </a>
      <h1>{heading}</h1>
      <p className={styles.description}>{description}</p>
      {isPending && pendingLabel ? (
        <p className={styles.pendingStatus} role="status" aria-live="polite">
          {pendingLabel}
        </p>
      ) : null}
      {children}
    </div>
  );
}
