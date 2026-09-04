import { AppShell } from "@/components/app-shell";
import { ProgramOrganizationRequiredPanel } from "@/features/programs/ui/program-organization-required-panel";
import { ProgramCreateForm } from "@/features/programs/ui/program-create-form";
import { loadProgramCreatePage } from "@/features/programs/ui/load-program-create-page";
import { buildBackToProgramsHref } from "@/features/programs/ui/program-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type ProgramCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgramCreatePage({ searchParams }: ProgramCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadProgramCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to create programs.</p>
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
          targetPath="/programs/new"
          description="Select an organization before creating a program."
        />
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="programs" moduleNavVisibility={result.moduleAccess.navVisibility}>
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
          <h1>Unable to load create program form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel}>
          <h1>Create program unavailable</h1>
          <p>You do not have permission to create programs.</p>
          <a href={buildBackToProgramsHref(result.listState)}>Back to programs</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="programs"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/programs/new"
    >
      <section className={styles.page}>
        <ProgramCreateForm
          organizationId={result.organizationId}
          listState={result.listState}
          cancelHref={buildBackToProgramsHref(result.listState)}
        />
      </section>
    </AppShell>
  );
}
