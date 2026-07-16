import { Badge } from "@/components/ui/badge";
import type { LeadRelatedTaskRow } from "@/features/leads/ui/load-lead-detail";
import styles from "./lead-related-tasks.module.css";

type LeadRelatedTasksSectionProps = {
  tasks: LeadRelatedTaskRow[];
  tasksState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  reloadHref?: string;
};

function badgeVariantForDueState(label: string | null): "neutral" | "warning" | "danger" | "info" {
  if (label === "Overdue") return "danger";
  if (label === "Due today") return "warning";
  if (label === "Upcoming") return "info";
  return "neutral";
}

export function LeadRelatedTasksSection({
  tasks,
  tasksState,
  reloadHref,
}: LeadRelatedTasksSectionProps) {
  if (tasksState.kind === "hidden") {
    return null;
  }

  if (tasksState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="lead-related-tasks-title">
        <h2 id="lead-related-tasks-title">Related tasks</h2>
        <div className={styles.error} role="alert">
          <p>{tasksState.message}</p>
          {reloadHref ? (
            <p>
              <a href={reloadHref}>Reload page</a>
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (tasksState.kind === "empty" || tasks.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="lead-related-tasks-title">
        <h2 id="lead-related-tasks-title">Related tasks</h2>
        <p className={styles.empty}>No open tasks are linked to this lead.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="lead-related-tasks-title">
      <h2 id="lead-related-tasks-title">Related tasks</h2>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.item}>
            <a className={styles.titleLink} href={task.detailHref}>
              {task.title}
            </a>
            <div className={styles.badges}>
              <Badge variant="neutral">{task.statusLabel}</Badge>
              {task.dueStateLabel ? (
                <Badge variant={badgeVariantForDueState(task.dueStateLabel)}>
                  {task.dueStateLabel}
                </Badge>
              ) : null}
            </div>
            <p className={styles.meta}>
              Due <time>{task.dueAtLabel}</time>
              {" · "}
              Assignee: {task.assigneeLabel}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
