import type { LeadStageHistoryPresentationItem } from "@/features/leads/ui/load-lead-detail";
import styles from "./lead-stage-history.module.css";

type LeadStageHistorySectionProps = {
  history: LeadStageHistoryPresentationItem[];
  historyState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  reloadHref?: string;
};

export function LeadStageHistorySection({
  history,
  historyState,
  reloadHref,
}: LeadStageHistorySectionProps) {
  if (historyState.kind === "hidden") {
    return null;
  }

  if (historyState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="lead-stage-history-title">
        <h2 id="lead-stage-history-title">Pipeline stage history</h2>
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
      <section className={styles.section} aria-labelledby="lead-stage-history-title">
        <h2 id="lead-stage-history-title">Pipeline stage history</h2>
        <p className={styles.empty}>No pipeline stage history is available.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="lead-stage-history-title">
      <h2 id="lead-stage-history-title">Pipeline stage history</h2>
      <ol className={styles.history} aria-label="Lead pipeline stage history">
        {history.map((item) => (
          <li key={item.id} className={styles.historyItem}>
            <p className={styles.transition}>{item.transitionLabel}</p>
            <p className={styles.meta}>
              {item.fromStageLabel
                ? `${item.fromStageLabel} → ${item.toStageLabel}`
                : item.toStageLabel}
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
