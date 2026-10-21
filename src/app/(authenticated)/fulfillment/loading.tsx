import { AppShell } from "@/components/app-shell";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default function FulfillmentLoading() {
  return (
    <AppShell activeNav="fulfillment" navigationPresentation="pending">
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <h1>Loading fulfillment</h1>
        <p>Please wait while the workspace is prepared.</p>
      </section>
    </AppShell>
  );
}
