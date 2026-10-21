"use client";

import { AppShellChrome } from "@/components/app-shell-chrome";
import { Alert } from "@/components/ui/alert";
import styles from "./error.module.css";

type TaskDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TaskDetailError({ reset }: TaskDetailErrorProps) {
  return (
    <AppShellChrome>
      <section className={styles.errorPanel}>
        <h1>Something went wrong</h1>
        <Alert title="Unable to display task details" variant="error">
          An unexpected error occurred while loading the task page. Please try again.
        </Alert>
        <button type="button" className={styles.retryButton} onClick={() => reset()}>
          Try again
        </button>
      </section>
    </AppShellChrome>
  );
}
