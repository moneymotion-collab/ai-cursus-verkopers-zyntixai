"use client";

import { AppShellChrome } from "@/components/app-shell-chrome";
import { Alert } from "@/components/ui/alert";
import styles from "../../error.module.css";

type ProgressVoidErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProgressVoidError({ reset }: ProgressVoidErrorProps) {
  return (
    <AppShellChrome activeNav="progress">
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display void form" variant="error">
          An unexpected error occurred while loading this form. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShellChrome>
  );
}
