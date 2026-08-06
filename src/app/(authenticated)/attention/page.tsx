import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import {
  ATTENTION_LIST_WORKSPACE_PAGE_SIZE,
  loadAttentionListPage,
} from "@/features/attention/ui/load-attention-list-page";
import {
  AttentionAuthRequiredPanel,
  AttentionOrganizationRequiredPanel,
  AttentionOrganizationUnavailablePanel,
  AttentionQueryErrorPanel,
} from "@/features/attention/ui/attention-state-panels";
import styles from "./page.module.css";

type AttentionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * B1.7.5-B Attention list workspace.
 * Read-only first page via B1.7.4 listAttentionItems.
 * Detail (D), filters/pagination UI (C), and nav activation (E) remain deferred.
 */
export default async function AttentionPage({ searchParams }: AttentionPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadAttentionListPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="attention">
        <AttentionAuthRequiredPanel />
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="attention">
        <AttentionOrganizationUnavailablePanel />
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="attention" organizationOptions={result.organizations}>
        <AttentionOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={ATTENTION_ROUTE}
          description="Select an organization to view Attention."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="attention">
        <AttentionOrganizationUnavailablePanel message={result.message} />
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="attention">
        <AttentionQueryErrorPanel
          title={result.title}
          message={result.message}
          retryHref={ATTENTION_ROUTE}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="attention"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={ATTENTION_ROUTE}
    >
      <div className={styles.page}>
        <AttentionListPresentation
          rows={result.rows}
          organizationName={result.organizationName}
          timeZone={result.timeZone}
          shownCount={result.rows.length}
          totalCount={result.list.pagination.total}
          pageSize={ATTENTION_LIST_WORKSPACE_PAGE_SIZE}
        />
      </div>
    </AppShell>
  );
}
