"use client";

import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import styles from "./error.module.css";

type CustomerDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CustomerDetailError({ reset }: CustomerDetailErrorProps) {
  return (
    <AppShell activeNav="customers">
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display customer details" variant="error">
          An unexpected error occurred while loading this customer. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShell>
  );
}
