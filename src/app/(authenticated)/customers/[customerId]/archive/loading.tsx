import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function CustomerArchiveLoading() {
  return (
    <AppShell activeNav="customers">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Archive customer</h1>
        <p className={styles.message}>Loading archive form…</p>
      </section>
    </AppShell>
  );
}
