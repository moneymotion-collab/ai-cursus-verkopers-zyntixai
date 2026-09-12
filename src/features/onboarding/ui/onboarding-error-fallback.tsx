"use client";

import { OnboardingShell } from "./onboarding-shell";
import styles from "./onboarding-error-fallback.module.css";

type OnboardingErrorFallbackProps = {
  reset: () => void;
};

export function OnboardingErrorFallback({
  reset,
}: OnboardingErrorFallbackProps) {
  return (
    <OnboardingShell headingId="onboarding-error-title">
      <section
        className={styles.panel}
        aria-labelledby="onboarding-error-title"
      >
        <h1 id="onboarding-error-title">Setup needs attention</h1>
        <p>
          We could not display this setup step. Refresh and try again. This
          message does not change invitations, email, or workspace access.
        </p>
        <button type="button" className={styles.retry} onClick={reset}>
          Try again
        </button>
      </section>
    </OnboardingShell>
  );
}
