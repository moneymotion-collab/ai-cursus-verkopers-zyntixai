import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function CustomerStatusLoading() {
  return (
    <AppShell activeNav="customers">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Change customer status</h1>
        <p className={styles.message}>Loading status form…</p>
      </section>
    </AppShell>
  );
}
