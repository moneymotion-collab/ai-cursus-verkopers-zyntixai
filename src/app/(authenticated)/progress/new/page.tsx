import { AppShell } from "@/components/app-shell";
import { ProgressOrganizationRequiredPanel } from "@/features/progress/ui/progress-organization-required-panel";
import { ProgressRecordForm } from "@/features/progress/ui/progress-record-form";
import { loadProgressCreatePage } from "@/features/progress/ui/load-progress-create-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type ProgressCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgressCreatePage({ searchParams }: ProgressCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadProgressCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to record progress.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="progress" organizationOptions={result.organizations}>
        <ProgressOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/progress/new"
          description="Select an organization before recording progress."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel}>
          <h1>Unable to load record progress form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel}>
          <h1>Record progress unavailable</h1>
          <p>You do not have permission to record progress.</p>
          <a href={result.backHref}>Back to progress</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="progress"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/progress/new"
    >
      <section className={styles.page}>
        <ProgressRecordForm
          organizationId={result.organizationId}
          enrollmentOptions={result.enrollmentOptions}
          enrollmentOptionsError={result.enrollmentOptionsError}
          enrollmentOptionsCapped={result.enrollmentOptionsCapped}
          initialEnrollmentId={result.initialEnrollmentId}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
