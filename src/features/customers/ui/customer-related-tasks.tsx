import { Badge } from "@/components/ui/badge";
import type { CustomerRelatedTaskRow } from "@/features/customers/ui/load-customer-detail";
import styles from "./customer-related-tasks.module.css";

type CustomerRelatedTasksSectionProps = {
  tasks: CustomerRelatedTaskRow[];
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

export function CustomerRelatedTasksSection({
  tasks,
  tasksState,
  reloadHref,
}: CustomerRelatedTasksSectionProps) {
  if (tasksState.kind === "hidden") {
    return null;
  }

  if (tasksState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="customer-related-tasks-title">
        <h2 id="customer-related-tasks-title">Related tasks</h2>
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
      <section className={styles.section} aria-labelledby="customer-related-tasks-title">
        <h2 id="customer-related-tasks-title">Related tasks</h2>
        <p className={styles.empty}>No open tasks are linked to this customer.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="customer-related-tasks-title">
      <h2 id="customer-related-tasks-title">Related tasks</h2>
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
