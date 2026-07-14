import type { TaskDetailViewModel } from "@/features/tasks/ui/load-task-detail";
import styles from "./task-history.module.css";

type TaskHistoryProps = {
  history: TaskDetailViewModel["history"];
  historyState: TaskDetailViewModel["historyState"];
  reloadHref?: string;
};

export function TaskHistorySection({ history, historyState, reloadHref }: TaskHistoryProps) {
  if (historyState.kind === "error") {
    return (
      <section className={styles.historySection} aria-labelledby="task-history-title">
        <h2 id="task-history-title">Status history</h2>
        <div className={styles.error} role="alert">
          <p>{historyState.message}</p>
          {reloadHref ? (
            <p>
              <a href={reloadHref}>Reload page</a>
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (historyState.kind === "empty" || history.length === 0) {
    return (
      <section className={styles.historySection} aria-labelledby="task-history-title">
        <h2 id="task-history-title">Status history</h2>
        <p className={styles.empty}>No status history is available.</p>
      </section>
    );
  }

  return (
    <section className={styles.historySection} aria-labelledby="task-history-title">
      <h2 id="task-history-title">Status history</h2>
      <ol className={styles.history} aria-label="Task status history">
        {history.map((item) => (
          <li key={item.id} className={styles.historyItem}>
            <p className={styles.transition}>{item.transitionLabel}</p>
            <p className={styles.meta}>
              {item.fromStatusLabel
                ? `${item.fromStatusLabel} → ${item.toStatusLabel}`
                : item.toStatusLabel}
              {" · "}
              {item.actorLabel}
              {" · "}
              {item.sourceLabel}
              {" · "}
              <time>{item.timestampLabel}</time>
            </p>
            {item.reason ? <p className={styles.reason}>{item.reason}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
