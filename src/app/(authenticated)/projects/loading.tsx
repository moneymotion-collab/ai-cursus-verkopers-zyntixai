import { AppShell } from "@/components/app-shell";
import styles from "@/features/projects/ui/projects.module.css";

export default function ProjectsLoading() {
  return (
    <AppShell activeNav="projects">
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <h1>Loading projects</h1>
        <p>Please wait while the workspace is prepared.</p>
      </section>
    </AppShell>
  );
}
