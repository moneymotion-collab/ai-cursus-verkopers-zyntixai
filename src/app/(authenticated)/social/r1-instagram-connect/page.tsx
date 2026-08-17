import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildR1InstagramConnectHref, R1_INSTAGRAM_CONNECT_ROUTE } from "@/features/social-media/domain/r1-connect-navigation";
import { loadR1InstagramConnectPage } from "@/features/social-media/server/load-r1-instagram-connect-page";
import { R1InstagramConnectPanel } from "@/features/social-media/ui/r1-instagram-connect-panel";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
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
    <section className={styles.statePanel} aria-labelledby="r1-org-required-title">
      <h1 id="r1-org-required-title">Organization selection required</h1>
      <p>Select an organization for controlled Instagram R1 verification.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={buildR1InstagramConnectHref(organization.organizationId)}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function outcomeCopy(code: string): { title: string; body: string } {
  switch (code) {
    case "connected":
      return {
        title: "Instagram connection completed",
        body: "Return to Cursor and report that OAuth completed. Do not share tokens or secrets.",
      };
    case "authorization_denied":
      return {
        title: "Authorization denied",
        body: "Meta reported denial. You can retry with the dedicated test account.",
      };
    case "feature_disabled":
      return {
        title: "Feature disabled",
        body: "Connection gates were off during callback.",
      };
    default:
      return {
        title: `OAuth outcome: ${code}`,
        body: "Review the outcome and retry only if appropriate for R1.",
      };
  }
}

export default async function R1InstagramConnectPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadR1InstagramConnectPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in as Owner/Admin to run controlled Instagram R1 connection.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <OrganizationRequiredPanel organizations={result.organizations} />
      </AppShell>
    );
  }

  if (result.kind === "feature_disabled") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="feature-disabled-title">
          <h1 id="feature-disabled-title">Instagram connections disabled</h1>
          <p>
            Connection gates are off. Keep publishing off; enable connection
            gates only for controlled R1.
          </p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell
        activeNav="home"
        membersNavVisible={false}
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
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="org-missing-title">
          <h1 id="org-missing-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="query-error-title">
          <h1 id="query-error-title">Unable to load</h1>
          <p>{result.message}</p>
          <a
            className={styles.retryLink}
            href={buildR1InstagramConnectHref(result.organizationId)}
          >
            Retry
          </a>
        </section>
      </AppShell>
    );
  }

  const hasConnectedInstagram = result.connections.some(
    (connection) =>
      connection.provider === "instagram" &&
      (connection.status === "connected" ||
        connection.status === "reauthorization_required" ||
        connection.status === "permission_missing"),
  );
  const outcome = result.oauthOutcome
    ? outcomeCopy(result.oauthOutcome)
    : null;

  return (
    <AppShell
      activeNav="home"
      membersNavVisible={false}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={R1_INSTAGRAM_CONNECT_ROUTE}
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>SMM R1 — Instagram connect</h1>
          <p className={styles.subtitle}>
            Controlled Production verification surface. No publish actions.
          </p>
          <p className={styles.orgName}>{result.organizationName}</p>
          <p className={styles.notice}>
            Publishing gate must remain OFF during this step.
          </p>
        </header>

        {outcome ? (
          <Alert title={outcome.title} variant="info">
            {outcome.body}
          </Alert>
        ) : null}

        <R1InstagramConnectPanel
          organizationId={result.organizationId}
          hasWorkspace={result.workspaces.length > 0}
          hasConnectedInstagram={hasConnectedInstagram}
        />

        <section className={styles.workspaces} aria-labelledby="r1-workspaces-title">
          <h2 id="r1-workspaces-title">Workspaces</h2>
          {result.workspaces.length === 0 ? (
            <p>None yet — connect will create the R1 test Brand/Workspace.</p>
          ) : (
            <ul>
              {result.workspaces.map((workspace) => (
                <li key={workspace.id}>{workspace.displayName}</li>
              ))}
            </ul>
          )}
        </section>

        <section
          className={styles.connections}
          aria-labelledby="r1-connections-title"
        >
          <h2 id="r1-connections-title">Connections</h2>
          {result.connections.length === 0 ? (
            <p>No Social connections yet.</p>
          ) : (
            <ul>
              {result.connections.map((connection) => (
                <li key={connection.id}>
                  {connection.provider} · {connection.status}
                  {connection.professionalAccountType
                    ? ` · ${connection.professionalAccountType}`
                    : ""}
                  {connection.externalAccountId
                    ? ` · id ${connection.externalAccountId}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
