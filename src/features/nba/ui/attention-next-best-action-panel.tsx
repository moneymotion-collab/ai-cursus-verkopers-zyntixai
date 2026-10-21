import type { NextBestAction } from "@/features/nba/domain/types";
import {
  resolveNbaDetailCta,
  type NbaDetailCtaContext,
} from "@/features/nba/ui/resolve-nba-detail-cta";
import styles from "./attention-next-best-action-panel.module.css";

export type AttentionNextBestActionPanelProps = {
  nextBestAction: NextBestAction | null;
  ctaContext: NbaDetailCtaContext;
};

/**
 * Server-renderable Attention detail NBA panel.
 * Consumes derived NextBestAction only — never selects recommendations.
 */
export function AttentionNextBestActionPanel({
  nextBestAction,
  ctaContext,
}: AttentionNextBestActionPanelProps) {
  if (nextBestAction == null) {
    return null;
  }

  const cta = resolveNbaDetailCta(nextBestAction, ctaContext);

  return (
    <section
      className={styles.nbaPanel}
      aria-labelledby="attention-next-best-action-heading"
    >
      <h2 id="attention-next-best-action-heading">Next Best Action</h2>
      <p className={styles.title}>{nextBestAction.title}</p>
      <p className={styles.whyLabel}>Why this is recommended</p>
      <p className={styles.explanation}>{nextBestAction.explanation}</p>
      <div className={styles.ctaRow}>
        {cta.kind === "anchor" || cta.kind === "navigate" ? (
          <a className={styles.ctaLink} href={cta.href}>
            {cta.label}
          </a>
        ) : null}
        {cta.kind === "read_only" ? (
          <p className={styles.readOnlyNote} role="note">
            {cta.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
