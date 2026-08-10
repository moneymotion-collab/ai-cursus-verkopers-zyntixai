"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/features/invitations/actions/accept-invitation-action";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { AbandonInvitationButton } from "@/features/invitations/ui/abandon-invitation-button";

type AcceptUiError = {
  code: string;
  message: string;
};

type InviteAcceptControlsProps = {
  publicRegistrationEnabled: boolean;
  showAccept: boolean;
};

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
    <div>
      {error ? (
        <p role="alert">{error.message}</p>
      ) : null}

      {showAccept ? (
        <p>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "Accepting…" : "Accept invitation"}
          </button>
        </p>
      ) : null}

      {error?.code === "email_mismatch" ? (
        <p>
          <button
            type="button"
            onClick={handleSwitchAccount}
            disabled={isPending}
          >
            Switch account
          </button>
        </p>
      ) : null}

      {error?.code === "verification_required" ? (
        <p>
          <a href="/register/check-email">Verify your email</a>
        </p>
      ) : null}

      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
        disabled={isPending}
      />
    </div>
  );
}
