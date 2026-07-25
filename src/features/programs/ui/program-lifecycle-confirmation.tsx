import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import styles from "./program-lifecycle.module.css";

type ProgramLifecycleSummaryProps = {
  program: ProgramDetailReadModel;
};

export function ProgramLifecycleSummary({ program }: ProgramLifecycleSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-program-summary-title">
      <h2 id="lifecycle-program-summary-title">Program summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>Program name</dt>
          <dd>{program.name}</dd>
        </div>
        <div>
          <dt>Lifecycle status</dt>
          <dd>{program.statusLabel}</dd>
        </div>
        <div>
          <dt>Delivery mode</dt>
          <dd>{program.deliveryModeLabel}</dd>
        </div>
        <div>
          <dt>Open enrollments</dt>
          <dd>{program.openEnrollmentCount}</dd>
        </div>
      </dl>
    </section>
  );
}

type ProgramLifecycleFormShellProps = {
  heading: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function ProgramLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel = "Back to program",
  children,
  pendingLabel,
  isPending,
}: ProgramLifecycleFormShellProps) {
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
