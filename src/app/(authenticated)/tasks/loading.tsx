import { AppShell } from "@/components/app-shell";
import styles from "./loading.module.css";

export default function TasksLoading() {
  return (
    <AppShell>
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Tasks</h1>
        <p className={styles.message}>Loading tasks…</p>
        <div className={styles.tableSkeleton} aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.row} />
          ))}
        </div>
        <ul className={styles.cardSkeleton} aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className={styles.card} />
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
