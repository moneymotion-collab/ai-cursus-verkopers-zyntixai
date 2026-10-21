import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function CustomerCreateLoading() {
  return (
    <AppShell activeNav="customers">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Create customer</h1>
        <p className={styles.message}>Loading create customer form…</p>
      </section>
    </AppShell>
  );
}
