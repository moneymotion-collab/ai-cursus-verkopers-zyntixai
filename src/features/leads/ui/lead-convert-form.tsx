"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { convertLeadToCustomerAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadConvertCustomerOptions } from "@/features/leads/ui/load-lead-workflow-page";
import {
  fieldErrorMessage,
  interpretLeadFormMutationResult,
  leadFormIsLocked,
  leadMutationRefreshRequired,
  type LeadFormUiState,
} from "@/features/leads/ui/lead-form-state";
import {
  buildCustomerDetailHrefFromLead,
  buildLeadDetailHref,
} from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import {
  LeadLifecycleFormShell,
  LeadLifecycleSummary,
} from "@/features/leads/ui/lead-lifecycle-confirmation";
import styles from "./lead-form.module.css";
import lifecycleStyles from "./lead-lifecycle.module.css";

const CONVERT_MODE_NEW = "new";
const CONVERT_MODE_EXISTING = "existing";

type LeadConvertFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  customerOptions: LeadConvertCustomerOptions;
  listState: LeadListUrlState;
  cancelHref: string;
};

export function LeadConvertForm({
  organizationId,
  lead,
  customerOptions,
  listState,
  cancelHref,
}: LeadConvertFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });
  const [convertMode, setConvertMode] = useState(
    customerOptions.customers.length > 0 ? CONVERT_MODE_NEW : CONVERT_MODE_NEW,
  );
  const [existingCustomerId, setExistingCustomerId] = useState(
    customerOptions.customers[0]?.value ?? "",
  );
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = leadFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await convertLeadToCustomerAction({
      organizationId,
      leadId: lead.id,
      existingCustomerId:
        convertMode === CONVERT_MODE_EXISTING && existingCustomerId
          ? existingCustomerId
          : null,
      reason: reason.trim() || null,
    });

    const next = interpretLeadFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (leadMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      if (next.customerId) {
        router.push(buildCustomerDetailHrefFromLead(next.customerId, organizationId));
      } else {
        router.push(buildLeadDetailHref(next.leadId, listState));
      }
      return;
    }

    pendingRef.current = false;
  }

  const reloadLeadId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.leadId ?? lead.id
      : lead.id;
  const reloadCustomerId =
    uiState.kind === "reload_required" && uiState.committed ? uiState.customerId : undefined;

  return (
    <LeadLifecycleFormShell
      heading="Convert lead to customer"
      description="Conversion marks this lead as converted and links it to a customer record. This is separate from changing lead status."
      backHref={cancelHref}
      isPending={isPending}
      pendingLabel={isPending ? "Converting…" : undefined}
    >
      <LeadLifecycleSummary lead={lead} />

      <section className={styles.section} aria-labelledby="convert-summary-title">
        <h2 id="convert-summary-title">Lead data used for conversion</h2>
        <dl className={lifecycleStyles.summaryList}>
          <div>
            <dt>Display name</dt>
            <dd>{lead.displayName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{lead.email ?? "—"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{lead.phone ?? "—"}</dd>
          </div>
        </dl>
        <p className={styles.transitionEffect}>
          The lead record remains available as a converted lead after conversion.
        </p>
      </section>

      <form
        className={styles.leadForm}
        method="post"
        onSubmit={handleSubmit}
        aria-busy={isPending}
        noValidate
      >
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
            {reloadCustomerId ? (
              <p>
                <a href={buildCustomerDetailHrefFromLead(reloadCustomerId, organizationId)}>
                  Open converted customer
                </a>
              </p>
            ) : (
              <p>
                <a href={buildLeadDetailHref(reloadLeadId, listState)}>Open lead</a>
              </p>
            )}
          </div>
        ) : null}

        {customerOptions.loadError ? (
          <div className={styles.formNotice} role="status">
            <p>{customerOptions.loadError}</p>
          </div>
        ) : null}

        <section className={styles.section} aria-labelledby="convert-mode-title">
          <h2 id="convert-mode-title">Conversion path</h2>
          <div className={styles.statusOptions} role="radiogroup" aria-labelledby="convert-mode-title">
            <div className={styles.statusOption}>
              <label htmlFor="convert-mode-new">
                <input
                  id="convert-mode-new"
                  type="radio"
                  name="convertMode"
                  value={CONVERT_MODE_NEW}
                  checked={convertMode === CONVERT_MODE_NEW}
                  onChange={() => setConvertMode(CONVERT_MODE_NEW)}
                  disabled={locked}
                />
                <span>Create a new customer from this lead</span>
              </label>
            </div>
            {customerOptions.customers.length > 0 ? (
              <div className={styles.statusOption}>
                <label htmlFor="convert-mode-existing">
                  <input
                    id="convert-mode-existing"
                    type="radio"
                    name="convertMode"
                    value={CONVERT_MODE_EXISTING}
                    checked={convertMode === CONVERT_MODE_EXISTING}
                    onChange={() => setConvertMode(CONVERT_MODE_EXISTING)}
                    disabled={locked}
                  />
                  <span>Link to an existing customer</span>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        {convertMode === CONVERT_MODE_EXISTING ? (
          <section className={styles.section} aria-labelledby="convert-customer-title">
            <h2 id="convert-customer-title">Existing customer</h2>
            <div className={styles.field}>
              <label htmlFor="convert-existing-customer">Customer</label>
              <select
                id="convert-existing-customer"
                name="existingCustomerId"
                value={existingCustomerId}
                onChange={(event) => setExistingCustomerId(event.target.value)}
                aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "existingCustomerId"))}
                aria-describedby={
                  fieldErrorMessage(fieldErrors, "existingCustomerId")
                    ? "convert-existing-customer-error"
                    : undefined
                }
                disabled={locked}
              >
                {customerOptions.customers.map((customer) => (
                  <option key={customer.value} value={customer.value}>
                    {customer.label}
                  </option>
                ))}
              </select>
              {fieldErrorMessage(fieldErrors, "existingCustomerId") ? (
                <p id="convert-existing-customer-error" className={styles.fieldError}>
                  {fieldErrorMessage(fieldErrors, "existingCustomerId")}
                </p>
              ) : null}
            </div>
            {customerOptions.capped ? (
              <p className={styles.transitionEffect}>
                Showing the first available customers in this organization.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="convert-reason-title">
          <h2 id="convert-reason-title">Reason (optional)</h2>
          <div className={styles.field}>
            <label htmlFor="convert-reason">Reason for conversion</label>
            <textarea
              id="convert-reason"
              name="reason"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              disabled={locked}
            />
          </div>
        </section>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
            {isPending ? "Converting…" : "Convert to customer"}
          </button>
          <a className={styles.secondaryButton} href={cancelHref}>
            Cancel
          </a>
        </div>
      </form>
    </LeadLifecycleFormShell>
  );
}
