"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { abandonInvitationRegistrationAction } from "@/features/auth/actions/auth-actions";

type AbandonInvitationButtonProps = {
  publicRegistrationEnabled: boolean;
};

export function AbandonInvitationButton({
  publicRegistrationEnabled,
}: AbandonInvitationButtonProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleAbandon() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    startTransition(async () => {
      const result = await abandonInvitationRegistrationAction();
      if (result.message) {
        setMessage(result.message);
      }
      router.replace(result.redirectTo);
      router.refresh();
      pendingRef.current = false;
    });
  }

  return (
    <div>
      <button type="button" onClick={handleAbandon} disabled={isPending}>
        {isPending
          ? "Working…"
          : publicRegistrationEnabled
            ? "Continue without invitation"
            : "Leave invitation flow"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
