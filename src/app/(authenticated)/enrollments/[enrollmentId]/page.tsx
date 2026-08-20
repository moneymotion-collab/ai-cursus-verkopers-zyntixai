import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import {
  EnrollmentDetail,
  EnrollmentUnavailableDetail,
} from "@/features/enrollments/ui/enrollment-detail";
import { loadEnrollmentDetailPage } from "@/features/enrollments/ui/load-enrollment-detail-page";
import {
  parseEnrollmentListReturnState,
  buildEnrollmentListQueryString,
  buildEnrollmentArchiveHref,
  buildEnrollmentEditHref,
  buildEnrollmentRestoreHref,
  buildEnrollmentStatusHref,
} from "@/features/enrollments/ui/enrollment-navigation";
import {
  canShowArchiveEnrollmentWorkflow,
  canShowEditEnrollmentWorkflow,
  canShowRestoreEnrollmentWorkflow,
  canShowStatusEnrollmentWorkflow,
} from "@/features/enrollments/ui/enrollment-workflow-visibility";
import {
  buildProgressCreateHref,
  buildProgressListHref,
} from "@/features/progress/domain/progress-navigation";
import { canShowEnrollmentRecordProgressEntry } from "@/features/progress/ui/progress-pe-entry-visibility";
import { buildAttentionListHref } from "@/features/attention/domain/attention-navigation";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { canShowEnrollmentViewAttentionEntry } from "@/features/attention/ui/attention-pe-entry-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type EnrollmentDetailPageProps = {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnrollmentDetailPage({
  params,
  searchParams,
}: EnrollmentDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { enrollmentId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentDetailPage(supabase, enrollmentId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view enrollment details for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="enrollments" organizationOptions={result.organizations}>
        <EnrollmentOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/enrollments/${enrollmentId}`}
          description="Select an organization to view this enrollment."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.page}>
          <h1>Enrollment details</h1>
          <Alert title="Unable to load enrollment" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "enrollment_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <EnrollmentUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseEnrollmentListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/enrollments/${enrollmentId}${buildEnrollmentListQueryString(listState)}`;
  const workflowLinks = {
    edit: canShowEditEnrollmentWorkflow(result.data.enrollment, result.role)
      ? buildEnrollmentEditHref(enrollmentId, listState)
      : undefined,
    status: canShowStatusEnrollmentWorkflow(result.data.enrollment, result.role)
      ? buildEnrollmentStatusHref(enrollmentId, listState)
      : undefined,
    archive: canShowArchiveEnrollmentWorkflow(result.data.enrollment, result.role)
      ? buildEnrollmentArchiveHref(enrollmentId, listState)
      : undefined,
    restore: canShowRestoreEnrollmentWorkflow(result.data.enrollment, result.role)
      ? buildEnrollmentRestoreHref(enrollmentId, listState)
      : undefined,
  };

  const progressLinks = {
    viewProgressHref: buildProgressListHref({
      organizationId: result.selectedOrganizationId,
      enrollmentId: result.data.enrollment.id,
    }),
    recordProgressHref: canShowEnrollmentRecordProgressEntry({
      role: result.role,
      enrollmentStatus: result.data.enrollment.status,
      isArchived: result.data.enrollment.derived.isArchived,
    })
      ? buildProgressCreateHref({
          organizationId: result.selectedOrganizationId,
          enrollmentId: result.data.enrollment.id,
        })
      : undefined,
  };

  const attentionPermissions = resolveAttentionPermissions(result.role);
  const enrollmentReturnPath = `/enrollments/${encodeURIComponent(result.data.enrollment.id)}?org=${encodeURIComponent(result.selectedOrganizationId)}`;
  const attentionLinks = canShowEnrollmentViewAttentionEntry({
    role: result.role,
  })
    ? {
        viewAttentionHref: buildAttentionListHref({
          organizationId: result.selectedOrganizationId,
          enrollmentId: result.data.enrollment.id,
        }),
        evaluateRules: attentionPermissions.canEvaluateRules
          ? {
              organizationId: result.selectedOrganizationId,
              enrollmentId: result.data.enrollment.id,
              returnPath: enrollmentReturnPath,
            }
          : undefined,
      }
    : undefined;

  return (
    <AppShell
      activeNav="enrollments"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/enrollments/${enrollmentId}`}
    >
      <section className={styles.page}>
        <EnrollmentDetail
          viewModel={result.data}
          reloadHref={reloadHref}
          workflowLinks={workflowLinks}
          progressLinks={progressLinks}
          attentionLinks={attentionLinks}
        />
      </section>
    </AppShell>
  );
}
