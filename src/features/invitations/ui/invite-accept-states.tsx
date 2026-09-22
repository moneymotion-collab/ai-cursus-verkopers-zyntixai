import type { ReactNode } from "react";
import Link from "next/link";
import type { AcceptInvitationUiCode } from "@/features/invitations/server/accept-invitation-result";
import { ACCEPT_INVITATION_MESSAGES } from "@/features/invitations/server/accept-invitation-result";
import { AbandonInvitationButton } from "@/features/invitations/ui/abandon-invitation-button";
import styles from "@/app/invite/accept/page.module.css";

export const INVITE_ACCEPT_HEADINGS = {
  featureDisabled: "Invitations are temporarily unavailable",
  unavailable: "Invitation unavailable",
  recovery: "Reopen your invitation",
  continuation: "Continue with invitation",
  emailMismatch: "Use the invited email",
  verificationRequired: "Verify your email",
  adminActionRequired: "Administrator action required",
  authRequired: "Sign in to continue",
  genericFailure: "Unable to continue",
} as const;

export const INVITE_ACCEPT_EXPLANATIONS = {
  featureDisabled:
    "Invitations are currently unavailable. Please try again later.",
  unavailable:
    "This invitation link is unavailable. Open the latest invitation link from your email again. If you already have access, sign in. Otherwise ask your organization administrator for a new invitation.",
  recovery:
    "Your invitation session needs the latest invitation link from your email. Open that link again to continue.",
  continuationSignedOut:
    "Sign in or create an account with the email address that received the invitation.",
  continuationSignedIn:
    "Continue with this account. The invitation is checked only when you accept.",
} as const;

export const INVITE_ACCEPT_SIGN_IN_HREF = "/login";
export const INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF =
  "/login?next=/invite/accept";
export const INVITE_ACCEPT_REGISTER_HREF = "/register";
export const INVITE_ACCEPT_VERIFY_EMAIL_HREF = "/register/check-email";

export type InviteAcceptSignedInCopy = {
  heading: string;
  explanation: string;
};

export function resolveInviteAcceptSignedInCopy(
  resultCode: AcceptInvitationUiCode | null,
): InviteAcceptSignedInCopy {
  if (resultCode == null) {
    return {
      heading: INVITE_ACCEPT_HEADINGS.continuation,
      explanation: INVITE_ACCEPT_EXPLANATIONS.continuationSignedIn,
    };
  }

  switch (resultCode) {
    case "email_mismatch":
      return {
        heading: INVITE_ACCEPT_HEADINGS.emailMismatch,
        explanation: ACCEPT_INVITATION_MESSAGES.email_mismatch,
      };
    case "verification_required":
      return {
        heading: INVITE_ACCEPT_HEADINGS.verificationRequired,
        explanation: ACCEPT_INVITATION_MESSAGES.verification_required,
      };
    case "admin_action_required":
      return {
        heading: INVITE_ACCEPT_HEADINGS.adminActionRequired,
        explanation: ACCEPT_INVITATION_MESSAGES.admin_action_required,
      };
    case "invitation_unavailable":
      return {
        heading: INVITE_ACCEPT_HEADINGS.unavailable,
        explanation: INVITE_ACCEPT_EXPLANATIONS.unavailable,
      };
    case "feature_disabled":
      return {
        heading: INVITE_ACCEPT_HEADINGS.featureDisabled,
        explanation: INVITE_ACCEPT_EXPLANATIONS.featureDisabled,
      };
    case "auth_required":
      return {
        heading: INVITE_ACCEPT_HEADINGS.authRequired,
        explanation: ACCEPT_INVITATION_MESSAGES.auth_required,
      };
    case "origin_rejected":
      return {
        heading: INVITE_ACCEPT_HEADINGS.genericFailure,
        explanation: ACCEPT_INVITATION_MESSAGES.origin_rejected,
      };
    case "unexpected":
      return {
        heading: INVITE_ACCEPT_HEADINGS.genericFailure,
        explanation: ACCEPT_INVITATION_MESSAGES.unexpected,
      };
    default: {
      const exhaustive: never = resultCode;
      return exhaustive;
    }
  }
}

export function InviteAcceptShell({
  heading,
  explanation,
  explanationRole,
  children,
}: {
  heading: string;
  explanation: string;
  explanationRole?: "alert";
  children?: ReactNode;
}) {
  return (
    <main className={styles.page} aria-labelledby="invite-accept-title">
      <p className={styles.brand}>ZyntixAI</p>
      <h1 id="invite-accept-title" className={styles.title}>
        {heading}
      </h1>
      <p className={styles.copy} role={explanationRole}>
        {explanation}
      </p>
      {children}
    </main>
  );
}

export function FeatureDisabledState({
  explanation = INVITE_ACCEPT_EXPLANATIONS.featureDisabled,
}: {
  explanation?: string;
} = {}) {
  return (
    <InviteAcceptShell
      heading={INVITE_ACCEPT_HEADINGS.featureDisabled}
      explanation={explanation}
    >
      <p className={styles.copy}>
        <Link href={INVITE_ACCEPT_SIGN_IN_HREF}>Sign in</Link>
      </p>
    </InviteAcceptShell>
  );
}

export function UnavailableState({
  showAbandon,
  publicRegistrationEnabled,
}: {
  showAbandon: boolean;
  publicRegistrationEnabled: boolean;
}) {
  return (
    <InviteAcceptShell
      heading={INVITE_ACCEPT_HEADINGS.unavailable}
      explanation={INVITE_ACCEPT_EXPLANATIONS.unavailable}
    >
      {showAbandon ? (
        <AbandonInvitationButton
          publicRegistrationEnabled={publicRegistrationEnabled}
        />
      ) : (
        <p className={styles.copy}>
          <Link href={INVITE_ACCEPT_SIGN_IN_HREF}>Sign in</Link>
        </p>
      )}
    </InviteAcceptShell>
  );
}

export function RecoveryState({
  publicRegistrationEnabled,
}: {
  publicRegistrationEnabled: boolean;
}) {
  return (
    <InviteAcceptShell
      heading={INVITE_ACCEPT_HEADINGS.recovery}
      explanation={INVITE_ACCEPT_EXPLANATIONS.recovery}
    >
      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
      />
    </InviteAcceptShell>
  );
}

export function ContinuationSignedOutState({
  publicRegistrationEnabled,
}: {
  publicRegistrationEnabled: boolean;
}) {
  return (
    <InviteAcceptShell
      heading={INVITE_ACCEPT_HEADINGS.continuation}
      explanation={INVITE_ACCEPT_EXPLANATIONS.continuationSignedOut}
    >
      <p className={styles.copy}>
        <Link href={INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF}>Sign in</Link>
        {" · "}
        <Link href={INVITE_ACCEPT_REGISTER_HREF}>Create account</Link>
      </p>
      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
      />
    </InviteAcceptShell>
  );
}
