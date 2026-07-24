import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { ProgramOrganizationRequiredPanel } from "@/features/programs/ui/program-organization-required-panel";
import { ProgramDetail, ProgramUnavailableDetail } from "@/features/programs/ui/program-detail";
import { loadProgramDetailPage } from "@/features/programs/ui/load-program-detail-page";
import {
  parseProgramListReturnState,
  buildProgramListQueryString,
} from "@/features/programs/ui/program-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type ProgramDetailPageProps = {
  params: Promise<{ programId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgramDetailPage({
  params,
  searchParams,
}: ProgramDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { programId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadProgramDetailPage(supabase, programId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view program details for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="programs" organizationOptions={result.organizations}>
        <ProgramOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/programs/${programId}`}
          description="Select an organization to view this program."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.page}>
          <h1>Program details</h1>
          <Alert title="Unable to load program" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "program_unavailable") {
    return (
      <AppShell activeNav="programs">
        <ProgramUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseProgramListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/programs/${programId}${buildProgramListQueryString(listState)}`;

  return (
    <AppShell
      activeNav="programs"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/programs/${programId}`}
    >
      <section className={styles.page}>
        <ProgramDetail viewModel={result.data} reloadHref={reloadHref} />
      </section>
    </AppShell>
  );
}
