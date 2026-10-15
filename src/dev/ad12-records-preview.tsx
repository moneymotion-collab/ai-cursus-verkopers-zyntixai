"use client";

import pageStyles from "@/app/login/page.module.css";
import { CheckEmailPanel, CompleteRegistrationPanel, OwnerOnboardingUnavailablePanel } from "@/features/auth/ui/register-status";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { LoginForm } from "@/features/auth/ui/login-form";
import { RegisterForm } from "@/features/auth/ui/register-form";
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";
import { InviteAcceptSignedInView } from "@/features/invitations/ui/accept-invitation-button";
import {
  ContinuationSignedOutState,
  FeatureDisabledState,
  RecoveryState,
  UnavailableState,
} from "@/features/invitations/ui/invite-accept-states";
import { OnboardingCreating } from "@/features/onboarding/ui/onboarding-creating";
import { OnboardingErrorFallback } from "@/features/onboarding/ui/onboarding-error-fallback";
import { OnboardingReady } from "@/features/onboarding/ui/onboarding-ready";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";
import { OperatingModelSelector } from "@/features/onboarding/ui/operating-model-selector";
import { TeamFoundation } from "@/features/onboarding/ui/team-foundation";
import { V2YouCompanyForm } from "@/features/onboarding/ui/v2-you-company-form";
import { WorkspaceConfirmation } from "@/features/onboarding/ui/workspace-confirmation";
import type { ReactNode } from "react";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_EMAIL =
  "ad12-example-very-long-email-address-that-wraps-on-a-narrow-screen@example.test";
const LONG_NAME =
  "AD12 example organization with a display name that wraps on a narrow access screen";

function AccessFrame({
  titleId,
  children,
}: {
  titleId: string;
  children: ReactNode;
}) {
  return (
    <main className={pageStyles.page} aria-labelledby={titleId}>
      <p className={pageStyles.brand}>ZyntixAI</p>
      {children}
    </main>
  );
}

export function Ad12RecordsPreview({ state }: { state: string }) {
  const long = state.endsWith("long");
  const email = long ? LONG_EMAIL : "ad12-example@example.test";

  if (state === "access-login" || state === "access-login-long" || state === "access-login-error" || state === "access-login-pending" || state === "access-login-expired" || state === "access-login-reset" || state === "access-login-registration") {
    return (
      <AccessFrame titleId="login-title">
        {state === "access-login-long" || state === "access-login-error" || state === "access-login-pending" ? (
          <p role="status">
            {state === "access-login-pending"
              ? "Sign-in is shown as pending."
              : state === "access-login-error"
                ? "AD12 example sign-in message."
                : `Example address: ${email}.`}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <LoginForm
          nextPath="/home"
          sessionExpired={state === "access-login-expired"}
          sessionExpiredMessage={
            state === "access-login-expired"
              ? "Your session expired. Sign in again to continue."
              : undefined
          }
          passwordResetSuccessMessage={
            state === "access-login-reset"
              ? "Password updated. Sign in with your new password."
              : undefined
          }
          registrationUnavailableMessage={
            state === "access-login-registration"
              ? "Public registration is not available. Ask an organization administrator for an invitation."
              : undefined
          }
        />
      </AccessFrame>
    );
  }

  if (state.startsWith("access-forgot")) {
    return (
      <AccessFrame titleId="forgot-password-title">
        {state === "access-forgot-long" || state === "access-forgot-pending" || state === "access-forgot-error" || state === "access-forgot-success" ? (
          <p role="status">
            {state === "access-forgot-pending"
              ? "Reset is shown as pending."
              : state === "access-forgot-error"
                ? "AD12 example reset message."
                : state === "access-forgot-success"
                  ? "AD12 example reset notice."
                  : `Example address: ${email}.`}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <ForgotPasswordForm
          recoveryExpired={state === "access-forgot-expired"}
        />
      </AccessFrame>
    );
  }

  if (state.startsWith("access-reset")) {
    return (
      <AccessFrame titleId="reset-password-title">
        {state === "access-reset-pending" || state === "access-reset-error" ? (
          <p role="status">
            {state === "access-reset-pending"
              ? "Password update is shown as pending."
              : "AD12 example password message."}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <ResetPasswordForm
          hasRecoverySession={state !== "access-reset-expired"}
        />
      </AccessFrame>
    );
  }

  if (state.startsWith("access-register")) {
    return (
      <AccessFrame titleId="register-title">
        {state === "access-register-long" || state === "access-register-pending" || state === "access-register-error" || state === "access-register-owner" ? (
          <p role="status">
            {state === "access-register-pending"
              ? "Registration is shown as pending."
              : state === "access-register-error"
                ? "AD12 example registration message."
                : state === "access-register-owner"
                  ? `Example organization: ${LONG_NAME}.`
                  : `Example address: ${email}.`}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <RegisterForm
          mode={state === "access-register-owner" ? "owner" : "invitation"}
        />
      </AccessFrame>
    );
  }

  if (state.startsWith("access-check")) {
    return (
      <AccessFrame titleId="check-email-title">
        {state === "access-check-long" || state === "access-check-pending" || state === "access-check-error" ? (
          <p role="status">
            {state === "access-check-pending"
              ? "Verification is shown as pending."
              : state === "access-check-error"
                ? "AD12 example verification message."
                : `Example address: ${email}.`}{" "}
            Static preview only. This does not submit a form.
          </p>
        ) : null}
        <CheckEmailPanel
          reason={state === "access-check-expired" ? "verification_expired" : null}
          initialMessage={state === "access-check-error" ? "AD12 example verification message." : undefined}
        />
      </AccessFrame>
    );
  }

  if (state === "access-complete") {
    return (
      <AccessFrame titleId="complete-title">
        <CompleteRegistrationPanel />
      </AccessFrame>
    );
  }

  if (state === "access-complete-error") {
    return (
      <AccessFrame titleId="complete-title">
        <CompleteRegistrationPanel initialError="AD12 example completion message" />
      </AccessFrame>
    );
  }

  if (state === "access-complete-unavailable") {
    return (
      <AccessFrame titleId="complete-title">
        <OwnerOnboardingUnavailablePanel />
      </AccessFrame>
    );
  }

  if (state === "access-invite-disabled") {
    return <FeatureDisabledState />;
  }
  if (state === "access-invite-unavailable") {
    return <UnavailableState showAbandon={false} publicRegistrationEnabled={false} />;
  }
  if (state === "access-invite-recovery") {
    return <RecoveryState publicRegistrationEnabled={false} />;
  }
  if (state === "access-invite-continue") {
    return <ContinuationSignedOutState publicRegistrationEnabled={false} />;
  }
  if (state === "access-invite-accept" || state === "access-invite-pending" || state === "access-invite-mismatch") {
    return (
      <InviteAcceptSignedInView
        resultCode={state === "access-invite-mismatch" ? "email_mismatch" : null}
        publicRegistrationEnabled={false}
        isPending={state === "access-invite-pending"}
        showAccept={state !== "access-invite-mismatch"}
        onAccept={() => undefined}
        onSwitchAccount={() => undefined}
      />
    );
  }

  if (state === "access-onboarding-status") {
    return (
      <OnboardingStatusPanel
        title="Organization setup required"
        message="AD12 example setup message that stays readable on a narrow screen."
        primaryHref="/ad02-preview?state=access-login"
        primaryLabel="Continue"
        secondaryHref="/ad02-preview?state=access-login"
        secondaryLabel="Back"
      />
    );
  }

  if (state === "access-onboarding-error") {
    return <OnboardingErrorFallback reset={() => undefined} />;
  }

  if (state === "access-onboarding-model") {
    return <OperatingModelSelector organizationId={ORG} flow="v2" />;
  }

  if (state === "access-onboarding-company" || state === "access-onboarding-company-long") {
    return (
      <V2YouCompanyForm
        organizationId={ORG}
        initialValues={{
          displayName: long ? LONG_NAME : "AD12 example owner",
          organizationName: long ? LONG_NAME : "AD12 example north studio",
          teamSizeBand: "2_5",
        }}
      />
    );
  }

  if (state === "access-onboarding-workspace") {
    return (
      <WorkspaceConfirmation
        backHref="/ad02-preview?state=access-onboarding-model"
        continueHref="/ad02-preview?state=access-onboarding-status"
        presentation={{
          operatingModel: "course_seller",
          operatingModelLabel: "Course seller",
          modules: [
            { id: "home", label: "Today" },
            { id: "customers", label: "Customers" },
          ],
          workflow: ["AD12 example follow-up", "AD12 example next step"],
        }}
      />
    );
  }

  if (state === "access-onboarding-team") {
    return (
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={[]}
        backHref="/ad02-preview?state=access-onboarding-workspace"
      />
    );
  }

  if (state === "access-onboarding-creating") {
    return (
      <OnboardingCreating
        organizationId={ORG}
        initialIntents={[]}
        initialOutcomes={[]}
        initialRunStatus="setup_ready"
      />
    );
  }

  if (state === "access-onboarding-ready") {
    return (
      <OnboardingReady
        snapshot={{
          organizationId: ORG,
          workspaceName: long ? LONG_NAME : "AD12 example north studio",
          operatingModelLabel: "Course seller",
          runStatus: "ready_for_cutover",
          readyForCutoverAt: "2026-10-08T09:00:00.000Z",
          runCompletedAt: null,
          organizationCompletedAt: null,
          results: [],
        }}
      />
    );
  }

  return (
    <OnboardingWizard
      initialStep={1}
      context={{
        organizationId: ORG,
        membershipRole: "owner",
        isOwner: true,
        isComplete: false,
        missingRequiredFields: ["displayName", "organizationName"],
        displayName: long ? LONG_NAME : null,
        organizationName: long ? LONG_NAME : "",
        businessType: null,
        primaryAudience: null,
        primaryOffering: null,
        primaryGoal: null,
        teamSizeBand: null,
        onboardingCompletedAt: null,
        firstRunChecklistDismissedAt: null,
      }}
    />
  );
}
