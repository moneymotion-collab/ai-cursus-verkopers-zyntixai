import { AppShell } from "@/components/app-shell";
import { ProgressOrganizationRequiredPanel } from "@/features/progress/ui/progress-organization-required-panel";
import { ProgressUnavailableDetail } from "@/features/progress/ui/progress-detail";
import { ProgressCorrectForm } from "@/features/progress/ui/progress-correct-form";
import { loadProgressCorrectPage } from "@/features/progress/ui/load-progress-correct-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type ProgressCorrectPageProps = {
  params: Promise<{ factId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgressCorrectPage({
  params,
  searchParams,
}: ProgressCorrectPageProps) {
  const supabase = await createSupabaseServerClient();
  const { factId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadProgressCorrectPage(supabase, factId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to correct progress records.</p>
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
          targetPath={`/progress/${factId}/correct`}
          description="Select an organization before correcting this progress record."
        />
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="progress" moduleNavVisibility={result.moduleAccess.navVisibility}>
        <section className={styles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel}>
          <h1>Unable to load correction form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "progress_unavailable") {
    return (
      <AppShell activeNav="progress">
        <ProgressUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel}>
          <h1>Correct progress unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to progress record</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="progress"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/progress/${factId}/correct`}
    >
      <section className={styles.page}>
        <ProgressCorrectForm
          organizationId={result.organizationId}
          data={result.data}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
