import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import type { WorkspacePresentation } from "@/features/onboarding/domain/workspace-presentation";
import { OnboardingShell } from "./onboarding-shell";
import { WorkflowPreview } from "./workflow-preview";
import { WorkspacePreview } from "./workspace-preview";
import styles from "./workspace-confirmation.module.css";

export function WorkspaceConfirmation({
  presentation,
  backHref,
  continueHref,
}: {
  presentation: WorkspacePresentation;
  backHref: string;
  continueHref: string;
}) {
  return (
    <OnboardingShell
      currentStep="workspace"
      headingId="workspace-confirmation-title"
      context={<WorkspacePreview presentation={presentation} />}
      contextLabel="Configured workspace preview"
      actions={
        <div className={styles.actions}>
          <Link className={styles.secondaryAction} href={backHref}>
            Back
          </Link>
          <Link className={styles.primaryAction} href={continueHref}>
            Continue
          </Link>
        </div>
      }
    >
      <Surface className={styles.surface}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 id="workspace-confirmation-title">
              Your workspace is taking shape
            </h1>
            <p>
              Review the workspace configured for your operating model before
              continuing.
            </p>
          </header>

          <section
            className={styles.model}
            aria-labelledby="workspace-operating-model"
          >
            <h2 id="workspace-operating-model">Operating model</h2>
            <p>{presentation.operatingModelLabel}</p>
          </section>

          <section
            className={styles.modules}
            aria-labelledby="workspace-configured-modules"
          >
            <h2 id="workspace-configured-modules">Configured modules</h2>
            <ul>
              {presentation.modules.map((module) => (
                <li key={module.id}>{module.label}</li>
              ))}
            </ul>
          </section>

          <WorkflowPreview steps={presentation.workflow} />
        </div>
      </Surface>
    </OnboardingShell>
  );
}
