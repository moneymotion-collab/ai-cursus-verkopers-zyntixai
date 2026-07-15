import type { CustomerHistoryPresentationItem } from "@/features/customers/ui/load-customer-detail";
import styles from "./customer-history.module.css";

type CustomerHistoryProps = {
  history: CustomerHistoryPresentationItem[];
  historyState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  reloadHref?: string;
};

export function CustomerHistorySection({ history, historyState, reloadHref }: CustomerHistoryProps) {
  if (historyState.kind === "hidden") {
    return null;
  }

  if (historyState.kind === "error") {
    return (
      <section className={styles.historySection} aria-labelledby="customer-history-title">
        <h2 id="customer-history-title">Status history</h2>
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
      <section className={styles.historySection} aria-labelledby="customer-history-title">
        <h2 id="customer-history-title">Status history</h2>
        <p className={styles.empty}>No status history is available.</p>
      </section>
    );
  }

  return (
    <section className={styles.historySection} aria-labelledby="customer-history-title">
      <h2 id="customer-history-title">Status history</h2>
      <ol className={styles.history} aria-label="Customer status history">
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
