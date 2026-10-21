import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function AttentionDetailLoading() {
  return (
    <AppShell activeNav="attention">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Attention details</h1>
        <p className={styles.message}>Loading attention item…</p>
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.block} />
          <div className={styles.block} />
          <div className={styles.block} />
        </div>
      </section>
    </AppShell>
  );
}
