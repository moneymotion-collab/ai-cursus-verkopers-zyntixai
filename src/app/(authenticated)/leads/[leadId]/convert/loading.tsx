import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function LeadConvertLoading() {
  return (
    <AppShell activeNav="leads">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Convert lead to customer</h1>
        <p className={styles.message}>Loading conversion form…</p>
      </section>
    </AppShell>
  );
}
