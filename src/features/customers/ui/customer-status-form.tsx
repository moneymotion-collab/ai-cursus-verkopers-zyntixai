"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionCustomerStatusAction } from "@/features/customers/actions/customer-actions";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerStatus } from "@/features/customers/domain/types";
import { getCustomerStatusLabel } from "@/features/customers/domain/status";
import { getStatusTransitionEffectExplanation } from "@/features/customers/ui/customer-status-transition-copy";
import {
  customerFormIsLocked,
  customerMutationRefreshRequired,
  fieldErrorMessage,
  interpretCustomerFormMutationResult,
  type CustomerFormUiState,
} from "@/features/customers/ui/customer-form-state";
import { buildCustomerDetailHref } from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import styles from "./customer-form.module.css";

type CustomerStatusFormProps = {
  organizationId: string;
  customer: CustomerDetailReadModel;
  allowedTargets: CustomerStatus[];
  listState: CustomerListUrlState;
  cancelHref: string;
};

export function CustomerStatusForm({
  organizationId,
  customer,
  allowedTargets,
  listState,
  cancelHref,
}: CustomerStatusFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<CustomerFormUiState>({ kind: "idle" });
  const [toStatus, setToStatus] = useState<CustomerStatus>(allowedTargets[0] ?? customer.status);
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = customerFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const effectExplanation = getStatusTransitionEffectExplanation(customer.status, toStatus);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await transitionCustomerStatusAction({
      organizationId,
      customerId: customer.id,
      toStatus,
      reason: reason.trim() || null,
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

  return (
    <form
      className={styles.customerForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to customer
      </a>
      <h1>Change customer status</h1>
      <p>
        Current status: <strong>{customer.statusLabel}</strong>
      </p>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "field_error" && uiState.message ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "reload_required" ? (
        <div className={styles.formNotice} role="status">
          <p>{uiState.message}</p>
          <p>
            <a href={buildCustomerDetailHref(reloadCustomerId, listState)}>Open saved customer</a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="status-target-title">
        <h2 id="status-target-title">New status</h2>
        <div className={styles.statusOptions} role="radiogroup" aria-labelledby="status-target-title">
          {allowedTargets.map((status) => (
            <div key={status} className={styles.statusOption}>
              <label htmlFor={`status-${status}`}>
                <input
                  id={`status-${status}`}
                  type="radio"
                  name="toStatus"
                  value={status}
                  checked={toStatus === status}
                  onChange={() => setToStatus(status)}
                  disabled={locked}
                />
                <span>{getCustomerStatusLabel(status)}</span>
              </label>
            </div>
          ))}
        </div>
        {fieldErrorMessage(fieldErrors, "toStatus") ? (
          <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "toStatus")}</p>
        ) : null}
        {effectExplanation ? (
          <p className={styles.transitionEffect}>{effectExplanation}</p>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="status-reason-title">
        <h2 id="status-reason-title">Reason (optional)</h2>
        <div className={styles.field}>
          <label htmlFor="status-reason">Reason for status change</label>
          <textarea
            id="status-reason"
            name="reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "reason"))}
            aria-describedby={fieldErrorMessage(fieldErrors, "reason") ? "status-reason-error" : undefined}
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "reason") ? (
            <p id="status-reason-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "reason")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Updating status…" : "Update status"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
