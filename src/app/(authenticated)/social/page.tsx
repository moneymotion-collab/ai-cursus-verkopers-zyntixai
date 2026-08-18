import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildSocialWorkspaceHref,
  SOCIAL_ROUTE,
} from "@/features/social-media/domain/social-navigation";
import { loadSocialWorkspacePage } from "@/features/social-media/server/load-social-workspace-page";
import { SocialWorkspacePanel } from "@/features/social-media/ui/social-workspace-panel";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { SocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import styles from "./page.module.css";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function OrganizationRequiredPanel({
  organizations,
}: {
  organizations: OrganizationOption[];
}) {
  return (
    <section className={styles.statePanel} aria-labelledby="social-org-required-title">
      <h1 id="social-org-required-title">Organization selection required</h1>
      <p>Select an organization to open Social Media Management.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={buildSocialWorkspaceHref({
                organizationId: organization.organizationId,
              })}
            >
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosedBetaNotEnrolledPanel({
  closedBeta,
}: {
  closedBeta: SocialClosedBetaCustomerReadModel;
}) {
  return (
    <section className={styles.statePanel} aria-labelledby="social-beta-gate-title">
      <p className={styles.betaBadge}>{closedBeta.betaBadgeLabel}</p>
      <h1 id="social-beta-gate-title">{closedBeta.customerHeadline}</h1>
      <p>{closedBeta.customerBody}</p>
      <p className={styles.notice} role="status">
        Instagram connection, content prepare, and publishing controls are not
        available for this organization until closed-beta access is granted by
        ZyntixAI.
      </p>
    </section>
  );
}

function oauthAlert(
  code: string,
  failureStage: string | null,
): { title: string; body: string } {
  switch (code) {
    case "connected":
      return {
        title: "Instagram connected",
        body: "Your Instagram Business account is connected for this organization.",
      };
    case "authorization_denied":
      return {
        title: "Authorization denied",
        body: "Instagram did not complete authorization. You can try again from Accounts.",
      };
    case "feature_disabled":
      return {
        title: "Social connections disabled",
        body: "Connection features are off in this environment.",
      };
    default:
      return {
        title: "Connection could not be completed",
        body: failureStage
          ? `Safe reference: ${failureStage}. Try again from Accounts if appropriate.`
          : "Review the Accounts section and retry if appropriate.",
      };
  }
}

export default async function SocialWorkspacePage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadSocialWorkspacePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in as Owner or Admin to use Social Media Management.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <OrganizationRequiredPanel organizations={result.organizations} />
      </AppShell>
    );
  }

  if (result.kind === "feature_disabled") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="feature-disabled-title">
          <h1 id="feature-disabled-title">Social connections disabled</h1>
          <p>
            Instagram connection features are off for this environment. Publishing
            also remains off.
          </p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell
        activeNav="social"
        membersNavVisible={false}
        socialNavVisible={false}
        organizationOptions={[]}
      >
        <section className={styles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="org-missing-title">
          <h1 id="org-missing-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="social" membersNavVisible={false} socialNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="query-error-title">
          <h1 id="query-error-title">Unable to load</h1>
          <p>{result.message}</p>
          <a
            className={styles.retryLink}
            href={buildSocialWorkspaceHref(
              result.organizationId
                ? { organizationId: result.organizationId }
                : undefined,
            )}
          >
            Retry
          </a>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "closed_beta_not_enrolled") {
    return (
      <AppShell
        activeNav="social"
        membersNavVisible={false}
        socialNavVisible={false}
        organizationOptions={result.organizationOptions}
        selectedOrganizationId={result.organizationId}
        organizationSelectorAction={SOCIAL_ROUTE}
      >
        <ClosedBetaNotEnrolledPanel closedBeta={result.closedBeta} />
      </AppShell>
    );
  }

  const alert =
    result.oauthOutcome != null
      ? oauthAlert(result.oauthOutcome, result.oauthFailureStage)
      : null;

  return (
    <AppShell
      activeNav="social"
      membersNavVisible={false}
      socialNavVisible={result.closedBeta.socialNavVisible}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={SOCIAL_ROUTE}
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.betaBadge}>{result.closedBeta.betaBadgeLabel}</p>
          <h1>Social</h1>
          <p className={styles.subtitle}>
            Instagram accounts, controlled image publishing, and publication
            activity for {result.organizationName}.
          </p>
          <p className={styles.notice} role="status">
            {result.closedBeta.customerHeadline}
          </p>
        </header>

        {alert ? (
          <Alert title={alert.title} variant="info">
            {alert.body}
          </Alert>
        ) : null}

        <SocialWorkspacePanel
          organizationId={result.organizationId}
          section={result.section}
          publishingEnabled={result.publishingEnabled}
          closedBeta={result.closedBeta}
          hasWorkspace={result.workspaces.length > 0}
          connections={result.connections}
          publications={result.publications}
          healthyConnectedCount={result.healthyConnectedCount}
          pendingShellCount={result.pendingShellCount}
          activeQueueCount={result.activeQueueCount}
          historicalQueueCount={result.historicalQueueCount}
          succeededPublicationCount={result.succeededPublicationCount}
          blockedPublicationCount={result.blockedPublicationCount}
          explicitPublicationId={result.explicitPublicationId}
        />
      </div>
    </AppShell>
  );
}
