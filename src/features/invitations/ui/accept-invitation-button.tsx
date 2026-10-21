"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/features/invitations/actions/accept-invitation-action";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { AbandonInvitationButton } from "@/features/invitations/ui/abandon-invitation-button";
import type { AcceptInvitationUiCode } from "@/features/invitations/server/accept-invitation-result";
import {
  InviteAcceptShell,
  INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF,
  INVITE_ACCEPT_VERIFY_EMAIL_HREF,
  resolveInviteAcceptSignedInCopy,
} from "@/features/invitations/ui/invite-accept-states";

type AcceptUiError = {
  code: AcceptInvitationUiCode;
  message: string;
};

type InviteAcceptControlsProps = {
  publicRegistrationEnabled: boolean;
  showAccept: boolean;
};

type InviteAcceptSignedInViewProps = {
  resultCode: AcceptInvitationUiCode | null;
  publicRegistrationEnabled: boolean;
  isPending: boolean;
  showAccept: boolean;
  onAccept: () => void;
  onSwitchAccount: () => void;
};

export function InviteAcceptSignedInView({
  resultCode,
  publicRegistrationEnabled,
  isPending,
  showAccept,
  onAccept,
  onSwitchAccount,
}: InviteAcceptSignedInViewProps) {
  const copy = resolveInviteAcceptSignedInCopy(resultCode);

  return (
    <InviteAcceptShell
      heading={copy.heading}
      explanation={copy.explanation}
      explanationRole={resultCode ? "alert" : undefined}
    >
      {showAccept ? (
        <p>
          <button
            type="button"
            onClick={onAccept}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "Accepting…" : "Accept invitation"}
          </button>
        </p>
      ) : null}

      {resultCode === "email_mismatch" ? (
        <p>
          <button
            type="button"
            onClick={onSwitchAccount}
            disabled={isPending}
          >
            Switch account
          </button>
        </p>
      ) : null}

      {resultCode === "verification_required" ? (
        <p>
          <a href={INVITE_ACCEPT_VERIFY_EMAIL_HREF}>Verify your email</a>
        </p>
      ) : null}

      {resultCode === "auth_required" ? (
        <p>
          <a href={INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF}>Sign in</a>
        </p>
      ) : null}

      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
        disabled={isPending}
      />
    </InviteAcceptShell>
  );
}

export function InviteAcceptControls({
  publicRegistrationEnabled,
  showAccept,
}: InviteAcceptControlsProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<AcceptUiError | null>(null);

  function handleAccept() {
    if (pendingRef.current || !showAccept) {
      return;
    }
    pendingRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await acceptInvitationAction();
        setError({ code: result.code, message: result.message });
        router.refresh();
      } catch {
        // Successful Accept uses redirect(); navigation may throw here.
      } finally {
        pendingRef.current = false;
      }
    });
  }

  function handleSwitchAccount() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <InviteAcceptSignedInView
      resultCode={error?.code ?? null}
      publicRegistrationEnabled={publicRegistrationEnabled}
      isPending={isPending}
      showAccept={showAccept}
      onAccept={handleAccept}
      onSwitchAccount={handleSwitchAccount}
    />
  );
}
