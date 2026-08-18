import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  B18_INSTAGRAM_PUBLISH_ROUTE,
  buildB18InstagramPublishHref,
} from "@/features/social-media/domain/b18-publish-navigation";
import { loadB18InstagramPublishPage } from "@/features/social-media/server/load-b18-instagram-publish-page";
import { B18InstagramPublishPanel } from "@/features/social-media/ui/b18-instagram-publish-panel";
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
    <section className={styles.statePanel} aria-labelledby="b18-org-required-title">
      <h1 id="b18-org-required-title">Organization selection required</h1>
      <p>Select an organization for controlled Instagram B1.8 publish verification.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={buildB18InstagramPublishHref(organization.organizationId)}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function B18InstagramPublishPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadB18InstagramPublishPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in as Owner/Admin to run controlled B1.8 IMAGE publish verification.</p>
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
            Connection gates are off. Keep publishing off until owner-authorized
            B1.8 enablement.
          </p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="home" membersNavVisible={false} organizationOptions={[]}>
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
            href={buildB18InstagramPublishHref(result.organizationId)}
          >
            Retry
          </a>
        </section>
      </AppShell>
    );
  }

  const publishableConnections = result.connections.filter(
    (connection) =>
      connection.provider === "instagram" &&
      connection.status === "connected" &&
      connection.capabilitySnapshot.includes("publish_image") &&
      !connection.reauthorizationRequired,
  );

  return (
    <AppShell
      activeNav="home"
      membersNavVisible={false}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={B18_INSTAGRAM_PUBLISH_ROUTE}
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>SMM B1.8 — Controlled Instagram IMAGE publish</h1>
          <p className={styles.subtitle}>
            Owner/Admin verification surface. Prefer a single feed IMAGE only.
          </p>
          <p className={styles.orgName}>{result.organizationName}</p>
          <p className={styles.notice}>
            Publishing gate is{" "}
            {result.publishingEnabled ? "ON" : "OFF (fail-closed)"}. Do not enable
            it until the owner issues the final enablement action.
          </p>
        </header>

        <B18InstagramPublishPanel
          organizationId={result.organizationId}
          hasWorkspace={result.workspaces.length > 0}
          publishableConnections={publishableConnections}
          publishingEnabled={result.publishingEnabled}
        />

        <section className={styles.workspaces} aria-labelledby="b18-workspaces-title">
          <h2 id="b18-workspaces-title">Workspaces</h2>
          {result.workspaces.length === 0 ? (
            <p>None yet — complete R1 connect first.</p>
          ) : (
            <ul>
              {result.workspaces.map((workspace) => (
                <li key={workspace.id}>
                  {workspace.displayName} · brand {workspace.brandId}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className={styles.connections}
          aria-labelledby="b18-connections-title"
        >
          <h2 id="b18-connections-title">Connections</h2>
          {result.connections.length === 0 ? (
            <p>No Social connections yet.</p>
          ) : (
            <ul>
              {result.connections.map((connection) => (
                <li key={connection.id}>
                  {connection.provider} · {connection.status}
                  {connection.displayName ? ` · ${connection.displayName}` : ""}
                  {connection.capabilitySnapshot.includes("publish_image")
                    ? " · publish_image"
                    : ""}
                  {connection.reauthorizationRequired
                    ? " · reauthorization required"
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
