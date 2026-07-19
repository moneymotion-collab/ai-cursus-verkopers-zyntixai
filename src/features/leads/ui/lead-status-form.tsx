"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionLeadStatusAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadStatus } from "@/features/leads/domain/types";
import { getLeadStatusLabel } from "@/features/leads/domain/status";
import {
  getLeadStatusTransitionEffectExplanation,
} from "@/features/leads/ui/lead-status-transition-copy";
import {
  fieldErrorMessage,
  interpretLeadFormMutationResult,
  leadFormIsLocked,
  leadMutationRefreshRequired,
  type LeadFormUiState,
} from "@/features/leads/ui/lead-form-state";
import { buildLeadDetailHref } from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import styles from "./lead-form.module.css";

type LeadStatusFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  allowedTargets: LeadStatus[];
  listState: LeadListUrlState;
  cancelHref: string;
};

export function LeadStatusForm({
  organizationId,
  lead,
  allowedTargets,
  listState,
  cancelHref,
}: LeadStatusFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });
  const [toStatus, setToStatus] = useState<LeadStatus>(allowedTargets[0] ?? lead.status);
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = leadFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const effectExplanation = getLeadStatusTransitionEffectExplanation(lead.status, toStatus);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await transitionLeadStatusAction({
      organizationId,
      leadId: lead.id,
      toStatus,
      reason: reason.trim() || null,
    });

    const next = interpretLeadFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (leadMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildLeadDetailHref(next.leadId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadLeadId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.leadId ?? lead.id
      : lead.id;

  return (
    <form
      className={styles.leadForm}
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to lead
      </a>
      <h1>Change lead status</h1>
      <p className={styles.currentValue}>
        Current lead status: <strong>{lead.statusLabel}</strong>
      </p>
      <p>
        Pipeline stage stays <strong>{lead.stage.name}</strong>. To complete a successful lead, use
        Convert to customer.
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
            <a href={buildLeadDetailHref(reloadLeadId, listState)}>Open saved lead</a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="lead-status-target-title">
        <h2 id="lead-status-target-title">New lead status</h2>
        <div className={styles.statusOptions} role="radiogroup" aria-labelledby="lead-status-target-title">
          {allowedTargets.map((status) => (
            <div key={status} className={styles.statusOption}>
              <label htmlFor={`lead-status-${status}`}>
                <input
                  id={`lead-status-${status}`}
                  type="radio"
                  name="toStatus"
                  value={status}
                  checked={toStatus === status}
                  onChange={() => setToStatus(status)}
                  disabled={locked}
                />
                <span>{getLeadStatusLabel(status)}</span>
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

      <section className={styles.section} aria-labelledby="lead-status-reason-title">
        <h2 id="lead-status-reason-title">Reason (optional)</h2>
        <div className={styles.field}>
          <label htmlFor="lead-status-reason">Reason for status change</label>
          <textarea
            id="lead-status-reason"
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
          {isPending ? "Updating status…" : "Update lead status"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
