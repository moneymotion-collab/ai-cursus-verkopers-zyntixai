import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSiteDetailPage } from "@/features/field-operations/ui/load-pages";
import { FieldLoadFailure, FieldShell, SiteDetail } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { siteId } = await params;
  const result = await loadSiteDetailPage(await createSupabaseServerClient(), siteId, await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="sites" targetPath={`/sites/${siteId}`} />;
  }
  if (result.kind === "unavailable" || result.kind === "query_error") {
    return <FieldShell context={result.context} activeNav="sites" action={`/sites/${siteId}`}><section className={styles.statePanel}><h1>Site unavailable</h1><p role="alert">{result.kind === "query_error" ? result.message : "This site is unavailable or you do not have access."}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="sites" action={`/sites/${siteId}`}><SiteDetail context={result.context} site={result.site} workOrders={result.workOrders} warning={result.warning} /></FieldShell>;
}
