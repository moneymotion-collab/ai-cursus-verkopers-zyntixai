import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function CustomerRestoreLoading() {
  return (
    <AppShell activeNav="customers">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Restore customer</h1>
        <p className={styles.message}>Loading restore form…</p>
      </section>
    </AppShell>
  );
}
