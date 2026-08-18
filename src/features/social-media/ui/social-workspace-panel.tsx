"use client";

import { R1InstagramConnectPanel } from "@/features/social-media/ui/r1-instagram-connect-panel";
import { B18InstagramPublishPanel } from "@/features/social-media/ui/b18-instagram-publish-panel";
import { B19LifecyclePanel } from "@/features/social-media/ui/b19-lifecycle-panel";
import type { SocialSection } from "@/features/social-media/domain/social-navigation";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
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

  const nextSteps: string[] = [];
  if (!hasWorkspace) {
    nextSteps.push("Create a Social workspace by connecting Instagram.");
  } else if (!hasConnectedInstagram) {
    nextSteps.push("Connect a healthy Instagram Business account.");
  } else if (!publishingEnabled) {
    nextSteps.push(
      "Publishing is off. Prepare an image when ready; execution stays blocked until owner enablement.",
    );
  } else {
    nextSteps.push("Publishing is enabled. Prepare and execute only intentionally.");
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

  return (
    <div className={styles.root}>
      <nav className={styles.sectionNav} aria-label="Social sections">
        {(
          [
            ["overview", "Overview"],
            ["accounts", "Accounts"],
            ["publish", "Publish"],
            ["activity", "Activity"],
          ] as const
        ).map(([id, label]) => (
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
            <li>Healthy Instagram accounts: {healthyConnectedCount}</li>
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
            Beta 1 scope: Instagram account connection, controlled image
            publish (when enabled), and publication activity. Brand strategy,
            content calendar, and multi-format publishing are foundation-only
            and not exposed here yet.
          </p>
        </section>
      ) : null}

      {section === "accounts" ? (
        <section aria-labelledby="social-accounts-title">
          <h2 id="social-accounts-title">Accounts</h2>
          <p className={styles.copy}>
            Connect or review Instagram Business accounts for this organization.
          </p>
          <R1InstagramConnectPanel
            organizationId={organizationId}
            hasWorkspace={hasWorkspace}
            hasConnectedInstagram={hasConnectedInstagram}
          />
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

      {section === "publish" ? (
        <section aria-labelledby="social-publish-title">
          <h2 id="social-publish-title">Publish image</h2>
          <p className={styles.copy}>
            Prepare a feed image for Instagram. Execution stays fail-closed while
            publishing is off.
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
            publishingEnabled={publishingEnabled}
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
            publishingEnabled={publishingEnabled}
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
