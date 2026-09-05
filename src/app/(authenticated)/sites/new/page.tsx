import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSiteCreatePage } from "@/features/field-operations/ui/load-pages";
import { SiteForm } from "@/features/field-operations/ui/forms";
import { FieldLoadFailure, FieldShell } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await loadSiteCreatePage(await createSupabaseServerClient(), await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="sites" targetPath="/sites/new" />;
  }
  if (result.kind !== "ready") {
    return <FieldShell context={result.context} activeNav="sites" action="/sites/new"><section className={styles.statePanel}><h1>Cannot create site</h1><p role="alert">{result.message ?? "Site creation is unavailable."}</p></section></FieldShell>;
  }
  if (result.options.projects.length === 0) {
    return <FieldShell context={result.context} activeNav="sites" action="/sites/new"><section className={styles.statePanel}><h1>Create a Job first</h1><p>A Site must belong to an existing Job.</p><a href={`/projects/new?org=${encodeURIComponent(result.context.organizationId)}`}>New job</a></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="sites" action="/sites/new"><section className={styles.page}><h1>New site</h1><SiteForm organizationId={result.context.organizationId} options={result.options} initialProjectId={result.initialProjectId} /></section></FieldShell>;
}
