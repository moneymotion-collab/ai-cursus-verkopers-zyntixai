import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { OnboardingShell } from "./onboarding-shell";
import styles from "./team-foundation.module.css";

type TeamFoundationProps = {
  membershipRole: "owner";
  backHref: string;
};

export function TeamFoundation({
  membershipRole,
  backHref,
}: TeamFoundationProps) {
  const roleLabel = membershipRole === "owner" ? "Owner" : "";

  return (
    <OnboardingShell
      currentStep="team"
      headingId="team-onboarding-title"
      actions={
        <Link className={styles.backAction} href={backHref}>
          Back
        </Link>
      }
    >
      <Surface className={styles.surface}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 id="team-onboarding-title">Bring your team with you</h1>
            <p>
              Your workspace already includes its owner. Adding teammates is
              optional.
            </p>
          </header>

          <section
            className={styles.team}
            aria-labelledby="team-onboarding-current"
          >
            <h2 id="team-onboarding-current">Current team</h2>
            <ul className={styles.memberList}>
              <li className={styles.member}>
                <span className={styles.memberIdentity}>
                  <strong>Workspace owner</strong>
                  <span>Already included</span>
                </span>
                <span className={styles.role}>{roleLabel}</span>
              </li>
            </ul>
          </section>
        </div>
      </Surface>
    </OnboardingShell>
  );
}
