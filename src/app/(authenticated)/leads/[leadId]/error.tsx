"use client";

import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import styles from "../error.module.css";

type LeadDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LeadDetailError({ reset }: LeadDetailErrorProps) {
  return (
    <AppShell activeNav="leads">
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display lead details" variant="error">
          An unexpected error occurred while loading this lead. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShell>
  );
}
