import Link from "next/link";
import styles from "./onboarding-wizard.module.css";

type OnboardingStatusPanelProps = {
  title: string;
  message: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function OnboardingStatusPanel({
  title,
  message,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: OnboardingStatusPanelProps) {
  return (
    <section className={styles.statusPanel} aria-labelledby="onboarding-status-title">
      <h1 id="onboarding-status-title">{title}</h1>
      <p>{message}</p>
      {(primaryHref || secondaryHref) && (
        <div className={styles.statusActions}>
          {primaryHref && primaryLabel ? (
            <Link className={styles.primaryLink} href={primaryHref}>
              {primaryLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link className={styles.secondaryLink} href={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
