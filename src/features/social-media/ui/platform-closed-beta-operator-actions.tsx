"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SocialClosedBetaOperatorAction } from "@/features/social-media/domain/closed-beta-enrollment";
import { nextClosedBetaStatusAfterAction } from "@/features/social-media/domain/closed-beta-enrollment";
import { mutateSocialClosedBetaEnrollmentAction } from "@/features/social-media/actions/mutate-social-closed-beta-enrollment-action";
import styles from "./platform-closed-beta-operator-actions.module.css";

const ACTION_LABELS: Record<SocialClosedBetaOperatorAction, string> = {
  enroll_approved: "Enroll / Approve",
  allow_publishing: "Allow Publishing",
  pause: "Pause",
  resume: "Resume",
  revoke: "Revoke",
};

const REQUIRES_CONFIRM: SocialClosedBetaOperatorAction[] = [
  "allow_publishing",
  "pause",
  "revoke",
];

function currentAsEnrollmentStatus(
  currentStatus: string,
): "approved" | "publishing_allowed" | "paused" | "revoked" | null {
  if (
    currentStatus === "approved" ||
    currentStatus === "publishing_allowed" ||
    currentStatus === "paused" ||
    currentStatus === "revoked"
  ) {
    return currentStatus;
  }
  return null;
}

export function PlatformClosedBetaOperatorActions(props: {
  organizationId: string;
  organizationName: string;
  currentStatus: string;
  statusBeforePause?: "approved" | "publishing_allowed" | null;
  availableActions: SocialClosedBetaOperatorAction[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] =
    useState<SocialClosedBetaOperatorAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function targetFor(action: SocialClosedBetaOperatorAction): string {
    const next = nextClosedBetaStatusAfterAction({
      current: currentAsEnrollmentStatus(props.currentStatus),
      action,
      statusBeforePause: props.statusBeforePause ?? null,
    });
    return next ?? "—";
  }

  function runAction(action: SocialClosedBetaOperatorAction, confirmed: boolean) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await mutateSocialClosedBetaEnrollmentAction({
        organizationId: props.organizationId,
        action,
        reason,
        confirm: confirmed,
      });
      if (!result.ok) {
        setError(
          result.code === "invalid_transition" || result.code === "conflict"
            ? "That transition is no longer valid. Refresh and try again."
            : "Unable to update enrollment. Try again.",
        );
        return;
      }
      setConfirmAction(null);
      setReason("");
      setMessage(
        `Updated ${props.organizationName}: ${result.previousStatus ?? "not_enrolled"} → ${result.nextStatus}`,
      );
      router.refresh();
    });
  }

  if (props.availableActions.length === 0) {
    return (
      <p className={styles.muted}>
        No enrollment actions available for this state (revoked is terminal).
      </p>
    );
  }

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="operator-reason-shared">
        Operator reason (optional)
      </label>
      <input
        id="operator-reason-shared"
        className={styles.input}
        maxLength={500}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={pending}
        placeholder="e.g. Approved after readiness check"
      />

      <div className={styles.actions}>
        {props.availableActions.map((action) => (
          <button
            key={action}
            type="button"
            className={
              action === "revoke" ? styles.dangerButton : styles.button
            }
            disabled={pending}
            onClick={() => {
              if (REQUIRES_CONFIRM.includes(action)) {
                setConfirmAction(action);
                setError(null);
                return;
              }
              runAction(action, true);
            }}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {confirmAction ? (
        <div
          className={styles.confirm}
          role="region"
          aria-label="Confirm enrollment change"
        >
          <p>
            Confirm <strong>{ACTION_LABELS[confirmAction]}</strong> for{" "}
            <strong>{props.organizationName}</strong>.
          </p>
          <p className={styles.muted}>
            State: <code>{props.currentStatus}</code> →{" "}
            <code>{targetFor(confirmAction)}</code>
          </p>
          <p className={styles.muted}>
            Social data, credentials, publications, and audit history are
            retained.
          </p>
          {confirmAction === "revoke" ? (
            <p className={styles.muted}>
              Revocation removes closed-beta operational authority but does not
              delete Social data, credentials, publications, or audit history.
            </p>
          ) : null}
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.button}
              disabled={pending}
              onClick={() => runAction(confirmAction, true)}
            >
              {pending ? "Working…" : "Confirm"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={pending}
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className={styles.success} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
