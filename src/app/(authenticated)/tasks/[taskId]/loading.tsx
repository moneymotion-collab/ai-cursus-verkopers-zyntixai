import { AppShell } from "@/components/app-shell";
import styles from "./loading.module.css";

export default function TaskDetailLoading() {
  return (
    <AppShell>
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Task details</h1>
        <p className={styles.message}>Loading task details…</p>
        <div className={styles.skeleton} aria-hidden="true" />
      </section>
    </AppShell>
  );
}
