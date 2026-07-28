"use client";

import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import styles from "./error.module.css";

type ProgressErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProgressError({ reset }: ProgressErrorProps) {
  return (
    <AppShell activeNav="progress">
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display progress" variant="error">
          An unexpected error occurred while loading the progress page. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShell>
  );
}
