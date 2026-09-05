import { AppShell } from "@/components/app-shell";
import { LeadOrganizationRequiredPanel } from "@/features/leads/ui/lead-organization-required-panel";
import { LeadUnavailableDetail } from "@/features/leads/ui/lead-detail";
import { LeadStatusForm } from "@/features/leads/ui/lead-status-form";
import { loadLeadStatusPage } from "@/features/leads/ui/load-lead-workflow-page";
import { buildBackToLeadsHref } from "@/features/leads/ui/lead-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type LeadStatusPageProps = {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadStatusPage({ params, searchParams }: LeadStatusPageProps) {
  const supabase = await createSupabaseServerClient();
  const { leadId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadLeadStatusPage(supabase, leadId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to change lead status.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="leads" organizationOptions={result.organizations}>
        <LeadOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/leads/${leadId}/status`}
          description="Select an organization before changing this lead's status."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel}>
          <h1>Unable to load lead status form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "invalid_lead") {
    return (
      <AppShell activeNav="leads">
        <LeadUnavailableDetail backHref="/leads" />
      </AppShell>
    );
  }

  if (result.kind === "lead_unavailable") {
    return (
      <AppShell activeNav="leads">
        <LeadUnavailableDetail backHref={buildBackToLeadsHref(result.listState)} />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel}>
          <h1>Lead status change unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to lead</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="leads"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/leads/${leadId}/status`}
    >
      <section className={styles.page}>
        <LeadStatusForm
          organizationId={result.organizationId}
          lead={result.lead}
          allowedTargets={result.allowedTargets ?? []}
          listState={result.listState}
          cancelHref={result.backHref}
          terminology={result.moduleAccess.terminology}
        />
      </section>
    </AppShell>
  );
}
