import Link from "next/link";
import { SOCIAL_CLOSED_BETA_OPERATOR_ROUTE } from "@/features/social-media/domain/platform-operator-navigation";
import type { OperatorOrgDetail } from "@/features/social-media/server/platform-closed-beta-operator";
import { PlatformClosedBetaOperatorActions } from "@/features/social-media/ui/platform-closed-beta-operator-actions";
import styles from "./platform-closed-beta-operator-detail.module.css";

export function PlatformClosedBetaOperatorDetail(props: {
  detail: OperatorOrgDetail;
  globalPublishingEnabled: boolean;
}) {
  const { detail } = props;

  return (
    <section className={styles.root} aria-labelledby="operator-detail-title">
      <div className={styles.banner} role="status">
        {props.globalPublishingEnabled
          ? "Global Social publishing is currently ON."
          : "Global Social publishing is currently OFF."}
        {detail.enrollmentStatus === "publishing_allowed" &&
        !props.globalPublishingEnabled
          ? " Tenant publishing entitlement may be enabled, but provider execution remains blocked by the global kill switch."
          : null}
      </div>

      <p>
        <Link href={SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}>← Back to list</Link>
      </p>

      <header className={styles.header}>
        <p className={styles.eyebrow}>Internal operator</p>
        <h1 id="operator-detail-title">{detail.organizationName}</h1>
        <p className={styles.meta}>{detail.organizationId}</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="enrollment-title">
          <h2 id="enrollment-title">Enrollment</h2>
          <dl className={styles.dl}>
            <div>
              <dt>Status</dt>
              <dd>
                <code>{detail.enrollmentStatus}</code>
              </dd>
            </div>
            <div>
              <dt>Status before pause</dt>
              <dd>{detail.statusBeforePause ?? "—"}</dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{detail.enrollmentReason ?? "—"}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{detail.enrollmentUpdatedAt ?? "—"}</dd>
            </div>
          </dl>
          <PlatformClosedBetaOperatorActions
            organizationId={detail.organizationId}
            organizationName={detail.organizationName}
            currentStatus={detail.enrollmentStatus}
            statusBeforePause={detail.statusBeforePause}
            availableActions={detail.availableActions}
          />
        </section>

        <section className={styles.card} aria-labelledby="readiness-title">
          <h2 id="readiness-title">Social readiness</h2>
          <dl className={styles.dl}>
            <div>
              <dt>Social workspace</dt>
              <dd>{detail.hasSocialWorkspace ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Instagram connected</dt>
              <dd>{detail.instagramConnectionCount}</dd>
            </div>
            <div>
              <dt>Healthy connected</dt>
              <dd>{detail.healthyInstagramConnectionCount}</dd>
            </div>
            <div>
              <dt>Credential present</dt>
              <dd>{detail.credentialPresentCount > 0 ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>publish_image</dt>
              <dd>{detail.publishImageCapabilityCount > 0 ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Reauthorization required</dt>
              <dd>{detail.reauthorizationRequiredCount}</dd>
            </div>
            <div>
              <dt>Owner/Admin present</dt>
              <dd>{detail.hasOwnerOrAdmin ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.card} aria-labelledby="publishing-title">
          <h2 id="publishing-title">Publishing readiness</h2>
          <p>{detail.diagnostic.diagnosticSummary}</p>
          <p className={styles.meta}>
            Prepare allowed: {detail.diagnostic.prepareAllowed ? "Yes" : "No"}
          </p>
          <p className={styles.meta}>
            Publishing entitlement:{" "}
            {detail.diagnostic.publishingEntitlementAllowed ? "Yes" : "No"}
          </p>
          <p className={styles.meta}>
            {detail.diagnostic.executeBlockedReason ??
              "No execute block from entitlement/global gate alone."}
          </p>
          <p className={styles.meta}>
            Active {detail.activePublicationCount} · Queued{" "}
            {detail.queuedPublicationCount} · Succeeded{" "}
            {detail.succeededPublicationCount}
          </p>
          <p className={styles.note}>
            This screen never enables the global publishing kill switch and never
            calls Meta.
          </p>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="audit-title">
        <h2 id="audit-title">Enrollment audit</h2>
        {detail.events.length === 0 ? (
          <p className={styles.meta}>No enrollment events yet.</p>
        ) : (
          <ol className={styles.timeline}>
            {detail.events.map((event) => (
              <li key={event.eventId}>
                <div>
                  <strong>{event.eventType}</strong>
                  <span className={styles.meta}>
                    {" "}
                    {event.previousStatus ?? "absent"} → {event.nextStatus}
                  </span>
                </div>
                <div className={styles.meta}>
                  {event.createdAt} · {event.actorSource}
                  {event.reason ? ` · ${event.reason}` : ""}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
