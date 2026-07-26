import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import styles from "./enrollment-lifecycle.module.css";

type EnrollmentLifecycleSummaryProps = {
  enrollment: EnrollmentDetailReadModel;
};

export function EnrollmentLifecycleSummary({ enrollment }: EnrollmentLifecycleSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-enrollment-summary-title">
      <h2 id="lifecycle-enrollment-summary-title">Enrollment summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>Customer</dt>
          <dd>{enrollment.customer?.displayName ?? "Unavailable customer"}</dd>
        </div>
        <div>
          <dt>Program</dt>
          <dd>{enrollment.program?.name ?? "Unavailable program"}</dd>
        </div>
        <div>
          <dt>Lifecycle status</dt>
          <dd>{enrollment.statusLabel}</dd>
        </div>
        <div>
          <dt>Archive status</dt>
          <dd>{enrollment.derived.isArchived ? "Archived" : "Not archived"}</dd>
        </div>
      </dl>
    </section>
  );
}

type EnrollmentLifecycleFormShellProps = {
  heading: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function EnrollmentLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel = "Back to enrollment",
  children,
  pendingLabel,
  isPending,
}: EnrollmentLifecycleFormShellProps) {
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
