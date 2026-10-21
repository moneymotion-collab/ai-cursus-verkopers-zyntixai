import type { WorkspacePresentation } from "@/features/onboarding/domain/workspace-presentation";
import styles from "./workspace-preview.module.css";

export function WorkspacePreview({
  presentation,
}: {
  presentation: WorkspacePresentation;
}) {
  return (
    <section
      className={styles.preview}
      aria-labelledby="configured-workspace-preview-title"
    >
      <div className={styles.header}>
        <p className={styles.brand}>ZyntixAI</p>
        <p className={styles.model}>{presentation.operatingModelLabel}</p>
      </div>
      <div className={styles.body}>
        <h2 id="configured-workspace-preview-title">Workspace preview</h2>
        <p>Primary workspace modules</p>
        <ul aria-label="Configured workspace modules">
          {presentation.modules.map((module) => (
            <li key={module.id}>{module.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
