import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function LeadCreateLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Create lead</h1>
        <p className={styles.message}>Loading create lead form…</p>
      </section>
    </AppShell>
  );
}
