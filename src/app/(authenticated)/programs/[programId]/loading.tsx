import { AppShell } from "@/components/app-shell";
import styles from "./loading.module.css";

export default function ProgramDetailLoading() {
  return (
    <AppShell activeNav="programs">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Program</h1>
        <p className={styles.message}>Loading program…</p>
        <div className={styles.skeleton} aria-hidden="true" />
      </section>
    </AppShell>
  );
}
