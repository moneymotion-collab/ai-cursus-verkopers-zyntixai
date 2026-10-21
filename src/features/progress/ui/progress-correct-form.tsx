"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { correctProgressFactAction } from "@/features/progress/actions/progress-actions";
import {
  PROGRESS_FACT_TYPES,
  getProgressFactTypeLabel,
} from "@/features/progress/domain/fact-types";
import { buildProgressDetailHref } from "@/features/progress/domain/progress-navigation";
import type { ProgressFactType } from "@/features/progress/domain/types";
import type { ProgressDetailViewModel } from "@/features/progress/ui/load-progress-detail-page";
import {
  fieldErrorMessage,
  interpretProgressFormMutationResult,
  progressFormIsLocked,
  progressMutationRefreshRequired,
  type ProgressFormUiState,
} from "@/features/progress/ui/progress-form-state";
import styles from "./progress-correct-form.module.css";

type ProgressCorrectFormProps = {
  organizationId: string;
  data: ProgressDetailViewModel;
  backHref: string;
};

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

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function ProgressCorrectForm({ organizationId, data, backHref }: ProgressCorrectFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const { fact } = data;
  const [uiState, setUiState] = useState<ProgressFormUiState>({ kind: "idle" });
  const [factType, setFactType] = useState<ProgressFactType>(fact.factType);
  const [occurredAt, setOccurredAt] = useState(() => toLocalInputValue(fact.occurredAt));
  const [title, setTitle] = useState(fact.title ?? "");
  const [description, setDescription] = useState(fact.description ?? "");
  const [numericValue, setNumericValue] = useState(
    fact.numericValue != null ? String(fact.numericValue) : "",
  );
  const [numericUnit, setNumericUnit] = useState(fact.numericUnit ?? "");
  const [isComplete, setIsComplete] = useState(fact.isComplete === true);
  const [sequenceNumber, setSequenceNumber] = useState(
    fact.sequenceNumber != null ? String(fact.sequenceNumber) : "",
  );
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = progressFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
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

    const result = await correctProgressFactAction({
      organizationId,
      enrollmentId: fact.enrollmentId,
      factType,
      occurredAt: occurredAtIso,
      title: title.trim() || null,
      description: description.trim() || null,
      numericValue: trimmedNumericValue ? Number(trimmedNumericValue) : null,
      numericUnit: numericUnit.trim() || null,
      isComplete: isComplete ? true : null,
      sequenceNumber: trimmedSequence ? Number(trimmedSequence) : null,
      idempotencyKey,
      correctedFromFactId: fact.id,
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

  const reloadFactId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.progressFactId ?? fact.id
      : fact.id;

  return (
    <div className={styles.correctPage}>
      <a className={styles.backLink} href={backHref}>
        Back to progress record
      </a>
      <h1>Correct progress record</h1>
      <p className={styles.description}>
        Saving a correction adds a new progress record and marks the original as void. The
        original is not deleted and stays visible in history for owners and admins. This is not a
        silent overwrite.
      </p>

      <section className={styles.summary} aria-labelledby="correct-progress-predecessor-title">
        <h2 id="correct-progress-predecessor-title">Original record</h2>
        <dl className={styles.summaryList}>
          <div>
            <dt>Title</dt>
            <dd>{data.titleLabel}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{fact.factTypeLabel}</dd>
          </div>
          <div>
            <dt>Occurred</dt>
            <dd>{data.occurredAtLabel}</dd>
          </div>
          <div>
            <dt>Customer</dt>
            <dd>{data.customerLabel}</dd>
          </div>
          <div>
            <dt>Program</dt>
            <dd>{data.programLabel}</dd>
          </div>
          <div>
            <dt>Enrollment status</dt>
            <dd>{data.enrollmentStatusLabel}</dd>
          </div>
        </dl>
        <p className={styles.boundaryNote}>
          The enrollment, program, and recorder cannot be changed on a correction. After you save,
          you return to the new corrected record.
        </p>
      </section>

      <form
        className={styles.correctForm}
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
            <p>
              <a href={buildProgressDetailHref(reloadFactId, organizationId)}>
                Open corrected record
              </a>
            </p>
          </div>
        ) : null}

        <section className={styles.section} aria-labelledby="correct-progress-details-title">
          <h2 id="correct-progress-details-title">Corrected details</h2>

          <div className={styles.field}>
            <label htmlFor="correct-progress-fact-type">Fact type (required)</label>
            <select
              id="correct-progress-fact-type"
              name="factType"
              value={factType}
              onChange={(event) => setFactType(event.target.value as ProgressFactType)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "factType"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "factType")
                  ? "correct-progress-fact-type-error"
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
              <p id="correct-progress-fact-type-error" className={styles.fieldError}>
                {fieldErrorMessage(fieldErrors, "factType")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="correct-progress-occurred-at">Occurred at (required)</label>
            <input
              id="correct-progress-occurred-at"
              name="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "occurredAt"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "occurredAt")
                  ? "correct-progress-occurred-at-error"
                  : undefined
              }
              disabled={locked}
            />
            {fieldErrorMessage(fieldErrors, "occurredAt") ? (
              <p id="correct-progress-occurred-at-error" className={styles.fieldError}>
                {fieldErrorMessage(fieldErrors, "occurredAt")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="correct-progress-title">Title (optional)</label>
            <input
              id="correct-progress-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              disabled={locked}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="correct-progress-description">Description (optional)</label>
            <textarea
              id="correct-progress-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={4000}
              disabled={locked}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="correct-progress-numeric-value">Numeric value (optional)</label>
              <input
                id="correct-progress-numeric-value"
                name="numericValue"
                type="number"
                step="any"
                value={numericValue}
                onChange={(event) => setNumericValue(event.target.value)}
                disabled={locked}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="correct-progress-numeric-unit">Numeric unit (optional)</label>
              <input
                id="correct-progress-numeric-unit"
                name="numericUnit"
                value={numericUnit}
                onChange={(event) => setNumericUnit(event.target.value)}
                maxLength={50}
                aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "numericUnit"))}
                aria-describedby={
                  fieldErrorMessage(fieldErrors, "numericUnit")
                    ? "correct-progress-numeric-unit-error"
                    : undefined
                }
                disabled={locked}
              />
            </div>
          </div>
          {fieldErrorMessage(fieldErrors, "numericUnit") ? (
            <p id="correct-progress-numeric-unit-error" className={styles.fieldError}>
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
            <label htmlFor="correct-progress-sequence">Sequence number (optional)</label>
            <input
              id="correct-progress-sequence"
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
            <label htmlFor="correct-progress-idempotency-key">Idempotency key</label>
            <input
              id="correct-progress-idempotency-key"
              name="idempotencyKey"
              value={idempotencyKey}
              readOnly
              disabled
            />
            <p className={styles.helpText}>
              Generated automatically to prevent this correction from being recorded twice.
            </p>
          </div>

          {fieldErrorMessage(fieldErrors, "form") ? (
            <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "form")}</p>
          ) : null}
        </section>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
            {isPending ? "Saving correction…" : "Save correction"}
          </button>
          <a className={styles.secondaryButton} href={backHref}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
