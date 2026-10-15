import { AppShellChrome } from "@/components/app-shell-chrome";
import pageStyles from "@/app/(authenticated)/operator/social-beta/page.module.css";
import type { SocialClosedBetaOperatorAction } from "@/features/social-media/domain/closed-beta-enrollment";
import { buildSocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import { SOCIAL_CLOSED_BETA_OPERATOR_ROUTE } from "@/features/social-media/domain/platform-operator-navigation";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import { PlatformClosedBetaOperatorDetail } from "@/features/social-media/ui/platform-closed-beta-operator-detail";
import { PlatformClosedBetaOperatorList } from "@/features/social-media/ui/platform-closed-beta-operator-list";
import Link from "next/link";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const LONG_NAME =
  "AD11 example organization with a display name that wraps on a narrow operator screen";
const LONG_ID =
  "ad11-example-organization-identifier-that-wraps-across-the-operator-list";
const LONG_REASON =
  "AD11 example operator reason that stays readable when the enrollment card wraps on a narrow screen";

function diagnostic(
  status: "not_enrolled" | "approved" | "publishing_allowed" | "paused" | "revoked",
  globalOn: boolean,
  summary?: string,
) {
  const model = buildSocialClosedBetaCustomerReadModel({
    enrollmentStatus: status,
    socialPublishingEnabled: globalOn ? "true" : undefined,
  });
  return summary ? { ...model, diagnosticSummary: summary } : model;
}

function actionsFor(
  status: "not_enrolled" | "approved" | "publishing_allowed" | "paused" | "revoked",
): SocialClosedBetaOperatorAction[] {
  if (status === "not_enrolled") return ["enroll_approved"];
  if (status === "approved") return ["allow_publishing", "pause", "revoke"];
  if (status === "publishing_allowed") return ["pause", "revoke"];
  if (status === "paused") return ["resume", "revoke"];
  return [];
}

export function Ad11RecordsPreview({
  state,
}: {
  state: string;
  orgName: string;
}) {
  const long = state.endsWith("long");
  const name = long ? LONG_NAME : "AD11 example north studio";
  const organizationId = long ? LONG_ID : ORG;
  const denied = state === "operator-denied";
  const missing = state === "operator-missing";
  const list =
    state === "operator-list" ||
    state === "operator-long" ||
    state === "operator-empty" ||
    state === "operator-global-on";
  const status =
    state === "operator-paused"
      ? "paused"
      : state === "operator-revoked"
        ? "revoked"
        : state === "operator-publishing-off"
          ? "publishing_allowed"
          : "approved";
  const globalOn = state === "operator-global-on";

  return (
    <AppShellChrome
      activeNav="home"
      membersNavVisible={false}
      socialNavVisible={false}
      moduleNavVisibility={operatingModelNavVisibility("course_seller")}
      terminology={DEFAULT_PRODUCT_TERMINOLOGY}
      organizationOptions={[
        { organizationId: ORG, role: "owner", displayName: name },
        {
          organizationId: OTHER,
          role: "admin",
          displayName: "AD11 example second workspace",
        },
      ]}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
    >
      {denied ? (
        <section className={pageStyles.statePanel} data-operator-surface="" aria-labelledby="denied-title">
          <h1 id="denied-title">Operator access required</h1>
          <p>
            This internal Social closed-beta control plane is only available to
            authorized ZyntixAI platform operators.
          </p>
        </section>
      ) : null}
      {missing ? (
        <section className={pageStyles.statePanel} data-operator-surface="" aria-labelledby="missing-title">
          <h1 id="missing-title">Organization not found</h1>
          <p>
            <Link href={SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}>Back to list</Link>
          </p>
        </section>
      ) : null}
      {list ? (
        <PlatformClosedBetaOperatorList
          items={
            state === "operator-empty"
              ? []
              : [
                  {
                    organizationId,
                    organizationName: name,
                    organizationStatus: "active",
                    enrollmentStatus: "approved",
                    enrollmentUpdatedAt: "2026-10-01T10:00:00.000Z",
                    hasSocialWorkspace: true,
                    instagramConnectionCount: 2,
                    healthyInstagramConnectionCount: 1,
                    credentialPresentCount: 1,
                    publishImageCapabilityCount: 1,
                    activePublicationCount: 3,
                    queuedPublicationCount: 1,
                    hasOwnerOrAdmin: true,
                    lastSocialActivityAt: "2026-10-07T08:00:00.000Z",
                    diagnostic: diagnostic(
                      "approved",
                      globalOn,
                      long ? LONG_REASON : undefined,
                    ),
                  },
                  {
                    organizationId: OTHER,
                    organizationName: "AD11 example paused studio",
                    organizationStatus: "active",
                    enrollmentStatus: "paused",
                    enrollmentUpdatedAt: "2026-09-20T12:00:00.000Z",
                    hasSocialWorkspace: true,
                    instagramConnectionCount: 0,
                    healthyInstagramConnectionCount: 0,
                    credentialPresentCount: 0,
                    publishImageCapabilityCount: 0,
                    activePublicationCount: 0,
                    queuedPublicationCount: 0,
                    hasOwnerOrAdmin: true,
                    lastSocialActivityAt: null,
                    diagnostic: diagnostic("paused", false),
                  },
                ]
          }
          q={state === "operator-empty" ? "AD11 example missing organization" : ""}
          status="all"
          globalPublishingEnabled={globalOn}
        />
      ) : null}
      {!denied && !missing && !list ? (
        <>
        {state === "operator-confirm" || state === "operator-pending" || state === "operator-error" || state === "operator-success" ? (
          <p role="status">
            {state === "operator-confirm"
              ? `Revoke confirmation: ${LONG_REASON}.`
              : state === "operator-pending"
                ? "Revoke is shown as pending."
                : state === "operator-error"
                  ? "AD11 example enrollment update failed. Refresh and try again."
                  : "Updated AD11 example north studio: approved to publishing allowed."}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <PlatformClosedBetaOperatorDetail
          globalPublishingEnabled={state !== "operator-publishing-off" && globalOn}
          detail={{
            organizationId,
            organizationName: name,
            organizationStatus: "active",
            enrollmentStatus: status,
            enrollmentUpdatedAt: "2026-10-01T10:00:00.000Z",
            hasSocialWorkspace: true,
            instagramConnectionCount: 2,
            healthyInstagramConnectionCount: 1,
            credentialPresentCount: 1,
            publishImageCapabilityCount: 1,
            activePublicationCount: 3,
            queuedPublicationCount: 1,
            hasOwnerOrAdmin: true,
            lastSocialActivityAt: "2026-10-07T08:00:00.000Z",
            diagnostic: diagnostic(
              status,
              state !== "operator-publishing-off" && globalOn,
              long ? LONG_REASON : undefined,
            ),
            statusBeforePause: status === "paused" ? "publishing_allowed" : null,
            enrollmentReason: long ? LONG_REASON : "AD11 example readiness note",
            enrollmentCreatedAt: "2026-09-01T09:00:00.000Z",
            approvedAt: "2026-09-01T09:00:00.000Z",
            publishingAllowedAt: null,
            pausedAt: status === "paused" ? "2026-09-20T12:00:00.000Z" : null,
            revokedAt: status === "revoked" ? "2026-09-28T15:00:00.000Z" : null,
            reauthorizationRequiredCount: 0,
            succeededPublicationCount: 4,
            availableActions: actionsFor(status),
            events:
              state === "operator-audit-empty"
                ? []
                : [
                    {
                      eventId: "ad11-example-event-1",
                      eventType: "social_beta_enrolled_approved",
                      previousStatus: null,
                      nextStatus: "approved",
                      actorSource: "platform_operator",
                      actorUserId: null,
                      reason: long ? LONG_REASON : "AD11 example readiness note",
                      createdAt: "2026-09-01T09:00:00.000Z",
                    },
                  ],
          }}
        />
        </>
      ) : null}
    </AppShellChrome>
  );
}
