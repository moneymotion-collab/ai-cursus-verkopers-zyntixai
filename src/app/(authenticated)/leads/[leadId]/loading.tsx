import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function LeadDetailLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Lead details</h1>
        <p className={styles.message}>Loading lead details…</p>
      </section>
    </AppShell>
  );
}
