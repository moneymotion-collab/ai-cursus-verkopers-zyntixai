import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import styles from "./customer-lifecycle.module.css";

type CustomerLifecycleSummaryProps = {
  customer: CustomerDetailReadModel;
  terminology?: ProductTerminology;
};

export function CustomerLifecycleSummary({
  customer,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
}: CustomerLifecycleSummaryProps) {
  const singular = terminology.customer.singular;
  return (
    <section className={styles.summary} aria-labelledby="lifecycle-customer-summary-title">
      <h2 id="lifecycle-customer-summary-title">{singular} summary</h2>
      <dl className={styles.summaryList}>
        <div>
          <dt>{singular} name</dt>
          <dd>{customer.displayName}</dd>
        </div>
        <div>
          <dt>{singular} status</dt>
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
  terminology?: ProductTerminology;
  children: React.ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
};

export function CustomerLifecycleFormShell({
  heading,
  description,
  backHref,
  backLabel,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
  children,
  pendingLabel,
  isPending,
}: CustomerLifecycleFormShellProps) {
  const resolvedBackLabel = backLabel ?? `Back to ${terminology.customer.singular.toLowerCase()}`;
  return (
    <div className={styles.lifecycleForm}>
      <a className={styles.backLink} href={backHref}>
        {resolvedBackLabel}
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
