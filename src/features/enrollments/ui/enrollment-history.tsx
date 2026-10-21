import type { EnrollmentHistoryPresentationItem } from "@/features/enrollments/ui/load-enrollment-detail-page";
import type { EnrollmentHistoryLoadState } from "@/features/enrollments/domain/read-types";
import styles from "./enrollment-history.module.css";

type EnrollmentHistoryProps = {
  history: EnrollmentHistoryPresentationItem[];
  historyState: EnrollmentHistoryLoadState;
  reloadHref?: string;
};

export function EnrollmentHistorySection({
  history,
  historyState,
  reloadHref,
}: EnrollmentHistoryProps) {
  if (historyState.kind === "hidden") {
    return null;
  }

  if (historyState.kind === "error") {
    return (
      <section className={styles.historySection} aria-labelledby="enrollment-history-title">
        <h2 id="enrollment-history-title">Status history</h2>
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
      <section className={styles.historySection} aria-labelledby="enrollment-history-title">
        <h2 id="enrollment-history-title">Status history</h2>
        <p className={styles.empty}>No status history is available yet.</p>
      </section>
    );
  }

  return (
    <section className={styles.historySection} aria-labelledby="enrollment-history-title">
      <h2 id="enrollment-history-title">Status history</h2>
      <ol className={styles.history} aria-label="Enrollment status history">
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
              {item.actorLabel}
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
