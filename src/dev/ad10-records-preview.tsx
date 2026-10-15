import { AppShellChrome } from "@/components/app-shell-chrome";
import { Alert } from "@/components/ui/alert";
import pageStyles from "@/app/(authenticated)/social/page.module.css";
import { buildSocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import type { SocialSection } from "@/features/social-media/domain/social-navigation";
import { SocialWorkspacePanel } from "@/features/social-media/ui/social-workspace-panel";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONNECTION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PUBLICATION = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LONG_NAME =
  "AD10 example Instagram account with a display name that wraps on a narrow screen";
const LONG_COPY =
  "AD10 example caption that stays readable when the social calendar and activity cards wrap on a narrow screen";
const LONG_ORG =
  "AD10 example organization with a workspace name that wraps on a narrow screen";

function closedBeta(status: "publishing_allowed" | "approved" | "paused" | "not_enrolled") {
  return buildSocialClosedBetaCustomerReadModel({
    enrollmentStatus: status,
    socialPublishingEnabled: status === "publishing_allowed" ? "true" : "false",
  });
}

function connection(long: boolean, pendingShell: boolean) {
  return {
    id: CONNECTION,
    provider: "instagram",
    status: pendingShell ? "authorization_pending" : "connected",
    professionalAccountType: "BUSINESS",
    displayName: long ? LONG_NAME : "AD10 example account",
    operationalHealth: pendingShell ? "pending" : "healthy",
    reauthorizationRequired: false,
    canAbandonPending: pendingShell,
    capabilitySnapshot: pendingShell ? [] : ["publish_image", "publish_story"],
  };
}

function publication(long: boolean, operatorAction: string) {
  return {
    id: PUBLICATION,
    status: operatorAction === "request_retry" ? "failed_retryable" : "queued",
    contentFormat: "image",
    createdAt: "2026-10-06T09:00:00.000Z",
    intendedExecuteAt: "2026-10-08T09:30:00.000Z",
    executionMode: "scheduled",
    connectionId: CONNECTION,
    attemptCount: 1,
    hasExternalPublicationId: false,
    lastFailureClass: operatorAction === "request_retry" ? "temporary" : null,
    operatorAction,
    actionBlockedReason: null,
    isHistoricalLeftover: false,
    attempts: [
      {
        id: "attempt-1",
        attemptNumber: 1,
        outcome: "failed",
        timelineStage: "publish",
        ambiguous: false,
        safeRetryEligible: true,
        startedAt: "2026-10-06T09:05:00.000Z",
        finishedAt: "2026-10-06T09:06:00.000Z",
        safeErrorCode: long ? "AD10 example error code that wraps" : null,
      },
    ],
  };
}

function calendarItem(long: boolean, publicationId: string, canCancel: boolean) {
  return {
    publicationId,
    provider: "instagram",
    providerLabel: "Instagram",
    executionMode: "scheduled",
    intendedExecuteAt: "2026-10-07T09:30:00.000Z",
    localDayKey: "2026-10-07",
    localTimeLabel: "09:30",
    localDateLabel: "7 Oct 2026",
    timeZone: "Europe/Amsterdam",
    status: "queued",
    calendarStatus: "scheduled_future" as const,
    statusLabel: "Scheduled",
    contentFormat: "image",
    contentFormatLabel: "Image",
    contentSummary: long ? LONG_COPY : "AD10 example caption",
    hasMedia: true,
    connectionDisplayName: long ? LONG_NAME : "AD10 example account",
    accountLabel: long ? LONG_NAME : "AD10 example account",
    lastFailureClass: null,
    canSchedule: false,
    canReschedule: true,
    canCancel,
    canRecoverMissed: false,
  };
}

function sectionFor(state: string): SocialSection {
  if (state.startsWith("social-accounts")) return "accounts";
  if (state.startsWith("social-publish")) return "publish";
  if (state.startsWith("social-calendar")) return "calendar";
  if (state.startsWith("social-activity")) return "activity";
  if (state === "social-paused") return "accounts";
  return "overview";
}

export function Ad10RecordsPreview({
  state,
  orgName,
}: {
  state: string;
  orgName: string;
}) {
  const long = state.endsWith("long");
  const panel =
    state === "social-auth" ||
    state === "social-unavailable" ||
    state === "social-org" ||
    state === "social-disabled" ||
    state === "social-forbidden" ||
    state === "social-query" ||
    state === "social-beta";
  const enrollment =
    state === "social-paused"
      ? "paused"
      : state === "social-beta"
        ? "not_enrolled"
        : "publishing_allowed";
  const beta = closedBeta(enrollment);
  const empty = state.endsWith("empty");
  const organizations = [
    { organizationId: ORG, role: "owner" as const, displayName: long ? LONG_ORG : orgName },
    { organizationId: OTHER, role: "admin" as const, displayName: "AD10 example second workspace" },
  ];
  const connections = empty ? [] : [connection(long, state === "social-activity" || state === "social-activity-long" || state === "social-activity-pending")];
  const showConnected = !empty && !connections[0]?.canAbandonPending;
  const accountConnections = showConnected || state.startsWith("social-accounts")
    ? [connection(long, false)]
    : connections;

  return (
    <AppShellChrome
      activeNav="social"
      socialNavVisible={!panel && enrollment !== "not_enrolled"}
      membersNavVisible={false}
      moduleNavVisibility={operatingModelNavVisibility("course_seller")}
      terminology={DEFAULT_PRODUCT_TERMINOLOGY}
      organizationOptions={panel ? [] : organizations}
      selectedOrganizationId={panel ? undefined : ORG}
      organizationSelectorAction="/ad02-preview"
    >
      {state === "social-auth" ? (
        <section className={pageStyles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in as Owner or Admin to use Social Media Management.</p>
        </section>
      ) : null}
      {state === "social-unavailable" ? (
        <section className={pageStyles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      ) : null}
      {state === "social-org" ? (
        <section className={pageStyles.statePanel} aria-labelledby="social-org-required-title">
          <h1 id="social-org-required-title">Organization selection required</h1>
          <p>Select an organization to open Social Media Management.</p>
          <ul className={pageStyles.orgList}>
            {organizations.map((organization) => (
              <li key={organization.organizationId}>{organization.displayName}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {state === "social-disabled" ? (
        <section className={pageStyles.statePanel} aria-labelledby="feature-disabled-title">
          <h1 id="feature-disabled-title">Social connections disabled</h1>
          <p>Instagram connection features are off for this environment. Publishing also remains off.</p>
        </section>
      ) : null}
      {state === "social-forbidden" ? (
        <section className={pageStyles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>AD10 example access message</p>
        </section>
      ) : null}
      {state === "social-query" ? (
        <section className={pageStyles.statePanel} aria-labelledby="query-error-title">
          <h1 id="query-error-title">Unable to load</h1>
          <p>AD10 example query message</p>
          <a className={pageStyles.retryLink} href="/ad02-preview?state=social-overview">Retry</a>
        </section>
      ) : null}
      {state === "social-beta" ? (
        <section className={pageStyles.statePanel} aria-labelledby="social-beta-gate-title">
          <p className={pageStyles.betaBadge}>{beta.betaBadgeLabel}</p>
          <h1 id="social-beta-gate-title">{beta.customerHeadline}</h1>
          <p>{beta.customerBody}</p>
          <p className={pageStyles.notice} role="status">
            Instagram connection, content prepare, and publishing controls are not available for this organization until closed-beta access is granted by ZyntixAI.
          </p>
        </section>
      ) : null}
      {!panel ? (
        <div className={pageStyles.page}>
          <header className={pageStyles.pageHeader}>
            <p className={pageStyles.betaBadge}>{beta.betaBadgeLabel}</p>
            <h1>Social</h1>
            <p className={pageStyles.subtitle}>
              Instagram accounts, calendar scheduling, controlled image publishing, and publication activity for {long ? LONG_ORG : orgName}.
            </p>
            <p className={pageStyles.notice} role="status">{beta.customerHeadline}</p>
          </header>
          {state === "social-oauth" ? (
            <Alert title="Instagram connected" variant="info">
              Your Instagram Business account is connected for this organization.
            </Alert>
          ) : null}
          {state === "social-accounts-error" || state === "social-accounts-pending" || state === "social-accounts-confirm" || state === "social-publish-error" || state === "social-publish-pending" || state === "social-calendar-invalid" || state === "social-calendar-cancel" || state === "social-activity-pending" ? (
            <p className={pageStyles.notice} role="status">
              {state === "social-accounts-error"
                ? "AD10 example connect message."
                : state === "social-accounts-pending"
                  ? "Connecting is shown as pending."
                  : state === "social-accounts-confirm"
                    ? "Disconnect confirmation is shown."
                    : state === "social-publish-error"
                      ? "AD10 example publish message."
                      : state === "social-publish-pending"
                        ? "Preparing controlled IMAGE publication is shown as pending."
                        : state === "social-calendar-invalid"
                          ? "AD10 example schedule message."
                          : state === "social-calendar-cancel"
                            ? "Cancel is shown for the selected publication."
                            : "Abandon pending connection is shown as pending."}{" "}
              Static preview only. This does not submit a form.
            </p>
          ) : null}
          <SocialWorkspacePanel
            organizationId={ORG}
            section={sectionFor(state)}
            publishingEnabled={enrollment === "publishing_allowed"}
            closedBeta={beta}
            hasWorkspace={!empty}
            connections={
              state.startsWith("social-accounts") || state === "social-overview" || state === "social-long" || state.startsWith("social-publish") || state.startsWith("social-calendar")
                ? empty ? [] : [connection(long, false)]
                : accountConnections
            }
            publications={
              empty
                ? []
                : [
                    publication(long, "abandon"),
                    publication(false, "request_retry"),
                  ].map((row, index) => ({
                    ...row,
                    id: index === 0 ? PUBLICATION : "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                  }))
            }
            healthyConnectedCount={empty ? 0 : 1}
            pendingShellCount={state.startsWith("social-activity") ? 1 : 0}
            activeQueueCount={empty ? 0 : 1}
            historicalQueueCount={0}
            succeededPublicationCount={empty ? 0 : 1}
            blockedPublicationCount={0}
            explicitPublicationId={state === "social-calendar-form" || state === "social-calendar-invalid" ? PUBLICATION : null}
            canMutateSchedule={enrollment === "publishing_allowed" && !empty}
            calendarTimeZone="Europe/Amsterdam"
            calendarTimezoneConfigured
            calendarTimezoneOptions={["Europe/Amsterdam"]}
            calendarWeekStartDay="2026-10-05"
            calendarSelectedDay="2026-10-07"
            calendarItems={
              empty || state === "social-calendar-empty"
                ? []
                : [calendarItem(long, PUBLICATION, true)]
            }
            calendarEligibleToSchedule={
              empty
                ? []
                : [
                    {
                      publicationId: PUBLICATION,
                      providerLabel: "Instagram",
                      contentFormatLabel: "Image",
                      contentSummary: long ? LONG_COPY : "AD10 example caption",
                      accountLabel: long ? LONG_NAME : "AD10 example account",
                      status: "queued",
                      canSchedule: true,
                    },
                  ]
            }
            calendarLoadError={state === "social-calendar-error" ? "AD10 example calendar message" : null}
            scheduledThisWeekCount={empty ? 0 : 1}
            nextScheduledAt={empty ? null : "2026-10-07T07:30:00.000Z"}
          />
        </div>
      ) : null}
    </AppShellChrome>
  );
}
