import type { ReactNode } from "react";
import {
  OnboardingProgress,
  type OnboardingProgressStep,
} from "./onboarding-progress";
import styles from "./onboarding-shell.module.css";

type OnboardingShellProps = {
  children: ReactNode;
  currentStep?: OnboardingProgressStep;
  context?: ReactNode;
  contextLabel?: string;
  actions?: ReactNode;
  headingId: string;
};

export function OnboardingShell({
  children,
  currentStep,
  context,
  contextLabel = "Workspace preview",
  actions,
  headingId,
}: OnboardingShellProps) {
  const compositionClassName = context
    ? `${styles.composition} ${styles.withContext}`
    : `${styles.composition} ${styles.single}`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.brand}>ZyntixAI</p>
        </div>
      </header>

      <div className={styles.body}>
        {currentStep ? (
          <OnboardingProgress currentStep={currentStep} />
        ) : null}

        <main className={styles.main} aria-labelledby={headingId}>
          <div className={compositionClassName}>
            <section className={styles.mainRegion}>{children}</section>
            {context ? (
              <aside className={styles.contextRegion} aria-label={contextLabel}>
                {context}
              </aside>
            ) : null}
          </div>

          {actions ? (
            <div className={styles.actionBar}>{actions}</div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
