import styles from "../leads/loading.module.css";

export default function HomeLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      Loading today’s brief…
    </div>
  );
}
