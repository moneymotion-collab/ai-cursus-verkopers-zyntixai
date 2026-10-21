"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordProgressFactAction } from "@/features/progress/actions/progress-actions";
import {
  PROGRESS_FACT_TYPES,
  getProgressFactTypeLabel,
} from "@/features/progress/domain/fact-types";
import { buildProgressDetailHref } from "@/features/progress/domain/progress-navigation";
import type { ProgressFactType } from "@/features/progress/domain/types";
import type { ProgressEnrollmentOption } from "@/features/progress/server/load-progress-enrollment-options";
import {
  fieldErrorMessage,
  interpretProgressFormMutationResult,
  progressFormIsLocked,
  progressMutationRefreshRequired,
  type ProgressFormUiState,
} from "@/features/progress/ui/progress-form-state";
import styles from "./progress-record-form.module.css";

type ProgressRecordFormProps = {
  organizationId: string;
  enrollmentOptions: ProgressEnrollmentOption[];
  enrollmentOptionsError?: string;
  enrollmentOptionsCapped?: boolean;
  initialEnrollmentId?: string;
  backHref: string;
};

const DEFAULT_FACT_TYPE: ProgressFactType = PROGRESS_FACT_TYPES[0];

function toIsoStringFromLocalInput(value: string): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function ProgressRecordForm({
  organizationId,
  enrollmentOptions,
  enrollmentOptionsError,
  enrollmentOptionsCapped,
  initialEnrollmentId,
  backHref,
}: ProgressRecordFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgressFormUiState>({ kind: "idle" });
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId ?? "");
  const [factType, setFactType] = useState<ProgressFactType>(DEFAULT_FACT_TYPE);
  const [occurredAt, setOccurredAt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [numericUnit, setNumericUnit] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = progressFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const hasEnrollments = enrollmentOptions.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked || !hasEnrollments) {
      return;
    }

    const occurredAtIso = toIsoStringFromLocalInput(occurredAt);
    if (!occurredAtIso) {
      setUiState({
        kind: "field_error",
        fieldErrors: { occurredAt: ["Enter a valid date and time."] },
        message: "Please correct the highlighted fields and try again.",
      });
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const trimmedNumericValue = numericValue.trim();
    const trimmedSequence = sequenceNumber.trim();

    const result = await recordProgressFactAction({
      organizationId,
      enrollmentId,
      factType,
      occurredAt: occurredAtIso,
      title: title.trim() || null,
      description: description.trim() || null,
      numericValue: trimmedNumericValue ? Number(trimmedNumericValue) : null,
      numericUnit: numericUnit.trim() || null,
      isComplete: isComplete ? true : null,
      sequenceNumber: trimmedSequence ? Number(trimmedSequence) : null,
      idempotencyKey: idempotencyKey.trim() || null,
    });

    const next = interpretProgressFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (progressMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildProgressDetailHref(next.progressFactId, organizationId));
      return;
    }

    pendingRef.current = false;
  }

  const committedFactId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.progressFactId
      : undefined;

  return (
    <form
      className={styles.progressForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={backHref}>
        Back to progress
      </a>
      <h1>Record progress</h1>
      <p className={styles.helpText}>
        Adds a new progress record for an enrollment that is active or paused. Earlier records are
        not changed. After a successful save, you open the new record.
      </p>

      {enrollmentOptionsError ? (
        <div className={styles.formError} role="alert">
          <p>{enrollmentOptionsError}</p>
        </div>
      ) : null}

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
          {committedFactId ? (
            <p>
              <a href={buildProgressDetailHref(committedFactId, organizationId)}>
                Open saved progress record
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="record-progress-details-title">
        <h2 id="record-progress-details-title">Progress details</h2>

        <div className={styles.field}>
          <label htmlFor="record-progress-enrollment">Enrollment (required)</label>
          {hasEnrollments ? (
            <select
              id="record-progress-enrollment"
              name="enrollmentId"
              value={enrollmentId}
              onChange={(event) => setEnrollmentId(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "enrollmentId"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "enrollmentId")
                  ? "record-progress-enrollment-error"
                  : undefined
              }
              disabled={locked}
            >
              <option value="" disabled>
                Select an enrollment
              </option>
              {enrollmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <p className={styles.helpText}>
              No eligible enrollments are available. Enrollments must be active or paused to
              record progress.
            </p>
          )}
          {enrollmentOptionsCapped ? (
            <p className={styles.helpText}>
              Showing the first {enrollmentOptions.length} eligible enrollments.
            </p>
          ) : null}
          {fieldErrorMessage(fieldErrors, "enrollmentId") ? (
            <p id="record-progress-enrollment-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "enrollmentId")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-fact-type">Fact type (required)</label>
          <select
            id="record-progress-fact-type"
            name="factType"
            value={factType}
            onChange={(event) => setFactType(event.target.value as ProgressFactType)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "factType"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "factType")
                ? "record-progress-fact-type-error"
                : undefined
            }
            disabled={locked}
          >
            {PROGRESS_FACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {getProgressFactTypeLabel(type)}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "factType") ? (
            <p id="record-progress-fact-type-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "factType")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-occurred-at">Occurred at (required)</label>
          <input
            id="record-progress-occurred-at"
            name="occurredAt"
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "occurredAt"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "occurredAt")
                ? "record-progress-occurred-at-error"
                : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "occurredAt") ? (
            <p id="record-progress-occurred-at-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "occurredAt")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-title">Title (optional)</label>
          <input
            id="record-progress-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "title"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "title") ? "record-progress-title-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "title") ? (
            <p id="record-progress-title-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "title")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-description">Description (optional)</label>
          <textarea
            id="record-progress-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            disabled={locked}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="record-progress-numeric-value">Numeric value (optional)</label>
            <input
              id="record-progress-numeric-value"
              name="numericValue"
              type="number"
              step="any"
              value={numericValue}
              onChange={(event) => setNumericValue(event.target.value)}
              disabled={locked}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="record-progress-numeric-unit">Numeric unit (optional)</label>
            <input
              id="record-progress-numeric-unit"
              name="numericUnit"
              value={numericUnit}
              onChange={(event) => setNumericUnit(event.target.value)}
              maxLength={50}
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "numericUnit"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "numericUnit")
                  ? "record-progress-numeric-unit-error"
                  : undefined
              }
              disabled={locked}
            />
          </div>
        </div>
        {fieldErrorMessage(fieldErrors, "numericUnit") ? (
          <p id="record-progress-numeric-unit-error" className={styles.fieldError}>
            {fieldErrorMessage(fieldErrors, "numericUnit")}
          </p>
        ) : null}

        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isComplete"
              checked={isComplete}
              onChange={(event) => setIsComplete(event.target.checked)}
              disabled={locked}
            />
            Mark as complete
          </label>
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-sequence">Sequence number (optional)</label>
          <input
            id="record-progress-sequence"
            name="sequenceNumber"
            type="number"
            min={1}
            step={1}
            value={sequenceNumber}
            onChange={(event) => setSequenceNumber(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="record-progress-idempotency-key">Idempotency key (optional)</label>
          <input
            id="record-progress-idempotency-key"
            name="idempotencyKey"
            value={idempotencyKey}
            onChange={(event) => setIdempotencyKey(event.target.value)}
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "idempotencyKey"))}
            aria-describedby={
              [
                "record-progress-idempotency-key-help",
                fieldErrorMessage(fieldErrors, "idempotencyKey")
                  ? "record-progress-idempotency-key-error"
                  : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            disabled={locked}
          />
          <p id="record-progress-idempotency-key-help" className={styles.helpText}>
            Optional unique key so a safe retry does not record the same progress twice.
          </p>
          {fieldErrorMessage(fieldErrors, "idempotencyKey") ? (
            <p id="record-progress-idempotency-key-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "idempotencyKey")}
            </p>
          ) : null}
        </div>

        {fieldErrorMessage(fieldErrors, "form") ? (
          <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "form")}</p>
        ) : null}
      </section>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={locked || isPending || !hasEnrollments}
        >
          {isPending ? "Recording…" : "Record progress"}
        </button>
        <a className={styles.secondaryButton} href={backHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
