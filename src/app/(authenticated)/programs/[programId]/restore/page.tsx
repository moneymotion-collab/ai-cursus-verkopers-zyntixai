import { AppShell } from "@/components/app-shell";
import { ProgramOrganizationRequiredPanel } from "@/features/programs/ui/program-organization-required-panel";
import { ProgramUnavailableDetail } from "@/features/programs/ui/program-detail";
import { ProgramRestoreForm } from "@/features/programs/ui/program-restore-form";
import { loadProgramRestorePage } from "@/features/programs/ui/load-program-lifecycle-workflow-page";
import { buildBackToProgramsHref } from "@/features/programs/ui/program-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type ProgramRestorePageProps = {
  params: Promise<{ programId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgramRestorePage({
  params,
  searchParams,
}: ProgramRestorePageProps) {
  const supabase = await createSupabaseServerClient();
  const { programId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadProgramRestorePage(supabase, programId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to restore programs.</p>
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
          targetPath={`/programs/${programId}/restore`}
          description="Select an organization before restoring this program."
        />
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="programs" moduleNavVisibility={result.moduleAccess.navVisibility} terminology={result.moduleAccess.terminology}>
        <section className={styles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel}>
          <h1>Unable to load restore form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "invalid_program") {
    return (
      <AppShell activeNav="programs">
        <ProgramUnavailableDetail backHref="/programs" />
      </AppShell>
    );
  }

  if (result.kind === "program_unavailable") {
    return (
      <AppShell activeNav="programs">
        <ProgramUnavailableDetail backHref={buildBackToProgramsHref(result.listState)} />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel}>
          <h1>Restore program unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to program</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="programs"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/programs/${programId}/restore`}
    >
      <section className={styles.page}>
        <ProgramRestoreForm
          organizationId={result.organizationId}
          program={result.program}
          listState={result.listState}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
