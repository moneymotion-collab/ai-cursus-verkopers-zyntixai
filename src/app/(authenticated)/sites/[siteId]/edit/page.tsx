import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSiteEditPage } from "@/features/field-operations/ui/load-pages";
import { SiteForm } from "@/features/field-operations/ui/forms";
import { FieldLoadFailure, FieldShell } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function EditSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { siteId } = await params;
  const result = await loadSiteEditPage(await createSupabaseServerClient(), siteId, await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="sites" targetPath={`/sites/${siteId}/edit`} />;
  }
  if (result.kind !== "ready") {
    return <FieldShell context={result.context} activeNav="sites" action={`/sites/${siteId}/edit`}><section className={styles.statePanel}><h1>Cannot edit site</h1><p role="alert">{result.message ?? "Site editing is unavailable."}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="sites" action={`/sites/${siteId}/edit`}><section className={styles.page}><h1>Edit site</h1><SiteForm organizationId={result.context.organizationId} options={result.options} site={result.site} /></section></FieldShell>;
}
