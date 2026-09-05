import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSitesPage } from "@/features/field-operations/ui/load-pages";
import {
  FieldLoadFailure,
  FieldShell,
  SitesList,
} from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await loadSitesPage(await createSupabaseServerClient(), await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="sites" targetPath="/sites" />;
  }
  if (result.kind === "query_error") {
    return <FieldShell context={result.context} activeNav="sites" action="/sites"><section className={styles.statePanel}><h1>Unable to load sites</h1><p role="alert">{result.message}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="sites" action="/sites"><SitesList context={result.context} sites={result.sites} /></FieldShell>;
}
