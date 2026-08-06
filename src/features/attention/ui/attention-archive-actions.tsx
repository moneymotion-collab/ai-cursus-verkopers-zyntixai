"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MutableRefObject,
} from "react";
import { useRouter } from "next/navigation";
import { archiveAttentionItemAction } from "@/features/attention/actions/lifecycle-attention-actions";
import {
  createPendingAttentionLifecycleActionState,
  getAttentionLifecyclePendingLabel,
  interpretAttentionLifecycleMutationResult,
  shouldDisableAttentionLifecycleSubmit,
  type AttentionLifecycleActionUiState,
} from "@/features/attention/ui/attention-lifecycle-action-state";
import styles from "./attention-lifecycle-actions.module.css";

type AttentionArchiveActionsProps = {
  organizationId: string;
  attentionItemId: string;
  returnPath: string;
  itemTitleLabel: string;
  statusLabel: string;
  showArchive: boolean;
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
    return (
      <div className={styles.formSuccess} role="status" aria-live="polite">
        <p>Attention item archived.</p>
      </div>
    );
  }

  if (state.kind === "noop_success") {
    return (
      <div className={styles.formNotice} role="status" aria-live="polite">
        <p>This attention item is already archived.</p>
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

export function AttentionArchiveActions({
  organizationId,
  attentionItemId,
  returnPath,
  itemTitleLabel,
  statusLabel,
  showArchive,
}: AttentionArchiveActionsProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [archiveState, setArchiveState] = useState<AttentionLifecycleActionUiState>({
    kind: "idle",
  });

  useEffect(() => {
    if (confirming) {
      confirmRef.current?.focus();
    }
  }, [confirming]);

  if (!showArchive) {
    return null;
  }

  const locked = shouldDisableAttentionLifecycleSubmit(archiveState);

  function openConfirmation() {
    if (locked) {
      return;
    }
    setArchiveState({ kind: "idle" });
    setConfirming(true);
  }

  function cancelConfirmation() {
    if (locked) {
      return;
    }
    setConfirming(false);
    setArchiveState({ kind: "idle" });
    queueMicrotask(() => openerRef.current?.focus());
  }

  async function runArchive(
    setState: (state: AttentionLifecycleActionUiState) => void,
    pending: MutableRefObject<boolean>,
  ) {
    if (pending.current || locked) {
      return;
    }

    pending.current = true;
    setState(createPendingAttentionLifecycleActionState("archive"));

    const result = await archiveAttentionItemAction({
      organizationId,
      attentionItemId,
      returnPath,
    });

    const next = interpretAttentionLifecycleMutationResult(result);
    setState(next);

    if (
      next.kind === "success" ||
      next.kind === "noop_success" ||
      next.kind === "conflict"
    ) {
      router.refresh();
    }

    pending.current = false;
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runArchive(setArchiveState, pendingRef);
  }

  return (
    <section
      className={styles.lifecycleActions}
      aria-labelledby="attention-archive-actions-heading"
    >
      <h2 id="attention-archive-actions-heading">Archive</h2>
      <p className={styles.intro}>
        Archive this terminal attention item. The current status stays the same;
        archived items remain visible to owners and admins according to existing
        permissions.
      </p>

      <div className={styles.actionBlock}>
        <h3 id="attention-archive-heading">Archive item</h3>
        <p className={styles.actionDescription}>
          Soft-archive keeps the record for history. This is not a delete and does
          not change the terminal status.
        </p>

        {!confirming ? (
          <button
            type="button"
            ref={openerRef}
            className={styles.secondaryButton}
            onClick={openConfirmation}
            disabled={locked}
            aria-expanded={false}
            aria-controls="attention-archive-confirmation"
          >
            Archive
          </button>
        ) : (
          <div
            id="attention-archive-confirmation"
            className={styles.confirmationPanel}
            role="region"
            aria-labelledby="attention-archive-confirm-title"
          >
            <h4 id="attention-archive-confirm-title">Confirm archive</h4>
            <p className={styles.actionDescription}>
              Archive &ldquo;{itemTitleLabel}&rdquo; while keeping status{" "}
              {statusLabel}. Owners and admins can still open archived items;
              staff and viewers follow existing archived visibility rules.
            </p>
            <FeedbackRegion state={archiveState} reloadHref={returnPath} />
            <form
              className={styles.actionForm}
              onSubmit={handleConfirm}
              aria-busy={archiveState.kind === "pending"}
              noValidate
            >
              <div className={styles.actionRow}>
                <button
                  type="submit"
                  ref={confirmRef}
                  className={styles.dismissConfirmButton}
                  disabled={locked}
                >
                  {archiveState.kind === "pending" ? "Archiving…" : "Confirm archive"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={cancelConfirmation}
                  disabled={locked}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
