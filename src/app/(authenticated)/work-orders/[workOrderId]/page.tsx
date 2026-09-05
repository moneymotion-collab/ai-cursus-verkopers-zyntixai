import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkOrderDetailPage } from "@/features/field-operations/ui/load-pages";
import { FieldLoadFailure, FieldShell, WorkOrderDetail } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function WorkOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workOrderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workOrderId } = await params;
  const result = await loadWorkOrderDetailPage(await createSupabaseServerClient(), workOrderId, await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="workOrders" targetPath={`/work-orders/${workOrderId}`} />;
  }
  if (result.kind === "unavailable" || result.kind === "query_error") {
    return <FieldShell context={result.context} activeNav="workOrders" action={`/work-orders/${workOrderId}`}><section className={styles.statePanel}><h1>Work order unavailable</h1><p role="alert">{result.kind === "query_error" ? result.message : "This work order is unavailable or you do not have access."}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="workOrders" action={`/work-orders/${workOrderId}`}><WorkOrderDetail context={result.context} workOrder={result.workOrder} /></FieldShell>;
}
