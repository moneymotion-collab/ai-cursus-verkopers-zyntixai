import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import { loadAttentionDetailPage } from "@/features/attention/ui/load-attention-detail-page";
import {
  AttentionAuthRequiredPanel,
  AttentionOrganizationRequiredPanel,
  AttentionOrganizationUnavailablePanel,
  AttentionQueryErrorPanel,
  AttentionUnavailablePanel,
} from "@/features/attention/ui/attention-state-panels";
import styles from "./page.module.css";

type AttentionDetailPageProps = {
  params: Promise<{ attentionItemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * B1.7.5-D read-only Attention detail with timeline.
 * Lifecycle actions and nav activation remain deferred.
 */
export default async function AttentionDetailPage({
  params,
  searchParams,
}: AttentionDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { attentionItemId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadAttentionDetailPage(
    supabase,
    attentionItemId,
    rawSearchParams,
  );

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="attention">
        <AttentionAuthRequiredPanel />
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
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
          targetPath={`${ATTENTION_ROUTE}/${encodeURIComponent(attentionItemId)}`}
          description="Select an organization to view this attention item."
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

  if (result.kind === "attention_unavailable") {
    return (
      <AppShell activeNav="attention">
        <AttentionUnavailablePanel backHref={result.backHref} />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="attention"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`${ATTENTION_ROUTE}/${encodeURIComponent(attentionItemId)}`}
    >
      <section className={styles.page}>
        <AttentionDetail viewModel={result.data} />
      </section>
    </AppShell>
  );
}
