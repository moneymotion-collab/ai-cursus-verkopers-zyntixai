import { AppShell } from "@/components/app-shell";
import styles from "../../loading.module.css";

export default function CustomerEditLoading() {
  return (
    <AppShell activeNav="customers">
      <section className={styles.loading} aria-busy="true" aria-live="polite">
        <h1 className={styles.title}>Edit customer</h1>
        <p className={styles.message}>Loading edit customer form…</p>
      </section>
    </AppShell>
  );
}
