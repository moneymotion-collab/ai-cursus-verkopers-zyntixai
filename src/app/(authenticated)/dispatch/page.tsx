import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadDispatchPage } from "@/features/field-operations/ui/load-pages";
import { DispatchView, FieldLoadFailure, FieldShell } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await loadDispatchPage(await createSupabaseServerClient(), await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="dispatch" targetPath="/dispatch" />;
  }
  if (result.kind === "query_error") {
    return <FieldShell context={result.context} activeNav="dispatch" action="/dispatch"><section className={styles.statePanel}><h1>Unable to load Dispatch</h1><p role="alert">{result.message}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="dispatch" action="/dispatch"><DispatchView context={result.context} workOrders={result.workOrders} /></FieldShell>;
}
