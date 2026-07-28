import { AppShell } from "@/components/app-shell";
import styles from "../loading.module.css";

export default function ProgressDetailLoading() {
  return (
    <AppShell activeNav="progress">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Progress details</h1>
        <p className={styles.message}>Loading progress record…</p>
        <div className={styles.tableSkeleton} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.row} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
