import { AppShell } from "@/components/app-shell";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default function ProductsLoading() {
  return (
    <AppShell activeNav="products" navigationPresentation="pending">
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <h1>Loading products</h1>
        <p>Please wait while the workspace is prepared.</p>
      </section>
    </AppShell>
  );
}
