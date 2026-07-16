"use client";

import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import styles from "./error.module.css";

type LeadsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LeadsError({ reset }: LeadsErrorProps) {
  return (
    <AppShell activeNav="leads">
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display leads" variant="error">
          An unexpected error occurred while loading the leads page. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShell>
  );
}
