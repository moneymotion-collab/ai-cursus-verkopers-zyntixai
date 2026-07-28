import { AppShell } from "@/components/app-shell";
import {
  ProgressDetail,
  ProgressUnavailableDetail,
} from "@/features/progress/ui/progress-detail";
import { ProgressOrganizationRequiredPanel } from "@/features/progress/ui/progress-organization-required-panel";
import { loadProgressDetailPage } from "@/features/progress/ui/load-progress-detail-page";
import { Alert } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type ProgressDetailPageProps = {
  params: Promise<{ factId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgressDetailPage({
  params,
  searchParams,
}: ProgressDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { factId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadProgressDetailPage(supabase, factId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view progress details for your organization.</p>
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
          targetPath={`/progress/${factId}`}
          description="Select an organization to view this progress record."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.page}>
          <h1>Progress details</h1>
          <Alert title="Unable to load progress" variant="error">
            {result.message}
          </Alert>
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

  return (
    <AppShell
      activeNav="progress"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/progress/${factId}`}
    >
      <section className={styles.page}>
        <ProgressDetail viewModel={result.data} />
      </section>
    </AppShell>
  );
}
