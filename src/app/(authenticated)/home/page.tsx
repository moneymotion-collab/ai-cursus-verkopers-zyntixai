import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import {
  DAILY_OPERATING_TODAY_SUBTITLE,
  formatDailyOperatingRoleLabel,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import { loadDailyOperatingPage } from "@/features/daily-operating/server/load-daily-operating-page";
import { DailyOperatingBriefPanel } from "@/features/daily-operating/ui/daily-operating-brief";
import { DailyOperatingOrganizationRequiredPanel } from "@/features/daily-operating/ui/daily-operating-organization-required-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadDailyOperatingPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="home">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Sign in to view your daily operating brief.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="home">
        <section className={styles.statePanel} aria-labelledby="no-org-title">
          <h1 id="no-org-title">Organization required</h1>
          <p>Join or create an organization to use ZyntixAI.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell
        activeNav="home"
        organizationOptions={result.organizations}
        organizationSelectorAction="/home"
      >
        <DailyOperatingOrganizationRequiredPanel
          organizations={result.organizations}
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="home">
        <section className={styles.statePanel} aria-labelledby="home-error-title">
          <h1 id="home-error-title">Unable to load today’s brief</h1>
          <Alert variant="error" title={result.message} />
        </section>
      </AppShell>
    );
  }

  const selectedOrganization = result.organizationOptions.find(
    (organization) =>
      organization.organizationId === result.selectedOrganizationId,
  );
  const organizationDisplayName = selectedOrganization?.displayName ?? null;

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="home"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/home"
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>Today</h1>
          {organizationDisplayName ? (
            <p className={styles.subtitle}>
              {organizationDisplayName}
              {" · "}
              {formatDailyOperatingRoleLabel(result.role)}
            </p>
          ) : null}
          <p className={styles.subtitle}>{DAILY_OPERATING_TODAY_SUBTITLE}</p>
        </header>
        <DailyOperatingBriefPanel
          brief={result.brief}
          attentionQueryFailed={result.attentionQueryFailed}
          tasksQueryFailed={result.tasksQueryFailed}
          moduleNavVisibility={result.moduleAccess.navVisibility}
        />
      </div>
    </AppShell>
  );
}
