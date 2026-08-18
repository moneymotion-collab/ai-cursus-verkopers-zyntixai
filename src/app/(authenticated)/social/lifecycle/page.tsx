import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  B19_LIFECYCLE_ROUTE,
  buildB19LifecycleHref,
} from "@/features/social-media/domain/b19-lifecycle-navigation";
import { loadB19LifecyclePage } from "@/features/social-media/server/load-b19-lifecycle-page";
import { B19LifecyclePanel } from "@/features/social-media/ui/b19-lifecycle-panel";
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
    <section className={styles.statePanel} aria-labelledby="b19-org-required-title">
      <h1 id="b19-org-required-title">Organization selection required</h1>
      <p>Select an organization for Social publishing lifecycle operations.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={buildB19LifecycleHref({ organizationId: organization.organizationId })}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function B19LifecyclePage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadB19LifecyclePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in as Owner/Admin to manage Social publishing lifecycle.</p>
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
          <p>Connection gates are off. Lifecycle ops remain unavailable.</p>
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
            href={buildB19LifecycleHref(
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

  return (
    <AppShell
      activeNav="home"
      membersNavVisible={false}
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={B19_LIFECYCLE_ROUTE}
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>SMM B1.9 — Publishing lifecycle</h1>
          <p className={styles.subtitle}>
            Operator inventory for connections, publications, and opaque attempt
            timelines. No Instagram provider writes.
          </p>
          <p className={styles.orgName}>{result.organizationName}</p>
        </header>

        <B19LifecyclePanel
          organizationId={result.organizationId}
          publishingEnabled={result.publishingEnabled}
          connections={result.connections}
          publications={result.publications}
          healthyConnectedCount={result.healthyConnectedCount}
          pendingShellCount={result.pendingShellCount}
          queuedPublicationCount={result.queuedPublicationCount}
          succeededPublicationCount={result.succeededPublicationCount}
        />
      </div>
    </AppShell>
  );
}
