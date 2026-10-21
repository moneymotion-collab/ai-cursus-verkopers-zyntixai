import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function ProgressVoidLoading() {
  return (
    <AppShell activeNav="progress">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Void progress record</h1>
        <p className={styles.message}>Loading form…</p>
      </section>
    </AppShell>
  );
}
