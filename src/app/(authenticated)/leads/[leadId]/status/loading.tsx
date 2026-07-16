import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function LeadStatusLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Change lead status</h1>
        <p className={styles.message}>Loading lead status form…</p>
      </section>
    </AppShell>
  );
}
