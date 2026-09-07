import styles from "./workflow-preview.module.css";

export function WorkflowPreview({
  steps,
}: {
  steps: readonly string[];
}) {
  return (
    <section className={styles.workflow} aria-labelledby="workflow-preview-title">
      <h2 id="workflow-preview-title">Representative workflow</h2>
      <ol>
        {steps.map((step, index) => (
          <li key={`${index}-${step}`}>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
