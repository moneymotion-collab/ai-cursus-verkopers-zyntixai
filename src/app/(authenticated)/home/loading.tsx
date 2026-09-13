import { AppShell } from "@/components/app-shell";
import { DAILY_OPERATING_TODAY_SUBTITLE } from "@/features/daily-operating/domain/compose-daily-operating-brief";
import styles from "./loading.module.css";

/**
 * Home loading keeps destination chrome without presenting a finished
 * Primary nav or workspace identity that the loader has not yet resolved.
 */
export default function HomeLoading() {
  return (
    <AppShell activeNav="home" navigationPresentation="pending">
      <section
        className={styles.loading}
        aria-busy="true"
        aria-live="polite"
        aria-labelledby="home-loading-title"
      >
        <h1 id="home-loading-title" className={styles.title}>
          Today
        </h1>
        <p className={styles.subtitle}>{DAILY_OPERATING_TODAY_SUBTITLE}</p>
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
