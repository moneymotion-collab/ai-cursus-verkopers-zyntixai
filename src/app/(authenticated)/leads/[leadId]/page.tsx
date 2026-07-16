import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { LeadOrganizationRequiredPanel } from "@/features/leads/ui/lead-organization-required-panel";
import { LeadDetail, LeadUnavailableDetail } from "@/features/leads/ui/lead-detail";
import { loadLeadDetailPage } from "@/features/leads/ui/load-lead-detail";
import { buildLeadListQueryString } from "@/features/leads/ui/lead-list-search-params";
import {
  buildLeadArchiveHref,
  buildLeadConvertHref,
  buildLeadEditHref,
  buildLeadRestoreHref,
  buildLeadStageHref,
  buildLeadStatusHref,
  parseLeadListReturnState,
} from "@/features/leads/ui/lead-navigation";
import {
  canShowArchiveLeadWorkflow,
  canShowConvertLeadWorkflow,
  canShowEditLeadWorkflow,
  canShowRestoreLeadWorkflow,
  canShowStageLeadWorkflow,
  canShowStatusLeadWorkflow,
} from "@/features/leads/ui/lead-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type LeadDetailPageProps = {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadDetailPage({ params, searchParams }: LeadDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { leadId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadLeadDetailPage(supabase, leadId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view lead details for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="leads" organizationOptions={result.organizations}>
        <LeadOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/leads/${leadId}`}
          description="Select an organization to view this lead."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.page}>
          <h1>Lead details</h1>
          <Alert title="Unable to load lead" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "lead_unavailable") {
    return (
      <AppShell activeNav="leads">
        <LeadUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseLeadListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/leads/${leadId}${buildLeadListQueryString(listState)}`;
  const workflowLinks = {
    edit: canShowEditLeadWorkflow(result.data.lead, result.role)
      ? buildLeadEditHref(leadId, listState)
      : undefined,
    stage: canShowStageLeadWorkflow(result.data.lead, result.role)
      ? buildLeadStageHref(leadId, listState)
      : undefined,
    status: canShowStatusLeadWorkflow(result.data.lead, result.role)
      ? buildLeadStatusHref(leadId, listState)
      : undefined,
    convert: canShowConvertLeadWorkflow(result.data.lead, result.role)
      ? buildLeadConvertHref(leadId, listState)
      : undefined,
    archive: canShowArchiveLeadWorkflow(result.data.lead, result.role)
      ? buildLeadArchiveHref(leadId, listState)
      : undefined,
    restore: canShowRestoreLeadWorkflow(result.data.lead, result.role)
      ? buildLeadRestoreHref(leadId, listState)
      : undefined,
  };

  return (
    <AppShell
      activeNav="leads"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/leads/${leadId}`}
    >
      <section className={styles.page}>
        <LeadDetail viewModel={result.data} reloadHref={reloadHref} workflowLinks={workflowLinks} />
      </section>
    </AppShell>
  );
}
