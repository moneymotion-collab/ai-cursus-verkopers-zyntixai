import { AppShell } from "@/components/app-shell";
import styles from "./loading.module.css";

/**
 * B1-C5: Home loading matches destination chrome (AppShell + Today hierarchy)
 * so the brief does not flash as a bare intermediate page.
 */
export default function HomeLoading() {
  return (
    <AppShell activeNav="home">
      <section
        className={styles.loading}
        aria-busy="true"
        aria-live="polite"
        aria-labelledby="home-loading-title"
      >
        <h1 id="home-loading-title" className={styles.title}>
          Today
        </h1>
        <p className={styles.subtitle}>
          What needs attention and what you need to do next.
        </p>
        <p className={styles.message}>Loading today’s brief…</p>
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.block} />
          <div className={styles.block} />
          <div className={styles.block} />
          <div className={styles.block} />
        </div>
      </section>
    </AppShell>
  );
}
