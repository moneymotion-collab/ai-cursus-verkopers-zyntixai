import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function LeadRestoreLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Restore lead</h1>
        <p className={styles.message}>Loading restore confirmation…</p>
      </section>
    </AppShell>
  );
}
