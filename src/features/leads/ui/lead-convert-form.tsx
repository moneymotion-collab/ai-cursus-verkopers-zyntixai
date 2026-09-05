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
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import {
  LeadLifecycleFormShell,
  LeadLifecycleSummary,
} from "@/features/leads/ui/lead-lifecycle-confirmation";
import styles from "./lead-form.module.css";
import lifecycleStyles from "./lead-lifecycle.module.css";

const CONVERT_MODE_NEW = "new";
const CONVERT_MODE_EXISTING = "existing";

export const CONVERT_LEAD_CONFIRMATION_DESCRIPTION =
  "Converting this lead will create or link a customer and change the lead status to Converted.";

export const CONVERT_NEW_CUSTOMER_EFFECT =
  "A new customer will be created from this lead. The customer starts with status Onboarding. Lead status becomes Converted. Lead history and the customer link are preserved. Archiving the lead or customer later remains independent.";

export const CONVERT_EXISTING_CUSTOMER_EFFECT =
  "This lead will be linked to the selected existing customer. Lead status becomes Converted. No new customer is created. Lead history and the customer link are preserved. Archiving the lead or customer later remains independent.";

type LeadConvertFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  customerOptions: LeadConvertCustomerOptions;
  listState: LeadListUrlState;
  cancelHref: string;
  terminology?: ProductTerminology;
};

export function LeadConvertForm({
  organizationId,
  lead,
  customerOptions,
  listState,
  cancelHref,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
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
  const customerSingular = terminology.customer.singular;
  const customerSingularLower = customerSingular.toLowerCase();
  const customerPluralLower = terminology.customer.plural.toLowerCase();
  const confirmationDescription =
    `Converting this lead will create or link a ${customerSingularLower} and change the lead status to Converted.`;
  const newCustomerEffect =
    `A new ${customerSingularLower} will be created from this lead. The ${customerSingularLower} starts with status Onboarding. Lead status becomes Converted. Lead history and the ${customerSingularLower} link are preserved. Archiving the lead or ${customerSingularLower} later remains independent.`;
  const existingCustomerEffect =
    `This lead will be linked to the selected existing ${customerSingularLower}. Lead status becomes Converted. No new ${customerSingularLower} is created. Lead history and the ${customerSingularLower} link are preserved. Archiving the lead or ${customerSingularLower} later remains independent.`;

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
      heading={`Convert lead to ${customerSingularLower}`}
      description={confirmationDescription}
      backHref={cancelHref}
      isPending={isPending}
      pendingLabel={isPending ? "Converting…" : undefined}
    >
      <LeadLifecycleSummary lead={lead} />

      <section className={styles.section} aria-labelledby="convert-summary-title">
        <h2 id="convert-summary-title">Lead data used for conversion</h2>
        <dl className={lifecycleStyles.summaryList}>
          <div>
            <dt>Lead name</dt>
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
        {convertMode === CONVERT_MODE_NEW ? (
          <p className={styles.transitionEffect}>{newCustomerEffect}</p>
        ) : (
          <p className={styles.transitionEffect}>{existingCustomerEffect}</p>
        )}
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
                  Open converted {customerSingularLower}
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
                <span>Create a new {customerSingularLower} from this lead</span>
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
                  <span>Link to an existing {customerSingularLower}</span>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        {convertMode === CONVERT_MODE_EXISTING ? (
          <section className={styles.section} aria-labelledby="convert-customer-title">
            <h2 id="convert-customer-title">Existing {customerSingularLower}</h2>
            <div className={styles.field}>
              <label htmlFor="convert-existing-customer">{customerSingular}</label>
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
                Showing the first available {customerPluralLower} in this organization.
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
            {isPending ? "Converting…" : `Convert to ${customerSingularLower}`}
          </button>
          <a className={styles.secondaryButton} href={cancelHref}>
            Cancel
          </a>
        </div>
      </form>
    </LeadLifecycleFormShell>
  );
}
