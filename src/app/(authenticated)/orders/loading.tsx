import { AppShell } from "@/components/app-shell";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default function OrdersLoading() {
  return (
    <AppShell activeNav="orders" navigationPresentation="pending">
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <h1>Loading orders</h1>
        <p>Please wait while the workspace is prepared.</p>
      </section>
    </AppShell>
  );
}
