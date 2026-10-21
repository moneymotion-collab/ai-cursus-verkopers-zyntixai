"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionProgramStatusAction } from "@/features/programs/actions/program-actions";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import type { ProgramStatus } from "@/features/programs/domain/types";
import { getProgramStatusLabel } from "@/features/programs/domain/status";
import { getProgramStatusTransitionEffectExplanation } from "@/features/programs/ui/program-status-transition-copy";
import {
  fieldErrorMessage,
  interpretProgramFormMutationResult,
  programFormIsLocked,
  programMutationRefreshRequired,
  type ProgramFormUiState,
} from "@/features/programs/ui/program-form-state";
import { buildProgramDetailHref } from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import styles from "./program-form.module.css";

type ProgramStatusFormProps = {
  organizationId: string;
  program: ProgramDetailReadModel;
  allowedTargets: ProgramStatus[];
  listState: ProgramListUrlState;
  cancelHref: string;
};

export function ProgramStatusForm({
  organizationId,
  program,
  allowedTargets,
  listState,
  cancelHref,
}: ProgramStatusFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgramFormUiState>({ kind: "idle" });
  const [toStatus, setToStatus] = useState<ProgramStatus>(allowedTargets[0] ?? program.status);
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = programFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const effectExplanation = getProgramStatusTransitionEffectExplanation(program.status, toStatus);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await transitionProgramStatusAction({
      organizationId,
      programId: program.id,
      toStatus,
      reason: reason.trim() || null,
    });

    const next = interpretProgramFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (programMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildProgramDetailHref(next.programId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadProgramId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.programId ?? program.id
      : program.id;

  return (
    <form
      className={styles.programForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to program
      </a>
      <h1>Change program status</h1>
      <p>
        Current lifecycle status: <strong>{program.statusLabel}</strong>
      </p>
      <p className={styles.helpText}>
        Only permitted transitions are shown. Soft-archive is a separate action and does not change
        lifecycle status.
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
            <a href={buildProgramDetailHref(reloadProgramId, listState)}>Open saved program</a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="status-target-title">
        <h2 id="status-target-title">New program status</h2>
        <div className={styles.statusOptions} role="radiogroup" aria-labelledby="status-target-title">
          {allowedTargets.map((status) => (
            <div key={status} className={styles.statusOption}>
              <label htmlFor={`program-status-${status}`}>
                <input
                  id={`program-status-${status}`}
                  type="radio"
                  name="toStatus"
                  value={status}
                  checked={toStatus === status}
                  onChange={() => setToStatus(status)}
                  disabled={locked}
                />
                <span>{getProgramStatusLabel(status)}</span>
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
          <label htmlFor="program-status-reason">Reason for program status change</label>
          <textarea
            id="program-status-reason"
            name="reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "reason"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "reason") ? "program-status-reason-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "reason") ? (
            <p id="program-status-reason-error" className={styles.fieldError}>
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
