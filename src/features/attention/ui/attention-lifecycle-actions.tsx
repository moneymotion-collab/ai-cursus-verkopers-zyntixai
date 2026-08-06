"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  acknowledgeAttentionItemAction,
  updateAttentionSeverityAction,
} from "@/features/attention/actions/lifecycle-attention-actions";
import {
  ATTENTION_SEVERITIES,
  getAttentionSeverityLabel,
} from "@/features/attention/domain/severity";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import {
  createPendingAttentionLifecycleActionState,
  fieldErrorMessage,
  getAttentionLifecyclePendingLabel,
  interpretAttentionLifecycleMutationResult,
  shouldDisableAttentionLifecycleSubmit,
  type AttentionLifecycleActionUiState,
} from "@/features/attention/ui/attention-lifecycle-action-state";
import styles from "./attention-lifecycle-actions.module.css";

type AttentionAcknowledgeSeverityActionsProps = {
  organizationId: string;
  attentionItemId: string;
  returnPath: string;
  showAcknowledge: boolean;
  showUpdateSeverity: boolean;
  currentSeverity: AttentionSeverity;
};

function FeedbackRegion({
  state,
  reloadHref,
}: {
  state: AttentionLifecycleActionUiState;
  reloadHref: string;
}) {
  if (state.kind === "pending") {
    const label = getAttentionLifecyclePendingLabel(state);
    return label ? (
      <p className={styles.pendingStatus} role="status" aria-live="polite">
        {label}
      </p>
    ) : null;
  }

  if (state.kind === "success") {
    const message =
      state.action === "acknowledge"
        ? "Attention item acknowledged."
        : state.action === "update_severity"
          ? "Severity updated."
          : "Change saved.";
    return (
      <div className={styles.formSuccess} role="status" aria-live="polite">
        <p>{message}</p>
      </div>
    );
  }

  if (state.kind === "noop_success") {
    const message =
      state.action === "acknowledge"
        ? "This attention item is already acknowledged."
        : state.action === "update_severity"
          ? "Severity is already set to this value."
          : "No changes were needed.";
    return (
      <div className={styles.formNotice} role="status" aria-live="polite">
        <p>{message}</p>
      </div>
    );
  }

  if (state.kind === "conflict") {
    return (
      <div className={styles.formNotice} role="status" aria-live="polite">
        <p>{state.message}</p>
        <p>
          <a className={styles.reloadLink} href={reloadHref}>
            Refresh detail
          </a>
        </p>
      </div>
    );
  }

  if (
    state.kind === "error" ||
    state.kind === "auth_required" ||
    state.kind === "organization_required" ||
    state.kind === "unavailable" ||
    state.kind === "permission_denied"
  ) {
    return (
      <div className={styles.formError} role="alert">
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.kind === "field_error" && state.message) {
    return (
      <div className={styles.formError} role="alert">
        <p>{state.message}</p>
      </div>
    );
  }

  return null;
}

export function AttentionAcknowledgeSeverityActions({
  organizationId,
  attentionItemId,
  returnPath,
  showAcknowledge,
  showUpdateSeverity,
  currentSeverity,
}: AttentionAcknowledgeSeverityActionsProps) {
  const router = useRouter();
  const acknowledgePendingRef = useRef(false);
  const severityPendingRef = useRef(false);
  const [acknowledgeState, setAcknowledgeState] =
    useState<AttentionLifecycleActionUiState>({ kind: "idle" });
  const [severityState, setSeverityState] =
    useState<AttentionLifecycleActionUiState>({ kind: "idle" });
  const [selectedSeverity, setSelectedSeverity] =
    useState<AttentionSeverity>(currentSeverity);

  useEffect(() => {
    setSelectedSeverity(currentSeverity);
  }, [currentSeverity]);

  if (!showAcknowledge && !showUpdateSeverity) {
    return null;
  }

  const acknowledgeLocked = shouldDisableAttentionLifecycleSubmit(acknowledgeState);
  const severityLocked = shouldDisableAttentionLifecycleSubmit(severityState);
  const severityUnchanged = selectedSeverity === currentSeverity;
  const severityFieldErrors =
    severityState.kind === "field_error" ? severityState.fieldErrors : undefined;
  const severityFieldError = fieldErrorMessage(severityFieldErrors, "severity");

  async function handleAcknowledge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (acknowledgePendingRef.current || acknowledgeLocked) {
      return;
    }

    acknowledgePendingRef.current = true;
    setAcknowledgeState(createPendingAttentionLifecycleActionState("acknowledge"));

    const result = await acknowledgeAttentionItemAction({
      organizationId,
      attentionItemId,
      returnPath,
    });

    const next = interpretAttentionLifecycleMutationResult(result);
    setAcknowledgeState(next);

    if (
      next.kind === "success" ||
      next.kind === "noop_success" ||
      next.kind === "conflict"
    ) {
      router.refresh();
    }

    acknowledgePendingRef.current = false;
  }

  async function handleSeverity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (severityPendingRef.current || severityLocked || severityUnchanged) {
      return;
    }

    severityPendingRef.current = true;
    setSeverityState(createPendingAttentionLifecycleActionState("update_severity"));

    const result = await updateAttentionSeverityAction({
      organizationId,
      attentionItemId,
      severity: selectedSeverity,
      returnPath,
    });

    const next = interpretAttentionLifecycleMutationResult(result);
    setSeverityState(next);

    if (
      next.kind === "success" ||
      next.kind === "noop_success" ||
      next.kind === "conflict"
    ) {
      router.refresh();
    }

    severityPendingRef.current = false;
  }

  return (
    <section
      className={styles.lifecycleActions}
      aria-labelledby="attention-lifecycle-actions-heading"
    >
      <h2 id="attention-lifecycle-actions-heading">Lifecycle actions</h2>
      <p className={styles.intro}>
        Acknowledge open items or update severity. Changes are saved on the server
        and then refreshed on this page.
      </p>

      {showAcknowledge ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-acknowledge-heading">Acknowledge</h3>
          <p className={styles.actionDescription}>
            Mark this open attention item as acknowledged.
          </p>
          <FeedbackRegion state={acknowledgeState} reloadHref={returnPath} />
          <form
            className={styles.actionForm}
            onSubmit={handleAcknowledge}
            aria-busy={acknowledgeState.kind === "pending"}
            aria-labelledby="attention-acknowledge-heading"
            noValidate
          >
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={acknowledgeLocked}
            >
              {acknowledgeState.kind === "pending" ? "Acknowledging…" : "Acknowledge"}
            </button>
          </form>
        </div>
      ) : null}

      {showUpdateSeverity ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-severity-heading">Update severity</h3>
          <p className={styles.actionDescription}>
            Choose a severity and save. Severity describes impact, not a work-order ranking.
          </p>
          <FeedbackRegion state={severityState} reloadHref={returnPath} />
          <form
            className={styles.actionForm}
            onSubmit={handleSeverity}
            aria-busy={severityState.kind === "pending"}
            aria-labelledby="attention-severity-heading"
            noValidate
          >
            <div className={styles.field}>
              <label htmlFor="attention-severity-select">Severity</label>
              <select
                id="attention-severity-select"
                name="severity"
                value={selectedSeverity}
                onChange={(event) =>
                  setSelectedSeverity(event.target.value as AttentionSeverity)
                }
                disabled={severityLocked}
                aria-invalid={Boolean(severityFieldError)}
                aria-describedby={
                  severityFieldError ? "attention-severity-error" : undefined
                }
              >
                {ATTENTION_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {getAttentionSeverityLabel(severity)}
                  </option>
                ))}
              </select>
              {severityFieldError ? (
                <p id="attention-severity-error" className={styles.fieldError}>
                  {severityFieldError}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={severityLocked || severityUnchanged}
            >
              {severityState.kind === "pending" ? "Updating severity…" : "Save severity"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
