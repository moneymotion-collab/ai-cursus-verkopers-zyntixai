"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { voidProgressFactAction } from "@/features/progress/actions/progress-actions";
import { buildProgressDetailHref } from "@/features/progress/domain/progress-navigation";
import type { ProgressDetailViewModel } from "@/features/progress/ui/load-progress-detail-page";
import {
  fieldErrorMessage,
  interpretProgressFormMutationResult,
  progressFormIsLocked,
  progressMutationRefreshRequired,
  type ProgressFormUiState,
} from "@/features/progress/ui/progress-form-state";
import styles from "./progress-void-form.module.css";

type ProgressVoidFormProps = {
  organizationId: string;
  data: ProgressDetailViewModel;
  backHref: string;
};

export function ProgressVoidForm({ organizationId, data, backHref }: ProgressVoidFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const { fact } = data;
  const [uiState, setUiState] = useState<ProgressFormUiState>({ kind: "idle" });
  const [reason, setReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = progressFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const canSubmit = reason.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked || !canSubmit) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await voidProgressFactAction({
      organizationId,
      progressFactId: fact.id,
      reason: reason.trim(),
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
    <div className={styles.voidPage}>
      <a className={styles.backLink} href={backHref}>
        Back to progress record
      </a>
      <h1>Void progress record</h1>
      <p className={styles.description}>
        Voiding marks this progress record as no longer valid. It is not a hard delete — the record
        stays in history for owners and admins. After you confirm, you return to this record in its
        voided state.
      </p>

      <section className={styles.summary} aria-labelledby="void-progress-summary-title">
        <h2 id="void-progress-summary-title">Progress summary</h2>
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
        </dl>
      </section>

      <section className={styles.summary} aria-labelledby="void-explanation-title">
        <h2 id="void-explanation-title">What voiding means</h2>
        <ul className={styles.explanationList}>
          <li>Voiding is not a hard delete.</li>
          <li>This progress record remains visible to owners and admins in history.</li>
          <li>Staff and viewers will no longer see this record in the normal list.</li>
          <li>Voided records cannot be restored — record a correction on another active record if needed.</li>
        </ul>
      </section>

      <form className={styles.voidForm} onSubmit={handleSubmit} aria-busy={isPending} noValidate>
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
                Open progress record
              </a>
            </p>
          </div>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="void-progress-reason">Reason (required)</label>
          <textarea
            id="void-progress-reason"
            name="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={500}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "reason"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "reason") ? "void-progress-reason-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "reason") ? (
            <p id="void-progress-reason-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "reason")}
            </p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={`${styles.submitButton} ${styles.destructiveButton}`}
            disabled={locked || isPending || !canSubmit}
          >
            {isPending ? "Voiding…" : "Void progress record"}
          </button>
          <a className={styles.secondaryButton} href={backHref}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
