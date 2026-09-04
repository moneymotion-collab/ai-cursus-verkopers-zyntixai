import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { ProgramOrganizationRequiredPanel } from "@/features/programs/ui/program-organization-required-panel";
import { ProgramDetail, ProgramUnavailableDetail } from "@/features/programs/ui/program-detail";
import { loadProgramDetailPage } from "@/features/programs/ui/load-program-detail-page";
import {
  parseProgramListReturnState,
  buildProgramListQueryString,
  buildProgramArchiveHref,
  buildProgramEditHref,
  buildProgramRestoreHref,
  buildProgramStatusHref,
} from "@/features/programs/ui/program-navigation";
import {
  canShowArchiveProgramWorkflow,
  canShowEditProgramWorkflow,
  canShowRestoreProgramWorkflow,
  canShowStatusProgramWorkflow,
} from "@/features/programs/ui/program-workflow-visibility";
import {
  buildEnrollmentCreateHrefFromContext,
  buildEnrollmentsListHrefFromContext,
} from "@/features/enrollments/ui/enrollment-navigation";
import { canShowCreateEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import { isProgramEligibleForEnrollmentCreate } from "@/features/enrollments/domain/contextual-enrollment";
import { buildProgressListHref } from "@/features/progress/domain/progress-navigation";
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
  const workflowLinks = {
    edit: canShowEditProgramWorkflow(result.data.program, result.role)
      ? buildProgramEditHref(programId, listState)
      : undefined,
    status: canShowStatusProgramWorkflow(result.data.program, result.role)
      ? buildProgramStatusHref(programId, listState)
      : undefined,
    archive: canShowArchiveProgramWorkflow(result.data.program, result.role)
      ? buildProgramArchiveHref(programId, listState)
      : undefined,
    restore: canShowRestoreProgramWorkflow(result.data.program, result.role)
      ? buildProgramRestoreHref(programId, listState)
      : undefined,
  };

  const enrollmentLinks = {
    viewEnrollmentsHref: buildEnrollmentsListHrefFromContext({
      org: result.selectedOrganizationId,
      programId,
    }),
    createEnrollmentHref:
      canShowCreateEnrollmentWorkflow(result.role) &&
      isProgramEligibleForEnrollmentCreate(result.data.program)
        ? buildEnrollmentCreateHrefFromContext({
            org: result.selectedOrganizationId,
            programId,
          })
        : undefined,
  };

  const progressLinks = {
    viewProgressHref: buildProgressListHref({
      organizationId: result.selectedOrganizationId,
      programId,
    }),
  };

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="programs"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/programs/${programId}`}
    >
      <section className={styles.page}>
        <ProgramDetail
          viewModel={result.data}
          reloadHref={reloadHref}
          workflowLinks={workflowLinks}
          enrollmentLinks={enrollmentLinks}
          progressLinks={progressLinks}
        />
      </section>
    </AppShell>
  );
}
