"use client";

import { AppShell } from "@/components/app-shell";
import styles from "@/features/projects/ui/projects.module.css";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <AppShell activeNav="projects">
      <section className={styles.statePanel}>
        <h1>Projects could not be loaded</h1>
        <p role="alert">An unexpected problem occurred. Your changes were not discarded.</p>
        <button className={styles.secondaryButton} type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </AppShell>
  );
}
