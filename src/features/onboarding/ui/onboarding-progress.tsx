import styles from "./onboarding-shell.module.css";

export const ONBOARDING_PROGRESS_STEPS = [
  { id: "you-company", label: "You & Company" },
  { id: "business", label: "Business" },
  { id: "workspace", label: "Workspace" },
  { id: "team", label: "Team" },
  { id: "ready", label: "Ready" },
] as const;

export type OnboardingProgressStep =
  (typeof ONBOARDING_PROGRESS_STEPS)[number]["id"];

type OnboardingProgressProps = {
  currentStep: OnboardingProgressStep;
};

export function OnboardingProgress({
  currentStep,
}: OnboardingProgressProps) {
  const currentIndex = ONBOARDING_PROGRESS_STEPS.findIndex(
    (step) => step.id === currentStep,
  );
  const current = ONBOARDING_PROGRESS_STEPS[currentIndex]!;
  const currentContext = `Step ${currentIndex + 1} of ${ONBOARDING_PROGRESS_STEPS.length}: ${current.label}`;

  return (
    <nav className={styles.progress} aria-label="Onboarding progress">
      <p className={styles.mobileProgressLabel} aria-hidden="true">
        {current.label}
      </p>
      <ol className={styles.progressList}>
        {ONBOARDING_PROGRESS_STEPS.map((step, index) => {
          const state =
            index < currentIndex
              ? styles.progressComplete
              : index === currentIndex
                ? styles.progressCurrent
                : styles.progressUpcoming;

          return (
            <li
              key={step.id}
              className={`${styles.progressItem} ${state}`}
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={index === currentIndex ? currentContext : undefined}
            >
              <span className={styles.progressMarker} aria-hidden="true" />
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
      <div className={styles.mobileProgressTrack} aria-hidden="true">
        <span
          className={styles.mobileProgressFill}
          style={{
            width: `${((currentIndex + 1) / ONBOARDING_PROGRESS_STEPS.length) * 100}%`,
          }}
        />
      </div>
    </nav>
  );
}
