import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function LeadStageLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Change pipeline stage</h1>
        <p className={styles.message}>Loading pipeline stage form…</p>
      </section>
    </AppShell>
  );
}
