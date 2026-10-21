"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  executeOnboardingInviteIntentAction,
  reconcileOnboardingInviteIntentAction,
} from "@/features/onboarding/actions/onboarding-invite-execution-actions";
import type { OnboardingCompletionRunStatus } from "@/features/onboarding/domain/onboarding-completion-run";
import {
  creatingRunStatusMessage,
  isMaterialSequenceStopInvitationResultCode,
  isRetryableInvitationResultCode,
  isTerminalInvitationResultCode,
  nextExecutableIntentId,
  onboardingInvitationResultMessage,
  resolvedOutcomeCount,
  type OnboardingInviteExecutionResult,
  type OnboardingInviteIntentOutcome,
  type OnboardingInvitationResultCode,
} from "@/features/onboarding/domain/onboarding-invite-execution";
import type { TeamInviteIntent } from "@/features/onboarding/domain/team-invite-intents";
import { OnboardingShell } from "./onboarding-shell";
import styles from "./onboarding-creating.module.css";

export type CreatingSurfaceState =
  | "not_started"
  | "in_progress"
  | "partial"
  | "awaiting_next_step";

export type CreatingIntentView = {
  intent: TeamInviteIntent;
  outcome: OnboardingInviteIntentOutcome | null;
};

export type OnboardingCreatingProps = {
  organizationId: string;
  initialIntents: TeamInviteIntent[];
  initialOutcomes: OnboardingInviteIntentOutcome[];
  initialRunStatus: OnboardingCompletionRunStatus | null;
};

function roleLabel(role: TeamInviteIntent["role"]): string {
  return `${role[0].toUpperCase()}${role.slice(1)}`;
}

export function outcomesByIntentId(
  outcomes: OnboardingInviteIntentOutcome[],
): Map<string, OnboardingInvitationResultCode> {
  const map = new Map<string, OnboardingInvitationResultCode>();
  for (const outcome of outcomes) {
    map.set(outcome.intentId, outcome.resultCode);
  }
  return map;
}

export function mergeOutcome(
  outcomes: OnboardingInviteIntentOutcome[],
  next: OnboardingInviteIntentOutcome,
): OnboardingInviteIntentOutcome[] {
  const remaining = outcomes.filter(
    (outcome) => outcome.intentId !== next.intentId,
  );
  return [...remaining, next];
}

export function resolveCreatingSurfaceState(
  intents: TeamInviteIntent[],
  outcomes: OnboardingInviteIntentOutcome[],
  executing: boolean,
  stopped: boolean,
): CreatingSurfaceState {
  if (executing) {
    return "in_progress";
  }
  if (intents.length === 0) {
    return "awaiting_next_step";
  }

  const codes = outcomesByIntentId(outcomes);
  const nextId = nextExecutableIntentId(intents, codes, stopped);
  const resolved = resolvedOutcomeCount(codes.values());

  if (nextId === null && resolved > 0) {
    return "awaiting_next_step";
  }
  if (resolved > 0 || stopped) {
    return "partial";
  }
  return "not_started";
}

export async function runInvitationExecutionSequence(options: {
  organizationId: string;
  intents: TeamInviteIntent[];
  outcomes: OnboardingInviteIntentOutcome[];
  execute: typeof executeOnboardingInviteIntentAction;
  shouldAbort: () => boolean;
  onOutcome: (outcome: OnboardingInviteIntentOutcome) => void;
  onFailure: (message: string) => void;
}): Promise<"completed" | "stopped"> {
  const codes = outcomesByIntentId(options.outcomes);
  const attemptedThisActivation = new Set<string>();

  for (const intent of options.intents) {
    if (options.shouldAbort()) {
      return "stopped";
    }

    const existing = codes.get(intent.id);
    if (existing && isTerminalInvitationResultCode(existing)) {
      continue;
    }
    if (attemptedThisActivation.has(intent.id)) {
      return "stopped";
    }

    attemptedThisActivation.add(intent.id);
    const result = await options.execute({
      organizationId: options.organizationId,
      intentId: intent.id,
    });
    if (options.shouldAbort()) {
      return "stopped";
    }

    if (!result.ok) {
      options.onFailure(result.message);
      return "stopped";
    }

    codes.set(intent.id, result.outcome.resultCode);
    options.onOutcome(result.outcome);

    if (
      isMaterialSequenceStopInvitationResultCode(result.outcome.resultCode)
    ) {
      return "stopped";
    }
  }

  return "completed";
}

export function CreatingStatusCopy({
  state,
  runStatus,
  resolvedCount,
  totalCount,
}: {
  state: CreatingSurfaceState;
  runStatus: OnboardingCompletionRunStatus | null;
  resolvedCount: number;
  totalCount: number;
}) {
  if (totalCount === 0) {
    return (
      <>
        <strong>No teammates to invite</strong>
        <span>
          No teammates were prepared to invite. Invitation setup is finished
          for now. The next setup step is not available yet.
        </span>
      </>
    );
  }

  if (state === "in_progress") {
    return (
      <>
        <strong>Creating invitations</strong>
        <span>
          {resolvedCount} of {totalCount} teammates processed. Progress updates
          only after a real invitation result is recorded.
        </span>
      </>
    );
  }

  if (state === "awaiting_next_step") {
    return (
      <>
        <strong>Invitation setup paused here</strong>
        <span>{creatingRunStatusMessage(runStatus)}</span>
      </>
    );
  }

  if (state === "partial") {
    return (
      <>
        <strong>Some invitations need attention</strong>
        <span>
          {resolvedCount} of {totalCount} teammates processed. Retry is
          available where the current result is not final.
        </span>
      </>
    );
  }

  return (
      <>
        <strong>Invitations not created yet</strong>
        <span>
          Your saved team setup is frozen. Invitations are created one teammate
          at a time through the workspace authority. No invitation email is
          claimed here.
        </span>
      </>
    );
}

export function OnboardingCreating({
  organizationId,
  initialIntents,
  initialOutcomes,
  initialRunStatus,
}: OnboardingCreatingProps) {
  const headingId = useId();
  const statusId = useId();
  const [intents] = useState(initialIntents);
  const [outcomes, setOutcomes] = useState(initialOutcomes);
  const [runStatus, setRunStatus] = useState(initialRunStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);
  const [sequenceActive, setSequenceActive] = useState(false);
  const mutationOwnerRef = useRef<number | null>(null);
  const mutationTokenRef = useRef(0);
  const abortRef = useRef(false);
  const startControlRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  function acquireMutation(intentId: string): number | null {
    if (mutationOwnerRef.current !== null) {
      return null;
    }
    const token = mutationTokenRef.current + 1;
    mutationTokenRef.current = token;
    mutationOwnerRef.current = token;
    setPendingIntentId(intentId);
    return token;
  }

  function releaseMutation(token: number) {
    if (mutationOwnerRef.current !== token) {
      return;
    }
    mutationOwnerRef.current = null;
    setPendingIntentId(null);
    setSequenceActive(false);
  }

  function acceptOutcome(outcome: OnboardingInviteIntentOutcome) {
    setOutcomes((current) => mergeOutcome(current, outcome));
    setRunStatus(outcome.runStatus);
  }

  async function handleStart() {
    if (mutationOwnerRef.current !== null) {
      return;
    }

    const nextId = nextExecutableIntentId(
      intents,
      outcomesByIntentId(outcomes),
      false,
    );
    if (!nextId) {
      return;
    }

    const token = acquireMutation(nextId);
    if (token === null) {
      return;
    }

    setSequenceActive(true);
    setMessage(null);
    abortRef.current = false;
    try {
      await runInvitationExecutionSequence({
        organizationId,
        intents,
        outcomes,
        execute: executeOnboardingInviteIntentAction,
        shouldAbort: () => abortRef.current,
        onOutcome: acceptOutcome,
        onFailure: setMessage,
      });
    } finally {
      releaseMutation(token);
      startControlRef.current?.focus();
    }
  }

  async function handleRetry(intentId: string) {
    if (mutationOwnerRef.current !== null) {
      return;
    }

    const token = acquireMutation(intentId);
    if (token === null) {
      return;
    }

    setMessage(null);
    try {
      const result: OnboardingInviteExecutionResult =
        await executeOnboardingInviteIntentAction({
          organizationId,
          intentId,
        });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      acceptOutcome(result.outcome);
    } finally {
      releaseMutation(token);
    }
  }

  async function handleReconcile(intentId: string) {
    if (mutationOwnerRef.current !== null) {
      return;
    }

    const token = acquireMutation(`reconcile:${intentId}`);
    if (token === null) {
      return;
    }

    setMessage(null);
    try {
      const result = await reconcileOnboardingInviteIntentAction({
        organizationId,
        intentId,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      acceptOutcome(result.outcome);
    } finally {
      releaseMutation(token);
    }
  }

  const codes = outcomesByIntentId(outcomes);
  const executing = pendingIntentId !== null;
  const stopped = Boolean(message);
  const surfaceState = resolveCreatingSurfaceState(
    intents,
    outcomes,
    sequenceActive || executing,
    stopped,
  );
  const resolvedCount = resolvedOutcomeCount(codes.values());
  const remaining =
    nextExecutableIntentId(intents, codes, false) !== null;
  const showStartButton = remaining || sequenceActive;

  const actions = (
    <div className={styles.actions}>
      {showStartButton ? (
        <Button
          ref={startControlRef}
          type="button"
          size="action"
          disabled={executing}
          onClick={handleStart}
        >
          {sequenceActive ? "Creating invitations…" : "Create invitations"}
        </Button>
      ) : (
        <p className={styles.actionNote}>
          {surfaceState === "awaiting_next_step"
            ? "The next setup step is not available yet."
            : "Review the invitation results below."}
        </p>
      )}
    </div>
  );

  return (
    <OnboardingShell
      currentStep="team"
      headingId={headingId}
      actions={actions}
    >
      <Surface className={styles.surface}>
        <div className={styles.content}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Team invitations</p>
            <h1 id={headingId}>Create invitations</h1>
            <p>
              Each teammate is invited through the saved team setup. Progress
              appears only after the workspace records a real result.
            </p>
          </header>

          {message ? (
            <div className={styles.message} role="alert">
              {message}
            </div>
          ) : null}

          <div
            className={styles.setupStatus}
            role="status"
            aria-live="polite"
            id={statusId}
          >
            <CreatingStatusCopy
              state={surfaceState}
              runStatus={runStatus}
              resolvedCount={resolvedCount}
              totalCount={intents.length}
            />
          </div>

          <section
            className={styles.results}
            aria-labelledby="creating-intents-title"
          >
            <h2 id="creating-intents-title">Frozen team setup</h2>
            {intents.length === 0 ? (
              <p className={styles.emptyState}>
                No teammates are currently configured to be invited.
              </p>
            ) : (
              <ul className={styles.memberList}>
                {intents.map((intent) => {
                  const outcome =
                    outcomes.find((item) => item.intentId === intent.id) ??
                    null;
                  const resultCode = outcome?.resultCode ?? "not_attempted";
                  const retryable =
                    resultCode !== "not_attempted" &&
                    isRetryableInvitationResultCode(resultCode);
                  const pending =
                    pendingIntentId === intent.id ||
                    pendingIntentId === `reconcile:${intent.id}`;

                  return (
                    <li className={styles.member} key={intent.id}>
                      <span className={styles.memberIdentity}>
                        <strong>{intent.emailNormalized}</strong>
                        <span>
                          {onboardingInvitationResultMessage(resultCode)}
                        </span>
                      </span>
                      <span className={styles.role}>
                        {roleLabel(intent.role)}
                      </span>
                      <span className={styles.resultLabel}>
                        {resultCode === "not_attempted"
                          ? "Not started"
                          : resultCode === "already_member"
                            ? "Already a member"
                            : resultCode === "success"
                              ? "Invitation created"
                              : resultCode === "invite_already_pending"
                                ? "Invitation pending"
                                : resultCode ===
                                    "existing_membership_requires_admin_action"
                                  ? "Needs owner review"
                                  : resultCode === "invitation_proof_lost"
                                    ? "No longer current"
                                    : resultCode === "invalid_input"
                                      ? "Cannot invite"
                                      : resultCode === "rate_limited"
                                        ? "Temporarily limited"
                                        : resultCode === "forbidden"
                                          ? "Not permitted"
                                          : "Needs attention"}
                      </span>
                      {retryable ? (
                        <div className={styles.rowActions}>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={executing}
                            onClick={() => handleRetry(intent.id)}
                            aria-label={`Retry invitation for ${intent.emailNormalized}`}
                          >
                            {pending && pendingIntentId === intent.id
                              ? "Retrying…"
                              : "Retry"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={executing}
                            onClick={() => handleReconcile(intent.id)}
                            aria-label={`Refresh invitation status for ${intent.emailNormalized}`}
                          >
                            {pendingIntentId === `reconcile:${intent.id}`
                              ? "Refreshing…"
                              : "Refresh status"}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </Surface>
    </OnboardingShell>
  );
}
