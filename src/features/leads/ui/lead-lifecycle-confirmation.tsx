import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import styles from "./lead-lifecycle.module.css";

type LeadLifecycleSummaryProps = {
  lead: LeadDetailReadModel;
};

export function LeadLifecycleSummary({ lead }: LeadLifecycleSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-lead-summary-title">
      <h2 id="lifecycle-lead-summary-title">Lead summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>Lead name</dt>
          <dd>{lead.displayName}</dd>
        </div>
        <div>
          <dt>Lead status</dt>
          <dd>{lead.statusLabel}</dd>
        </div>
        <div>
          <dt>{lead.derived.isConverted ? "Last pipeline stage" : "Pipeline stage"}</dt>
          <dd>{lead.stage.name}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>{lead.ownerLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

type LeadLifecycleFormShellProps = {
  heading: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function LeadLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel = "Back to lead",
  children,
  pendingLabel,
  isPending,
}: LeadLifecycleFormShellProps) {
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
