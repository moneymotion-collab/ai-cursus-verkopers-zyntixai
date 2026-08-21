"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  abandonPendingSocialConnectionAction,
  abandonQueuedSocialPublicationAction,
  reclaimStaleSocialPublicationAction,
  requestSocialPublicationRetryAction,
  resolveUnknownExternalPublicationAction,
} from "@/features/social-media/actions/b19-lifecycle-actions";
import { formatSocialCalendarInstant } from "@/features/social-media/domain/calendar-timezone";
import styles from "./b19-lifecycle-panel.module.css";

type ConnectionRow = {
  id: string;
  provider: string;
  status: string;
  professionalAccountType: string | null;
  displayName: string | null;
  operationalHealth: string;
  reauthorizationRequired: boolean;
  canAbandonPending: boolean;
};

type AttemptRow = {
  id: string;
  attemptNumber: number;
  outcome: string;
  timelineStage: string;
  ambiguous: boolean;
  safeRetryEligible: boolean;
  startedAt: string;
  finishedAt: string | null;
  safeErrorCode: string | null;
};

type PublicationRow = {
  id: string;
  status: string;
  contentFormat: string | null;
  createdAt: string;
  intendedExecuteAt: string;
  executionMode: string;
  connectionId: string;
  attemptCount: number;
  hasExternalPublicationId: boolean;
  operatorAction: string;
  actionBlockedReason: string | null;
  attempts: AttemptRow[];
};

type B19LifecyclePanelProps = {
  organizationId: string;
  publishingEnabled: boolean;
  timeZone: string;
  connections: ConnectionRow[];
  publications: PublicationRow[];
  healthyConnectedCount: number;
  pendingShellCount: number;
  queuedPublicationCount: number;
  succeededPublicationCount: number;
};

function scheduledLabel(
  intendedExecuteAt: string,
  timeZone: string,
): string {
  const formatted = formatSocialCalendarInstant(intendedExecuteAt, timeZone);
  if (!formatted) {
    return intendedExecuteAt;
  }
  return `${formatted.dateLabel} ${formatted.timeLabel} ${timeZone}`;
}

function failureMessage(code: string): string {
  switch (code) {
    case "forbidden":
      return "Only Owner or Admin may perform this action.";
    case "conflict":
      return "Lifecycle conflict — status no longer allows this action.";
    case "lease_active":
      return "Execution lease is still active.";
    case "already_terminal":
      return "Object is already terminal.";
    case "external_id_required":
      return "Cannot confirm published without an existing opaque external id.";
    case "rate_limited":
      return "Rate limited. Try again later.";
    case "not_found":
      return "Row was not found in this organization.";
    default:
      return "Lifecycle action failed.";
  }
}

export function B19LifecyclePanel({
  organizationId,
  publishingEnabled,
  timeZone,
  connections,
  publications,
  healthyConnectedCount,
  pendingShellCount,
  queuedPublicationCount,
  succeededPublicationCount,
}: B19LifecyclePanelProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function runAction(label: string, fn: () => Promise<{ ok: boolean; code?: string; resultCode?: string }>) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setFeedback(`Running: ${label}…`);
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result.ok) {
          setFeedback(failureMessage(result.code ?? "internal_error"));
          return;
        }
        setFeedback(`OK: ${result.resultCode ?? "success"}`);
        router.refresh();
      } catch {
        setFeedback("Lifecycle action failed.");
      } finally {
        pendingRef.current = false;
      }
    });
  }

  return (
    <div className={styles.root}>
      <section className={styles.summary} aria-label="Lifecycle summary">
        <p>
          Publishing:{" "}
          <strong>{publishingEnabled ? "ON" : "OFF (fail-closed)"}</strong>
        </p>
        <p>
          Healthy connected: {healthyConnectedCount} · Pending shells (history):{" "}
          {pendingShellCount} · Active queue: {queuedPublicationCount} ·
          Succeeded: {succeededPublicationCount}
        </p>
        <p className={styles.notice}>
          Historical leftovers stay visible until an Owner/Admin abandons them.
          These actions do not call Instagram.
        </p>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </section>

      <section aria-labelledby="b19-connections-title">
        <h2 id="b19-connections-title">Connections</h2>
        {connections.length === 0 ? (
          <p>No connections.</p>
        ) : (
          <ul className={styles.list}>
            {connections.map((connection) => (
              <li key={connection.id} className={styles.card}>
                <p>
                  {connection.provider} · {connection.status} · health{" "}
                  {connection.operationalHealth}
                  {connection.displayName ? ` · ${connection.displayName}` : ""}
                  {connection.professionalAccountType
                    ? ` · ${connection.professionalAccountType}`
                    : ""}
                  {connection.reauthorizationRequired
                    ? " · reauthorization required"
                    : ""}
                </p>
                <p className={styles.meta}>id …{connection.id.slice(-8)}</p>
                {connection.canAbandonPending ? (
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() =>
                      runAction("abandon pending connection", () =>
                        abandonPendingSocialConnectionAction({
                          organizationId,
                          connectionId: connection.id,
                        }),
                      )
                    }
                  >
                    Abandon pending shell
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="b19-publications-title">
        <h2 id="b19-publications-title">Publications</h2>
        {publications.length === 0 ? (
          <p>No publications.</p>
        ) : (
          <ul className={styles.list}>
            {publications.map((publication) => (
              <li key={publication.id} className={styles.card}>
                <p>
                  {publication.contentFormat ?? "format?"} · {publication.status} ·
                  attempts {publication.attemptCount} · external id{" "}
                  {publication.hasExternalPublicationId ? "present" : "absent"}
                </p>
                <p className={styles.meta}>
                  created {publication.createdAt}
                  {publication.executionMode === "scheduled"
                    ? ` · scheduled for ${scheduledLabel(
                        publication.intendedExecuteAt,
                        timeZone,
                      )}`
                    : ""}{" "}
                  · connection …{publication.connectionId.slice(-8)} · pub …
                  {publication.id.slice(-8)}
                </p>
                {publication.actionBlockedReason ? (
                  <p className={styles.blocked}>
                    Action blocked: {publication.actionBlockedReason}
                  </p>
                ) : null}

                {publication.operatorAction === "abandon" ? (
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() =>
                      runAction("abandon queued publication", () =>
                        abandonQueuedSocialPublicationAction({
                          organizationId,
                          publicationId: publication.id,
                        }),
                      )
                    }
                  >
                    Abandon queued
                  </button>
                ) : null}

                {publication.operatorAction === "reclaim_stale" ? (
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() =>
                      runAction("reclaim stale execution", () =>
                        reclaimStaleSocialPublicationAction({
                          organizationId,
                          publicationId: publication.id,
                        }),
                      )
                    }
                  >
                    Reclaim stale lease
                  </button>
                ) : null}

                {publication.operatorAction === "request_retry" ? (
                  <button
                    type="button"
                    className={styles.button}
                    disabled={pending}
                    onClick={() =>
                      runAction("request retry (queue only)", () =>
                        requestSocialPublicationRetryAction({
                          organizationId,
                          publicationId: publication.id,
                        }),
                      )
                    }
                  >
                    Request retry (re-queue)
                  </button>
                ) : null}

                {publication.operatorAction === "resolve_unknown" ? (
                  <div className={styles.resolveRow}>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={pending}
                      onClick={() =>
                        runAction("resolve not published", () =>
                          resolveUnknownExternalPublicationAction({
                            organizationId,
                            publicationId: publication.id,
                            resolution: "confirm_not_published",
                          }),
                        )
                      }
                    >
                      Confirm not published
                    </button>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={pending}
                      onClick={() =>
                        runAction("retain manual intervention", () =>
                          resolveUnknownExternalPublicationAction({
                            organizationId,
                            publicationId: publication.id,
                            resolution: "retain_manual_intervention",
                          }),
                        )
                      }
                    >
                      Retain manual intervention
                    </button>
                    {publication.hasExternalPublicationId ? (
                      <button
                        type="button"
                        className={styles.button}
                        disabled={pending}
                        onClick={() =>
                          runAction("confirm published (existing id)", () =>
                            resolveUnknownExternalPublicationAction({
                              organizationId,
                              publicationId: publication.id,
                              resolution:
                                "confirm_published_existing_external_id",
                            }),
                          )
                        }
                      >
                        Confirm published (existing id)
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {publication.attempts.length > 0 ? (
                  <ol className={styles.attempts}>
                    {publication.attempts.map((attempt) => (
                      <li key={attempt.id}>
                        #{attempt.attemptNumber} · {attempt.timelineStage} ·{" "}
                        {attempt.outcome}
                        {attempt.ambiguous ? " · ambiguous" : ""}
                        {attempt.safeRetryEligible
                          ? " · safe retry eligible"
                          : " · retry not auto-safe"}
                        {attempt.safeErrorCode
                          ? ` · ${attempt.safeErrorCode}`
                          : ""}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.meta}>No attempts yet.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
