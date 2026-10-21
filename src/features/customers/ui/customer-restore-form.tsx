"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreCustomerAction } from "@/features/customers/actions/customer-actions";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import {
  customerFormIsLocked,
  customerMutationRefreshRequired,
  interpretCustomerFormMutationResult,
  type CustomerFormUiState,
} from "@/features/customers/ui/customer-form-state";
import {
  CustomerLifecycleFormShell,
  CustomerLifecycleSummary,
} from "@/features/customers/ui/customer-lifecycle-confirmation";
import { buildCustomerDetailHref } from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import formStyles from "./customer-form.module.css";
import lifecycleStyles from "./customer-lifecycle.module.css";

type CustomerRestoreFormProps = {
  organizationId: string;
  customer: CustomerDetailReadModel;
  listState: CustomerListUrlState;
  backHref: string;
  terminology?: ProductTerminology;
};

export function CustomerRestoreForm({
  organizationId,
  customer,
  listState,
  backHref,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
}: CustomerRestoreFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<CustomerFormUiState>({ kind: "idle" });

  const locked = customerFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await restoreCustomerAction({
      organizationId,
      customerId: customer.id,
    });

    const next = interpretCustomerFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (customerMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildCustomerDetailHref(next.customerId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadCustomerId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.customerId ?? customer.id
      : customer.id;
  const singularLower = terminology.customer.singular.toLowerCase();

  return (
    <CustomerLifecycleFormShell
      heading={`Restore ${singularLower}`}
      description={`Restoring makes this ${singularLower} visible again according to normal role and access rules.`}
      backHref={backHref}
      terminology={terminology}
      isPending={isPending}
      pendingLabel={isPending ? "Restoring…" : undefined}
    >
      <CustomerLifecycleSummary customer={customer} terminology={terminology} />

      <section className={lifecycleStyles.summary} aria-labelledby="restore-explanation-title">
        <h2 id="restore-explanation-title">What restoring means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>The {singularLower} status remains {customer.statusLabel}.</li>
          <li>Staff and viewers can see the {singularLower} again when their role allows it.</li>
          <li>No {singularLower} status change occurs during restore.</li>
        </ul>
      </section>

      <form
        className={formStyles.customerForm}
        onSubmit={handleSubmit}
        aria-busy={isPending}
        noValidate
      >
        {uiState.kind === "error" ? (
          <div className={formStyles.formError} role="alert">
            <p>{uiState.message}</p>
          </div>
        ) : null}

        {uiState.kind === "reload_required" ? (
          <div className={formStyles.formNotice} role="status">
            <p>{uiState.message}</p>
            <p>
              <a href={buildCustomerDetailHref(reloadCustomerId, listState)}>Open restored {singularLower}</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button type="submit" className={formStyles.submitButton} disabled={locked || isPending}>
            {isPending ? "Restoring…" : `Restore ${singularLower}`}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to {singularLower}
          </a>
        </div>
      </form>
    </CustomerLifecycleFormShell>
  );
}
