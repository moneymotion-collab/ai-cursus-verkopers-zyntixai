import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkOrderEditPage } from "@/features/field-operations/ui/load-pages";
import { WorkOrderForm } from "@/features/field-operations/ui/forms";
import { FieldLoadFailure, FieldShell } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function EditWorkOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ workOrderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workOrderId } = await params;
  const result = await loadWorkOrderEditPage(await createSupabaseServerClient(), workOrderId, await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="workOrders" targetPath={`/work-orders/${workOrderId}/edit`} />;
  }
  if (result.kind !== "ready") {
    return <FieldShell context={result.context} activeNav="workOrders" action={`/work-orders/${workOrderId}/edit`}><section className={styles.statePanel}><h1>Cannot edit work order</h1><p role="alert">{result.message ?? "Work order editing is unavailable."}</p></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="workOrders" action={`/work-orders/${workOrderId}/edit`}><section className={styles.page}><h1>Edit work order</h1><WorkOrderForm organizationId={result.context.organizationId} options={result.options} workOrder={result.workOrder} /></section></FieldShell>;
}
