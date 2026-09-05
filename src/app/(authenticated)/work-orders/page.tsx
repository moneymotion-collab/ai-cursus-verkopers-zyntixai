import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkOrdersPage } from "@/features/field-operations/ui/load-pages";
import { FieldLoadFailure, FieldShell, WorkOrdersList } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await loadWorkOrdersPage(await createSupabaseServerClient(), await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="workOrders" targetPath="/work-orders" />;
  }
  if (result.kind === "query_error") {
    return <FieldShell context={result.context} activeNav="workOrders" action="/work-orders"><section className={styles.statePanel}><h1>Unable to load work orders</h1><p role="alert">{result.message}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="workOrders" action="/work-orders"><WorkOrdersList context={result.context} workOrders={result.workOrders} status={result.status} /></FieldShell>;
}
