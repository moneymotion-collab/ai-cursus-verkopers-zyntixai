"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionEnrollmentStatusAction } from "@/features/enrollments/actions/enrollment-actions";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentStatus } from "@/features/enrollments/domain/types";
import {
  getEnrollmentStatusLabel,
  isTerminalEnrollmentStatus,
} from "@/features/enrollments/domain/status";
import { getEnrollmentStatusTransitionEffectExplanation } from "@/features/enrollments/ui/enrollment-status-transition-copy";
import {
  fieldErrorMessage,
  interpretEnrollmentFormMutationResult,
  enrollmentFormIsLocked,
  enrollmentMutationRefreshRequired,
  type EnrollmentFormUiState,
} from "@/features/enrollments/ui/enrollment-form-state";
import { buildEnrollmentDetailHref } from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import styles from "./enrollment-form.module.css";

type EnrollmentStatusFormProps = {
  organizationId: string;
  enrollment: EnrollmentDetailReadModel;
  allowedTargets: EnrollmentStatus[];
  listState: EnrollmentListUrlState;
  cancelHref: string;
};

export function EnrollmentStatusForm({
  organizationId,
  enrollment,
  allowedTargets,
  listState,
  cancelHref,
}: EnrollmentStatusFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<EnrollmentFormUiState>({ kind: "idle" });
  const [toStatus, setToStatus] = useState<EnrollmentStatus>(
    allowedTargets[0] ?? enrollment.status,
  );
  const [reason, setReason] = useState("");
  const [terminalConfirmed, setTerminalConfirmed] = useState(false);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = enrollmentFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const requiresTerminalConfirmation = isTerminalEnrollmentStatus(toStatus);
  const effectExplanation = getEnrollmentStatusTransitionEffectExplanation(
    enrollment.status,
    toStatus,
  );

  function selectStatus(status: EnrollmentStatus) {
    setToStatus(status);
    if (!isTerminalEnrollmentStatus(status)) {
      setTerminalConfirmed(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    if (requiresTerminalConfirmation && !terminalConfirmed) {
      setUiState({
        kind: "field_error",
        message: "Confirm this terminal status change before continuing.",
        fieldErrors: {
          terminalConfirmation: ["Confirm this terminal status change before continuing."],
        },
      });
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await transitionEnrollmentStatusAction({
      organizationId,
      enrollmentId: enrollment.id,
      toStatus,
      reason: reason.trim() || null,
    });

    const next = interpretEnrollmentFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (enrollmentMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildEnrollmentDetailHref(next.enrollmentId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadEnrollmentId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.enrollmentId ?? enrollment.id
      : enrollment.id;

  return (
    <form
      className={styles.enrollmentForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to enrollment
      </a>
      <h1>Change enrollment status</h1>
      <p>
        Current lifecycle status: <strong>{enrollment.statusLabel}</strong>
      </p>
      <p className={styles.helpText}>
        Only permitted transitions are shown. Soft-archive is a separate action and does not
        change lifecycle status.
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
            <a href={buildEnrollmentDetailHref(reloadEnrollmentId, listState)}>
              Open saved enrollment
            </a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="status-target-title">
        <h2 id="status-target-title">New enrollment status</h2>
        <div
          className={styles.statusOptions}
          role="radiogroup"
          aria-labelledby="status-target-title"
        >
          {allowedTargets.map((status) => (
            <div key={status} className={styles.statusOption}>
              <label htmlFor={`enrollment-status-${status}`}>
                <input
                  id={`enrollment-status-${status}`}
                  type="radio"
                  name="toStatus"
                  value={status}
                  checked={toStatus === status}
                  onChange={() => selectStatus(status)}
                  disabled={locked}
                />
                <span>{getEnrollmentStatusLabel(status)}</span>
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
        {requiresTerminalConfirmation ? (
          <div className={styles.field}>
            <label htmlFor="enrollment-status-terminal-confirm">
              <input
                id="enrollment-status-terminal-confirm"
                type="checkbox"
                name="terminalConfirmation"
                checked={terminalConfirmed}
                onChange={(event) => setTerminalConfirmed(event.target.checked)}
                disabled={locked}
                aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "terminalConfirmation"))}
                aria-describedby={
                  fieldErrorMessage(fieldErrors, "terminalConfirmation")
                    ? "enrollment-status-terminal-confirm-error"
                    : undefined
                }
              />{" "}
              I understand this ends the enrollment lifecycle as{" "}
              {getEnrollmentStatusLabel(toStatus)}. Soft-archive remains a separate action.
            </label>
            {fieldErrorMessage(fieldErrors, "terminalConfirmation") ? (
              <p id="enrollment-status-terminal-confirm-error" className={styles.fieldError}>
                {fieldErrorMessage(fieldErrors, "terminalConfirmation")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="status-reason-title">
        <h2 id="status-reason-title">Reason (optional)</h2>
        <div className={styles.field}>
          <label htmlFor="enrollment-status-reason">Reason for enrollment status change</label>
          <textarea
            id="enrollment-status-reason"
            name="reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "reason"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "reason")
                ? "enrollment-status-reason-error"
                : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "reason") ? (
            <p id="enrollment-status-reason-error" className={styles.fieldError}>
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
