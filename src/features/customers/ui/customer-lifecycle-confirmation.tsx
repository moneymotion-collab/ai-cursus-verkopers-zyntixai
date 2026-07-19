import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import styles from "./customer-lifecycle.module.css";

type CustomerLifecycleSummaryProps = {
  customer: CustomerDetailReadModel;
};

export function CustomerLifecycleSummary({ customer }: CustomerLifecycleSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-customer-summary-title">
      <h2 id="lifecycle-customer-summary-title">Customer summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>Customer name</dt>
          <dd>{customer.displayName}</dd>
        </div>
        <div>
          <dt>Customer status</dt>
          <dd>{customer.statusLabel}</dd>
        </div>
        <div>
          <dt>Assigned to</dt>
          <dd>{customer.ownerLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

type CustomerLifecycleFormShellProps = {
  heading: string;
  description: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function CustomerLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel = "Back to customer",
  children,
  pendingLabel,
  isPending,
}: CustomerLifecycleFormShellProps) {
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
