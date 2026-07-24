import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function ProgramCreateLoading() {
  return (
    <AppShell activeNav="programs">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Create program</h1>
        <p className={styles.message}>Loading form…</p>
      </section>
    </AppShell>
  );
}
