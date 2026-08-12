"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation-action";
import { revokeInvitationAction } from "@/features/invitations/actions/revoke-invitation-action";
import styles from "./pending-invitation-actions.module.css";

export type PendingInvitationActionsProps = {
  organizationId: string;
  invitationId: string;
  emailLabel: string;
  canResend: boolean;
  canRevoke: boolean;
};

type ActionFeedback =
  | { kind: "idle" }
  | { kind: "resending" }
  | { kind: "revoking" }
  | { kind: "confirm_revoke" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function PendingInvitationActions({
  organizationId,
  invitationId,
  emailLabel,
  canResend,
  canRevoke,
}: PendingInvitationActionsProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [feedback, setFeedback] = useState<ActionFeedback>({ kind: "idle" });

  if (!canResend && !canRevoke) {
    return null;
  }

  const busy =
    feedback.kind === "resending" || feedback.kind === "revoking";
  const showRevokeConfirm =
    feedback.kind === "confirm_revoke" || feedback.kind === "revoking";

  async function handleResend() {
    if (pendingRef.current || busy || !canResend) {
      return;
    }

    pendingRef.current = true;
    setFeedback({ kind: "resending" });

    try {
      const result = await resendInvitationAction({
        organizationId,
        invitationId,
      });

      if (result.ok) {
        setFeedback({ kind: "success", message: result.message });
        router.refresh();
      } else {
        setFeedback({ kind: "error", message: result.message });
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to resend the invitation right now. Please try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  async function handleRevokeConfirm() {
    if (pendingRef.current || busy || !canRevoke) {
      return;
    }

    pendingRef.current = true;
    setFeedback({ kind: "revoking" });

    try {
      const result = await revokeInvitationAction({
        organizationId,
        invitationId,
      });

      if (result.ok) {
        setFeedback({ kind: "success", message: result.message });
        router.refresh();
      } else {
        setFeedback({ kind: "error", message: result.message });
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to revoke the invitation right now. Please try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <div className={styles.actions}>
      {showRevokeConfirm ? (
        <div
          className={styles.confirmPanel}
          role="group"
          aria-label={`Confirm revoke invitation for ${emailLabel}`}
        >
          <p className={styles.confirmText}>
            Revoke invitation for {emailLabel}?
          </p>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busy}
              onClick={() => setFeedback({ kind: "idle" })}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              disabled={busy}
              aria-busy={feedback.kind === "revoking"}
              onClick={() => {
                void handleRevokeConfirm();
              }}
            >
              {feedback.kind === "revoking"
                ? "Revoking…"
                : "Revoke invitation"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.buttonRow}>
          {canResend ? (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busy}
              aria-busy={feedback.kind === "resending"}
              aria-label={`Resend invitation for ${emailLabel}`}
              onClick={() => {
                void handleResend();
              }}
            >
              {feedback.kind === "resending" ? "Resending…" : "Resend"}
            </button>
          ) : null}
          {canRevoke ? (
            <button
              type="button"
              className={styles.dangerButton}
              disabled={busy}
              aria-label={`Revoke invitation for ${emailLabel}`}
              onClick={() => setFeedback({ kind: "confirm_revoke" })}
            >
              Revoke
            </button>
          ) : null}
        </div>
      )}

      {feedback.kind === "success" ? (
        <p className={styles.success} role="status" aria-live="polite">
          {feedback.message}
        </p>
      ) : null}
      {feedback.kind === "error" ? (
        <p className={styles.error} role="alert" aria-live="assertive">
          {feedback.message}
        </p>
      ) : null}
      {feedback.kind === "resending" || feedback.kind === "revoking" ? (
        <p className={styles.pending} role="status" aria-live="polite">
          {feedback.kind === "resending"
            ? "Resending invitation…"
            : "Revoking invitation…"}
        </p>
      ) : null}
    </div>
  );
}
