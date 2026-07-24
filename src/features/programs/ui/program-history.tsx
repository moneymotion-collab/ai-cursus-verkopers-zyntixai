import type { ProgramHistoryPresentationItem } from "@/features/programs/ui/load-program-detail-page";
import type { ProgramHistoryLoadState } from "@/features/programs/domain/read-types";
import styles from "./program-history.module.css";

type ProgramHistoryProps = {
  history: ProgramHistoryPresentationItem[];
  historyState: ProgramHistoryLoadState;
  reloadHref?: string;
};

export function ProgramHistorySection({ history, historyState, reloadHref }: ProgramHistoryProps) {
  if (historyState.kind === "hidden") {
    return null;
  }

  if (historyState.kind === "error") {
    return (
      <section className={styles.historySection} aria-labelledby="program-history-title">
        <h2 id="program-history-title">Status history</h2>
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
      <section className={styles.historySection} aria-labelledby="program-history-title">
        <h2 id="program-history-title">Status history</h2>
        <p className={styles.empty}>No status history is available yet.</p>
      </section>
    );
  }

  return (
    <section className={styles.historySection} aria-labelledby="program-history-title">
      <h2 id="program-history-title">Status history</h2>
      <ol className={styles.history} aria-label="Program status history">
        {history.map((item) => (
          <li key={item.id} className={styles.historyItem}>
            <p className={styles.transition}>{item.transitionLabel}</p>
            <p className={styles.meta}>
              {item.fromStatusLabel
                ? `${item.fromStatusLabel} → ${item.toStatusLabel}`
                : item.toStatusLabel}
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
