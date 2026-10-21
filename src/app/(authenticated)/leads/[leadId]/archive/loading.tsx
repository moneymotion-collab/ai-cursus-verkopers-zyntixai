import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function LeadArchiveLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Archive lead</h1>
        <p className={styles.message}>Loading archive confirmation…</p>
      </section>
    </AppShell>
  );
}
