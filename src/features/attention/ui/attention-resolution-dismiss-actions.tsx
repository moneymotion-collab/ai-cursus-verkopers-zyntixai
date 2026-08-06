"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MutableRefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
  dismissAttentionItemAction,
  resolveAttentionItemAction,
} from "@/features/attention/actions/lifecycle-attention-actions";
import { ATTENTION_REASON_MAX_LENGTH } from "@/features/attention/domain/validation";
import {
  createPendingAttentionLifecycleActionState,
  fieldErrorMessage,
  getAttentionLifecyclePendingLabel,
  interpretAttentionLifecycleMutationResult,
  shouldDisableAttentionLifecycleSubmit,
  type AttentionLifecycleActionUiState,
} from "@/features/attention/ui/attention-lifecycle-action-state";
import styles from "./attention-lifecycle-actions.module.css";

type ConfirmationMode = "resolve" | "dismiss" | null;

type AttentionResolutionDismissActionsProps = {
  organizationId: string;
  attentionItemId: string;
  returnPath: string;
  itemTitleLabel: string;
  showResolve: boolean;
  showDismiss: boolean;
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
      state.action === "resolve"
        ? "Attention item resolved."
        : state.action === "dismiss"
          ? "Attention item dismissed."
          : "Change saved.";
    return (
      <div className={styles.formSuccess} role="status" aria-live="polite">
        <p>{message}</p>
      </div>
    );
  }

  if (state.kind === "noop_success") {
    const message =
      state.action === "resolve"
        ? "This attention item is already resolved."
        : state.action === "dismiss"
          ? "This attention item is already dismissed."
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

export function AttentionResolutionDismissActions({
  organizationId,
  attentionItemId,
  returnPath,
  itemTitleLabel,
  showResolve,
  showDismiss,
}: AttentionResolutionDismissActionsProps) {
  const router = useRouter();
  const resolvePendingRef = useRef(false);
  const dismissPendingRef = useRef(false);
  const resolveOpenerRef = useRef<HTMLButtonElement>(null);
  const dismissOpenerRef = useRef<HTMLButtonElement>(null);
  const resolveReasonRef = useRef<HTMLTextAreaElement>(null);
  const dismissReasonRef = useRef<HTMLTextAreaElement>(null);
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(null);
  const [resolveState, setResolveState] = useState<AttentionLifecycleActionUiState>({
    kind: "idle",
  });
  const [dismissState, setDismissState] = useState<AttentionLifecycleActionUiState>({
    kind: "idle",
  });
  const [resolutionReason, setResolutionReason] = useState("");
  const [dismissalReason, setDismissalReason] = useState("");

  useEffect(() => {
    if (confirmationMode === "resolve") {
      resolveReasonRef.current?.focus();
    } else if (confirmationMode === "dismiss") {
      dismissReasonRef.current?.focus();
    }
  }, [confirmationMode]);

  if (!showResolve && !showDismiss) {
    return null;
  }

  const resolveLocked = shouldDisableAttentionLifecycleSubmit(resolveState);
  const dismissLocked = shouldDisableAttentionLifecycleSubmit(dismissState);
  const anyPending = resolveLocked || dismissLocked;
  const resolveFieldErrors =
    resolveState.kind === "field_error" ? resolveState.fieldErrors : undefined;
  const dismissFieldErrors =
    dismissState.kind === "field_error" ? dismissState.fieldErrors : undefined;
  const resolveReasonError = fieldErrorMessage(
    resolveFieldErrors,
    "resolutionReason",
  );
  const dismissReasonError = fieldErrorMessage(
    dismissFieldErrors,
    "dismissalReason",
  );

  function openResolveConfirmation() {
    if (anyPending) {
      return;
    }
    setDismissState({ kind: "idle" });
    setDismissalReason("");
    setResolveState({ kind: "idle" });
    setConfirmationMode("resolve");
  }

  function openDismissConfirmation() {
    if (anyPending) {
      return;
    }
    setResolveState({ kind: "idle" });
    setResolutionReason("");
    setDismissState({ kind: "idle" });
    setConfirmationMode("dismiss");
  }

  function cancelConfirmation(mode: "resolve" | "dismiss") {
    if (anyPending) {
      return;
    }
    setConfirmationMode(null);
    if (mode === "resolve") {
      setResolveState({ kind: "idle" });
      setResolutionReason("");
      queueMicrotask(() => resolveOpenerRef.current?.focus());
    } else {
      setDismissState({ kind: "idle" });
      setDismissalReason("");
      queueMicrotask(() => dismissOpenerRef.current?.focus());
    }
  }

  async function runTerminalMutation(params: {
    action: "resolve" | "dismiss";
    reason: string;
    reasonField: "resolutionReason" | "dismissalReason";
    setState: (state: AttentionLifecycleActionUiState) => void;
    pendingRef: MutableRefObject<boolean>;
    reasonRef: MutableRefObject<HTMLTextAreaElement | null>;
    invoke: (trimmedReason: string) => Promise<
      Awaited<ReturnType<typeof resolveAttentionItemAction>>
    >;
  }) {
    if (params.pendingRef.current || anyPending) {
      return;
    }

    const trimmedReason = params.reason.trim();
    if (!trimmedReason) {
      params.setState({
        kind: "field_error",
        fieldErrors: {
          [params.reasonField]: ["A reason is required."],
        },
        message: "Please correct the highlighted fields and try again.",
      });
      params.reasonRef.current?.focus();
      return;
    }

    if (trimmedReason.length > ATTENTION_REASON_MAX_LENGTH) {
      params.setState({
        kind: "field_error",
        fieldErrors: {
          [params.reasonField]: [
            `Keep the reason within ${ATTENTION_REASON_MAX_LENGTH} characters.`,
          ],
        },
        message: "Please correct the highlighted fields and try again.",
      });
      params.reasonRef.current?.focus();
      return;
    }

    params.pendingRef.current = true;
    params.setState(createPendingAttentionLifecycleActionState(params.action));

    const result = await params.invoke(trimmedReason);
    const next = interpretAttentionLifecycleMutationResult(result);
    params.setState(next);

    if (
      next.kind === "success" ||
      next.kind === "noop_success" ||
      next.kind === "conflict"
    ) {
      router.refresh();
    }

    if (next.kind === "field_error") {
      params.reasonRef.current?.focus();
    }

    params.pendingRef.current = false;
  }

  async function handleResolveConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTerminalMutation({
      action: "resolve",
      reason: resolutionReason,
      reasonField: "resolutionReason",
      setState: setResolveState,
      pendingRef: resolvePendingRef,
      reasonRef: resolveReasonRef,
      invoke: (trimmedReason) =>
        resolveAttentionItemAction({
          organizationId,
          attentionItemId,
          resolutionReason: trimmedReason,
          returnPath,
        }),
    });
  }

  async function handleDismissConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTerminalMutation({
      action: "dismiss",
      reason: dismissalReason,
      reasonField: "dismissalReason",
      setState: setDismissState,
      pendingRef: dismissPendingRef,
      reasonRef: dismissReasonRef,
      invoke: (trimmedReason) =>
        dismissAttentionItemAction({
          organizationId,
          attentionItemId,
          dismissalReason: trimmedReason,
          returnPath,
        }),
    });
  }

  return (
    <section
      className={styles.lifecycleActions}
      aria-labelledby="attention-resolution-dismiss-heading"
    >
      <h2 id="attention-resolution-dismiss-heading">Resolve or dismiss</h2>
      <p className={styles.intro}>
        End follow-up for this attention item. Both actions require a reason and
        an explicit confirmation. They do not delete the item.
      </p>

      {showResolve ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-resolve-heading">Resolve</h3>
          <p className={styles.actionDescription}>
            Mark this item as resolved when the underlying issue has been handled.
          </p>

          {confirmationMode !== "resolve" ? (
            <button
              type="button"
              ref={resolveOpenerRef}
              className={styles.primaryButton}
              onClick={openResolveConfirmation}
              disabled={anyPending}
              aria-expanded={false}
              aria-controls="attention-resolve-confirmation"
            >
              Resolve
            </button>
          ) : (
            <div
              id="attention-resolve-confirmation"
              className={styles.confirmationPanel}
              role="region"
              aria-labelledby="attention-resolve-confirm-title"
            >
              <h4 id="attention-resolve-confirm-title">Confirm resolve</h4>
              <p className={styles.actionDescription}>
                Resolving sets status to Resolved for &ldquo;{itemTitleLabel}
                &rdquo;. Provide a reason, then confirm.
              </p>
              <FeedbackRegion state={resolveState} reloadHref={returnPath} />
              <form
                className={styles.actionForm}
                onSubmit={handleResolveConfirm}
                aria-busy={resolveState.kind === "pending"}
                noValidate
              >
                <div className={styles.field}>
                  <label htmlFor="attention-resolution-reason">
                    Resolution reason
                  </label>
                  <p
                    id="attention-resolution-reason-help"
                    className={styles.fieldHelp}
                  >
                    Required. Maximum {ATTENTION_REASON_MAX_LENGTH} characters.
                  </p>
                  <textarea
                    id="attention-resolution-reason"
                    ref={resolveReasonRef}
                    name="resolutionReason"
                    value={resolutionReason}
                    onChange={(event) => setResolutionReason(event.target.value)}
                    required
                    maxLength={ATTENTION_REASON_MAX_LENGTH}
                    rows={4}
                    disabled={anyPending}
                    aria-invalid={Boolean(resolveReasonError)}
                    aria-describedby={
                      resolveReasonError
                        ? "attention-resolution-reason-help attention-resolution-reason-error"
                        : "attention-resolution-reason-help"
                    }
                  />
                  {resolveReasonError ? (
                    <p
                      id="attention-resolution-reason-error"
                      className={styles.fieldError}
                    >
                      {resolveReasonError}
                    </p>
                  ) : null}
                </div>
                <div className={styles.actionRow}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={anyPending}
                  >
                    {resolveState.kind === "pending"
                      ? "Resolving…"
                      : "Confirm resolve"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => cancelConfirmation("resolve")}
                    disabled={anyPending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      {showDismiss ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-dismiss-heading">Dismiss</h3>
          <p className={styles.actionDescription}>
            Mark this item as dismissed when it will not be followed up further.
            The item is kept for history and is not deleted.
          </p>

          {confirmationMode !== "dismiss" ? (
            <button
              type="button"
              ref={dismissOpenerRef}
              className={styles.secondaryButton}
              onClick={openDismissConfirmation}
              disabled={anyPending}
              aria-expanded={false}
              aria-controls="attention-dismiss-confirmation"
            >
              Dismiss
            </button>
          ) : (
            <div
              id="attention-dismiss-confirmation"
              className={styles.confirmationPanel}
              role="region"
              aria-labelledby="attention-dismiss-confirm-title"
            >
              <h4 id="attention-dismiss-confirm-title">Confirm dismiss</h4>
              <p className={styles.actionDescription}>
                Dismissing sets status to Dismissed for &ldquo;{itemTitleLabel}
                &rdquo;. Provide a reason, then confirm.
              </p>
              <FeedbackRegion state={dismissState} reloadHref={returnPath} />
              <form
                className={styles.actionForm}
                onSubmit={handleDismissConfirm}
                aria-busy={dismissState.kind === "pending"}
                noValidate
              >
                <div className={styles.field}>
                  <label htmlFor="attention-dismissal-reason">
                    Dismissal reason
                  </label>
                  <p
                    id="attention-dismissal-reason-help"
                    className={styles.fieldHelp}
                  >
                    Required. Maximum {ATTENTION_REASON_MAX_LENGTH} characters.
                    Explain why follow-up stops.
                  </p>
                  <textarea
                    id="attention-dismissal-reason"
                    ref={dismissReasonRef}
                    name="dismissalReason"
                    value={dismissalReason}
                    onChange={(event) => setDismissalReason(event.target.value)}
                    required
                    maxLength={ATTENTION_REASON_MAX_LENGTH}
                    rows={4}
                    disabled={anyPending}
                    aria-invalid={Boolean(dismissReasonError)}
                    aria-describedby={
                      dismissReasonError
                        ? "attention-dismissal-reason-help attention-dismissal-reason-error"
                        : "attention-dismissal-reason-help"
                    }
                  />
                  {dismissReasonError ? (
                    <p
                      id="attention-dismissal-reason-error"
                      className={styles.fieldError}
                    >
                      {dismissReasonError}
                    </p>
                  ) : null}
                </div>
                <div className={styles.actionRow}>
                  <button
                    type="submit"
                    className={styles.dismissConfirmButton}
                    disabled={anyPending}
                  >
                    {dismissState.kind === "pending"
                      ? "Dismissing…"
                      : "Confirm dismiss"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => cancelConfirmation("dismiss")}
                    disabled={anyPending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
