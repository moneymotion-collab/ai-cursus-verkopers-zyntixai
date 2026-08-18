"use client";

import { R1InstagramConnectPanel } from "@/features/social-media/ui/r1-instagram-connect-panel";
import { B18InstagramPublishPanel } from "@/features/social-media/ui/b18-instagram-publish-panel";
import { B19LifecyclePanel } from "@/features/social-media/ui/b19-lifecycle-panel";
import type { SocialSection } from "@/features/social-media/domain/social-navigation";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
import type { SocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import styles from "./social-workspace-panel.module.css";

type ConnectionRow = {
  id: string;
  provider: string;
  status: string;
  professionalAccountType: string | null;
  displayName: string | null;
  operationalHealth: string;
  reauthorizationRequired: boolean;
  canAbandonPending: boolean;
  capabilitySnapshot: string[];
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
  connectionId: string;
  attemptCount: number;
  hasExternalPublicationId: boolean;
  operatorAction: string;
  actionBlockedReason: string | null;
  isHistoricalLeftover: boolean;
  attempts: AttemptRow[];
};

type SocialWorkspacePanelProps = {
  organizationId: string;
  section: SocialSection;
  publishingEnabled: boolean;
  closedBeta: SocialClosedBetaCustomerReadModel;
  hasWorkspace: boolean;
  connections: ConnectionRow[];
  publications: PublicationRow[];
  healthyConnectedCount: number;
  pendingShellCount: number;
  activeQueueCount: number;
  historicalQueueCount: number;
  succeededPublicationCount: number;
  blockedPublicationCount: number;
  explicitPublicationId: string | null;
};

export function SocialWorkspacePanel({
  organizationId,
  section,
  publishingEnabled,
  closedBeta,
  hasWorkspace,
  connections,
  publications,
  healthyConnectedCount,
  pendingShellCount,
  activeQueueCount,
  historicalQueueCount,
  succeededPublicationCount,
  blockedPublicationCount,
  explicitPublicationId,
}: SocialWorkspacePanelProps) {
  const publishableConnections = connections.filter(
    (connection) =>
      connection.provider === "instagram" &&
      connection.status === "connected" &&
      connection.capabilitySnapshot.includes("publish_image") &&
      !connection.reauthorizationRequired,
  );
  const hasConnectedInstagram = publishableConnections.length > 0;
  const readOnly =
    closedBeta.enrollmentStatus === "paused" ||
    closedBeta.enrollmentStatus === "revoked";

  const nextSteps: string[] = [];
  if (closedBeta.nextRecommendedAction) {
    nextSteps.push(closedBeta.nextRecommendedAction);
  }
  if (!readOnly) {
    if (!hasWorkspace) {
      nextSteps.push("Create a Social workspace by connecting Instagram.");
    } else if (!hasConnectedInstagram) {
      nextSteps.push("Connect a healthy Instagram Business account.");
    } else if (closedBeta.prepareAllowed && !closedBeta.publishingEntitlementAllowed) {
      nextSteps.push(
        "Prepare image content when ready. Publishing access has not been enabled yet.",
      );
    } else if (
      closedBeta.publishingEntitlementAllowed &&
      !closedBeta.globalPublishingEnabled
    ) {
      nextSteps.push(
        "Prepare content while publishing is temporarily unavailable at platform level.",
      );
    }
  }
  if (pendingShellCount > 0) {
    nextSteps.push(
      `${pendingShellCount} historical pending shell(s) are in Activity history — they are not active accounts.`,
    );
  }
  if (blockedPublicationCount > 0) {
    nextSteps.push(
      `${blockedPublicationCount} publication(s) need operator attention in Activity.`,
    );
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Review Accounts and Activity for your existing Social history.");
  }

  const sectionLinks = (
    [
      ["overview", "Overview"],
      ["accounts", "Accounts"],
      ["publish", "Publish"],
      ["activity", "Activity"],
    ] as const
  ).filter(([id]) => {
    if (readOnly && (id === "publish" || id === "accounts")) {
      // Keep Accounts for historical connection visibility; hide Publish mutations.
      return id !== "publish";
    }
    return true;
  });

  return (
    <div className={styles.root}>
      <div className={styles.betaStatus} role="status">
        <strong>{closedBeta.betaBadgeLabel}</strong>
        <span>{closedBeta.customerBody}</span>
        {closedBeta.executeBlockedReason ? (
          <span>{closedBeta.executeBlockedReason}</span>
        ) : null}
      </div>

      <nav className={styles.sectionNav} aria-label="Social sections">
        {sectionLinks.map(([id, label]) => (
          <a
            key={id}
            className={
              section === id ? styles.sectionLinkActive : styles.sectionLink
            }
            href={buildSocialWorkspaceHref({
              organizationId,
              section: id,
            })}
            aria-current={section === id ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>

      {section === "overview" ? (
        <section className={styles.overview} aria-labelledby="social-overview-title">
          <h2 id="social-overview-title">Overview</h2>
          <ul className={styles.kpiList}>
            <li>
              Closed-beta status:{" "}
              {closedBeta.enrollmentStatus === "publishing_allowed"
                ? "Publishing access approved"
                : closedBeta.enrollmentStatus === "approved"
                  ? "Approved"
                  : closedBeta.enrollmentStatus === "paused"
                    ? "Paused"
                    : closedBeta.enrollmentStatus === "revoked"
                      ? "Revoked"
                      : closedBeta.enrollmentStatus}
            </li>
            <li>Healthy Instagram accounts: {healthyConnectedCount}</li>
            <li>
              Prepare: {closedBeta.prepareAllowed ? "Available" : "Not available"}
            </li>
            <li>
              Publishing entitlement:{" "}
              {closedBeta.publishingEntitlementAllowed
                ? "Approved"
                : "Not enabled"}
            </li>
            <li>
              Platform publishing:{" "}
              {closedBeta.globalPublishingEnabled
                ? "Available"
                : "Temporarily unavailable"}
            </li>
            <li>Active publish queue: {activeQueueCount}</li>
            <li>Succeeded publications: {succeededPublicationCount}</li>
            <li>Needs attention: {blockedPublicationCount}</li>
            <li>
              Historical leftovers (not active): {pendingShellCount} pending
              shells · {historicalQueueCount} queued fixtures
            </li>
          </ul>
          <div className={styles.nextSteps}>
            <h3>Next steps</h3>
            <ol>
              {nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <p className={styles.scopeNote}>
            Closed beta scope: Instagram account connection, controlled image
            publish (when enabled), and publication activity. Brand strategy,
            content calendar, Stories/Reels, multi-provider support, and
            analytics/AI features are not included here.
          </p>
        </section>
      ) : null}

      {section === "accounts" ? (
        <section aria-labelledby="social-accounts-title">
          <h2 id="social-accounts-title">Accounts</h2>
          <p className={styles.copy}>
            {readOnly
              ? "Existing Instagram connections remain visible. New connections are unavailable in this closed-beta state."
              : "Connect or review Instagram Business accounts for this organization."}
          </p>
          {closedBeta.connectAllowed ? (
            <R1InstagramConnectPanel
              organizationId={organizationId}
              hasWorkspace={hasWorkspace}
              hasConnectedInstagram={hasConnectedInstagram}
            />
          ) : (
            <p className={styles.copy} role="status">
              {closedBeta.enrollmentStatus === "paused"
                ? "Connecting Instagram is unavailable while Social beta access is paused."
                : closedBeta.enrollmentStatus === "revoked"
                  ? "Connecting Instagram is unavailable because closed-beta access is no longer active."
                  : "Connecting Instagram is unavailable for this organization."}
            </p>
          )}
          <ul className={styles.list}>
            {connections
              .filter((connection) => connection.status === "connected")
              .map((connection) => (
                <li key={connection.id} className={styles.card}>
                  {connection.provider} · {connection.displayName ?? "Connected"}{" "}
                  · health {connection.operationalHealth}
                  {connection.reauthorizationRequired
                    ? " · reauthorization required"
                    : ""}
                </li>
              ))}
          </ul>
          {pendingShellCount > 0 ? (
            <p className={styles.copy}>
              {pendingShellCount} historical pending shell(s) are listed under
              Activity and do not count as connected accounts.
            </p>
          ) : null}
        </section>
      ) : null}

      {section === "publish" && readOnly ? (
        <section aria-labelledby="social-publish-readonly-title">
          <h2 id="social-publish-readonly-title">Publish image</h2>
          <p className={styles.copy} role="status">
            {closedBeta.customerBody}
          </p>
        </section>
      ) : null}

      {section === "publish" && !readOnly ? (
        <section aria-labelledby="social-publish-title">
          <h2 id="social-publish-title">Publish image</h2>
          <p className={styles.copy}>
            {closedBeta.prepareAllowed
              ? closedBeta.publishingEntitlementAllowed
                ? closedBeta.globalPublishingEnabled
                  ? "Prepare and execute a feed image when connection readiness allows."
                  : "Prepare a feed image. Publishing is temporarily unavailable at platform level."
                : "Prepare a feed image. Publishing access has not been enabled for your organization yet."
              : "Prepare and publish are unavailable in this closed-beta state."}
          </p>
          <B18InstagramPublishPanel
            organizationId={organizationId}
            hasWorkspace={hasWorkspace}
            publishableConnections={publishableConnections.map((connection) => ({
              id: connection.id,
              displayName: connection.displayName,
              externalAccountId: null,
              capabilitySnapshot: connection.capabilitySnapshot,
            }))}
            publishingEnabled={
              publishingEnabled && closedBeta.publishingEntitlementAllowed
            }
            prepareAllowed={closedBeta.prepareAllowed}
            prepareBlockedReason={
              closedBeta.prepareAllowed
                ? null
                : closedBeta.executeBlockedReason ??
                  "Preparing content is unavailable for this organization."
            }
            executeBlockedReason={closedBeta.executeBlockedReason}
            initialPublicationId={explicitPublicationId}
          />
        </section>
      ) : null}

      {section === "activity" ? (
        <section aria-labelledby="social-activity-title">
          <h2 id="social-activity-title">Activity</h2>
          <p className={styles.copy}>
            Connection shells, publications, and attempt timelines. Historical
            leftovers stay visible here without counting as active work.
          </p>
          <B19LifecyclePanel
            organizationId={organizationId}
            publishingEnabled={
              publishingEnabled && closedBeta.publishingEntitlementAllowed
            }
            connections={connections}
            publications={publications}
            healthyConnectedCount={healthyConnectedCount}
            pendingShellCount={pendingShellCount}
            queuedPublicationCount={activeQueueCount}
            succeededPublicationCount={succeededPublicationCount}
          />
        </section>
      ) : null}
    </div>
  );
}
