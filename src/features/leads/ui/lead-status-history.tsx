import type { LeadStatusHistoryPresentationItem } from "@/features/leads/ui/load-lead-detail";
import styles from "./lead-status-history.module.css";

type LeadStatusHistorySectionProps = {
  history: LeadStatusHistoryPresentationItem[];
  historyState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  reloadHref?: string;
};

export function LeadStatusHistorySection({
  history,
  historyState,
  reloadHref,
}: LeadStatusHistorySectionProps) {
  if (historyState.kind === "hidden") {
    return null;
  }

  if (historyState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="lead-status-history-title">
        <h2 id="lead-status-history-title">Status history</h2>
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
      <section className={styles.section} aria-labelledby="lead-status-history-title">
        <h2 id="lead-status-history-title">Status history</h2>
        <p className={styles.empty}>No status history is available.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="lead-status-history-title">
      <h2 id="lead-status-history-title">Status history</h2>
      <ol className={styles.history} aria-label="Lead status history">
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
