import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkOrderCreatePage } from "@/features/field-operations/ui/load-pages";
import { WorkOrderForm } from "@/features/field-operations/ui/forms";
import { FieldLoadFailure, FieldShell } from "@/features/field-operations/ui/views";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await loadWorkOrderCreatePage(await createSupabaseServerClient(), await searchParams);
  if (result.kind === "auth_required" || result.kind === "organization_unavailable" || result.kind === "organization_required" || result.kind === "forbidden" || result.kind === "error") {
    return <FieldLoadFailure result={result} activeNav="workOrders" targetPath="/work-orders/new" />;
  }
  if (result.kind !== "ready") {
    return <FieldShell context={result.context} activeNav="workOrders" action="/work-orders/new"><section className={styles.statePanel}><h1>Cannot create work order</h1><p role="alert">{result.message ?? "Work order creation is unavailable."}</p></section></FieldShell>;
  }
  if (result.options.sites.length === 0) {
    return <FieldShell context={result.context} activeNav="workOrders" action="/work-orders/new"><section className={styles.statePanel}><h1>Create a Site first</h1><p>A Work order must belong to a Site under a Job.</p><a href={`/sites/new?org=${encodeURIComponent(result.context.organizationId)}`}>New site</a></section></FieldShell>;
  }
  return <FieldShell context={result.context} activeNav="workOrders" action="/work-orders/new"><section className={styles.page}><h1>New work order</h1><WorkOrderForm organizationId={result.context.organizationId} options={result.options} initialSiteId={result.initialSiteId} /></section></FieldShell>;
}
