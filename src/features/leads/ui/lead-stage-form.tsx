"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionLeadStageAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadPipelineStageOption } from "@/features/leads/domain/pipeline-stage";
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

type LeadStageFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  stageOptions: LeadPipelineStageOption[];
  listState: LeadListUrlState;
  cancelHref: string;
};

export function LeadStageForm({
  organizationId,
  lead,
  stageOptions,
  listState,
  cancelHref,
}: LeadStageFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });
  const [toStageId, setToStageId] = useState(stageOptions[0]?.stageId ?? "");
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = leadFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const selectedStage = stageOptions.find((option) => option.stageId === toStageId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await transitionLeadStageAction({
      organizationId,
      leadId: lead.id,
      toStageId,
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
      <h1>Change pipeline stage</h1>
      <p className={styles.currentValue}>
        Current pipeline stage: <strong>{lead.stage.name}</strong>
      </p>
      <p>
        This updates the lead&apos;s position in the sales pipeline. Lead status stays{" "}
        <strong>{lead.statusLabel}</strong>.
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

      <section className={styles.section} aria-labelledby="lead-stage-target-title">
        <h2 id="lead-stage-target-title">Target pipeline stage</h2>
        <div className={styles.statusOptions} role="radiogroup" aria-labelledby="lead-stage-target-title">
          {stageOptions.map((option) => (
            <div key={option.stageId} className={styles.statusOption}>
              <label htmlFor={`stage-${option.stageId}`}>
                <input
                  id={`stage-${option.stageId}`}
                  type="radio"
                  name="toStageId"
                  value={option.stageId}
                  checked={toStageId === option.stageId}
                  onChange={() => setToStageId(option.stageId)}
                  disabled={locked}
                />
                <span>{option.name}</span>
              </label>
              <p className={styles.transitionEffect}>{option.stageCategoryLabel}</p>
            </div>
          ))}
        </div>
        {fieldErrorMessage(fieldErrors, "toStageId") ? (
          <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "toStageId")}</p>
        ) : null}
        {selectedStage ? (
          <p className={styles.transitionEffect}>
            Selected target: <strong>{selectedStage.name}</strong>
          </p>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="lead-stage-reason-title">
        <h2 id="lead-stage-reason-title">Reason (optional)</h2>
        <div className={styles.field}>
          <label htmlFor="lead-stage-reason">Reason for stage change</label>
          <textarea
            id="lead-stage-reason"
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
          {isPending ? "Updating stage…" : "Update pipeline stage"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
