import { AppShell } from "@/components/app-shell";
import styles from "@/features/field-operations/ui/field-operations.module.css";

export default function WorkOrdersLoading() {
  return (
    <AppShell activeNav="workOrders" navigationPresentation="pending">
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <h1>Loading work orders</h1>
        <p>Please wait while the workspace is prepared.</p>
      </section>
    </AppShell>
  );
}
