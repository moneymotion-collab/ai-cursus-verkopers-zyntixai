"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { completeV2OnboardingAction } from "@/features/onboarding/actions/onboarding-actions";
import { buildCreatingOnboardingPath } from "@/features/onboarding/domain/onboarding-routes";
import { buildProductDestination } from "@/features/onboarding/domain/onboarding-steps";
import {
  canOfferExplicitCompletion,
  canOfferExplicitProductEntry,
  invitationEvidenceLabel,
  invitationResultLabel,
  isCoherentCompletedReadySnapshot,
  isReadyCompletionBlockedCode,
  readyInvitationDetail,
  type OnboardingReadySnapshot,
  type ReadyInvitationResult,
} from "@/features/onboarding/domain/onboarding-ready";
import { OnboardingShell } from "./onboarding-shell";
import styles from "./onboarding-ready.module.css";

export type OnboardingReadyProps = {
  snapshot: OnboardingReadySnapshot;
};

export function ReadyStatusCopy({
  snapshot,
  completing,
}: {
  snapshot: OnboardingReadySnapshot;
  completing: boolean;
}) {
  if (snapshot.organizationCompletedAt) {
    if (!isCoherentCompletedReadySnapshot(snapshot)) {
      return (
        <>
          <strong>Setup is complete</strong>
          <span>
            The workspace record is complete, but it cannot be opened from
            this screen until the setup record is consistent. Refresh or contact
            support.
          </span>
        </>
      );
    }

    return (
      <>
        <strong>Setup is complete</strong>
        <span>
          Onboarding is finished. Open ZyntixAI when you want to continue to
          the workspace. This does not send email or change invitations.
        </span>
      </>
    );
  }

  if (completing) {
    return (
      <>
        <strong>Finishing setup</strong>
        <span>Waiting for the workspace to confirm completion.</span>
      </>
    );
  }

  return (
    <>
      <strong>Ready to finish setup</strong>
      <span>
        Invitation results below come from the current workspace record. Enter
        ZyntixAI finishes onboarding only after you choose it.
      </span>
    </>
  );
}

export function ReadyInvitationRow({
  result,
}: {
  result: ReadyInvitationResult;
}) {
  const roleLabel = `${result.targetRole[0].toUpperCase()}${result.targetRole.slice(1)}`;

  return (
    <li className={styles.member}>
      <span className={styles.memberIdentity}>
        <strong>{result.emailNormalized}</strong>
        <span>{readyInvitationDetail(result)}</span>
        <span>{invitationEvidenceLabel(result.evidenceKind)}</span>
      </span>
      <span className={styles.role}>{roleLabel}</span>
      <span className={styles.resultLabel}>
        {invitationResultLabel(result.resultCode)}
      </span>
    </li>
  );
}

export async function requestExplicitCompletion(options: {
  organizationId: string;
  complete: typeof completeV2OnboardingAction;
}): Promise<Awaited<ReturnType<typeof completeV2OnboardingAction>>> {
  return options.complete({ organizationId: options.organizationId });
}

export function OnboardingReady({ snapshot }: OnboardingReadyProps) {
  const headingId = useId();
  const statusId = useId();
  const router = useRouter();
  const [current, setCurrent] = useState(snapshot);
  const [message, setMessage] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const mutationOwnerRef = useRef<number | null>(null);
  const mutationTokenRef = useRef(0);
  const completeControlRef = useRef<HTMLButtonElement>(null);

  const offerCompletion = canOfferExplicitCompletion({
    runStatus: current.runStatus,
    organizationCompletedAt: current.organizationCompletedAt,
    results: current.results,
  });
  const offerProductEntry = canOfferExplicitProductEntry(current);
  const productDestination = buildProductDestination(current.organizationId);

  function acquireMutation(): number | null {
    if (mutationOwnerRef.current !== null) {
      return null;
    }
    const token = mutationTokenRef.current + 1;
    mutationTokenRef.current = token;
    mutationOwnerRef.current = token;
    setCompleting(true);
    return token;
  }

  function releaseMutation(token: number) {
    if (mutationOwnerRef.current !== token) {
      return;
    }
    mutationOwnerRef.current = null;
    setCompleting(false);
  }

  async function handleComplete() {
    if (mutationOwnerRef.current !== null || !offerCompletion) {
      return;
    }

    const token = acquireMutation();
    if (token === null) {
      return;
    }

    setMessage(null);
    try {
      const result = await requestExplicitCompletion({
        organizationId: current.organizationId,
        complete: completeV2OnboardingAction,
      });
      if (!result.ok) {
        setMessage(result.message);
        if (isReadyCompletionBlockedCode(result.code)) {
          router.push(buildCreatingOnboardingPath(current.organizationId));
          return;
        }
        completeControlRef.current?.focus();
        return;
      }

      setCurrent(result.snapshot);
      router.refresh();
    } finally {
      releaseMutation(token);
    }
  }

  function handleProductEntry() {
    if (mutationOwnerRef.current !== null || !offerProductEntry) {
      return;
    }

    const token = acquireMutation();
    if (token === null) {
      return;
    }

    setMessage(null);
    try {
      router.push(productDestination);
    } catch {
      setMessage("We could not open the workspace. Please try again.");
      completeControlRef.current?.focus();
      releaseMutation(token);
    }
  }

  const actions = (
    <div className={styles.actions}>
      {offerProductEntry ? (
        <Button
          ref={completeControlRef}
          type="button"
          size="action"
          disabled={completing}
          aria-busy={completing}
          onClick={handleProductEntry}
        >
          {completing ? "Opening workspace…" : "Open ZyntixAI"}
        </Button>
      ) : current.organizationCompletedAt ? (
        <p className={styles.actionNote}>
          Setup is recorded as complete, but this workspace cannot be opened
          from this screen until the record is consistent.
        </p>
      ) : offerCompletion ? (
        <Button
          ref={completeControlRef}
          type="button"
          size="action"
          disabled={completing}
          aria-busy={completing}
          onClick={handleComplete}
        >
          {completing ? "Finishing setup…" : "Enter ZyntixAI"}
        </Button>
      ) : (
        <p className={styles.actionNote}>
          Finishing setup is available only when the workspace is currently
          ready.
        </p>
      )}
    </div>
  );

  return (
    <OnboardingShell
      currentStep="ready"
      headingId={headingId}
      actions={actions}
    >
      <Surface className={styles.surface}>
        <div className={styles.content}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Workspace ready</p>
            <h1 id={headingId}>
              {current.organizationCompletedAt
                ? "Setup is complete"
                : "Ready to enter ZyntixAI"}
            </h1>
            <p>
              This summary is rebuilt from the current workspace record. An
              invitation record means an invitation was created. This screen
              does not confirm email delivery.
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
            <ReadyStatusCopy snapshot={current} completing={completing} />
          </div>

          <section
            className={styles.summary}
            aria-labelledby="ready-workspace-title"
          >
            <h2 id="ready-workspace-title">Provisioned workspace</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <strong>{current.workspaceName}</strong>
                <span>Workspace name</span>
              </div>
              <div className={styles.summaryItem}>
                <strong>{current.operatingModelLabel}</strong>
                <span>Operating model</span>
              </div>
            </div>
          </section>

          <section
            className={styles.results}
            aria-labelledby="ready-results-title"
          >
            <h2 id="ready-results-title">Invitation results</h2>
            {current.results.length === 0 ? (
              <p className={styles.emptyState}>
                No teammates were prepared to invite. Completing setup does not
                send invitations.
              </p>
            ) : (
              <ul className={styles.memberList}>
                {current.results.map((result) => (
                  <ReadyInvitationRow
                    key={result.intentId}
                    result={result}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </Surface>
    </OnboardingShell>
  );
}
