import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_CLEARED_QUERY,
  INVITE_CONTINUATION_CLEARED_VALUE,
  INVITE_CONTINUATION_COOKIE_NAME,
} from "@/features/invitations/server/continuation";
import { isInvitationsFeatureEnabled } from "@/features/invitations/server/invitations-feature";
import { isBoundInvitationRegistrationOrigin } from "@/features/invitations/server/registration-origin";
import { INVITE_REGISTRATION_ORIGIN_COOKIE_NAME } from "@/features/invitations/server/registration-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPublicRegistrationEnabled } from "@/features/auth/server/public-registration";
import { InviteAcceptControls } from "@/features/invitations/ui/accept-invitation-button";
import {
  ContinuationSignedOutState,
  FeatureDisabledState,
  RecoveryState,
  UnavailableState,
} from "@/features/invitations/ui/invite-accept-states";

/** Cookie-dependent UI must never be statically shared across users. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Invitation | ZyntixAI",
  description: "Continue an organization invitation.",
  referrer: "no-referrer",
};

type InviteAcceptPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Token-free Invitation continuation surface.
 * Acceptance mutates only via explicit Accept server action (Slice C).
 */
export default async function InviteAcceptPage({
  searchParams,
}: InviteAcceptPageProps) {
  if (!isInvitationsFeatureEnabled()) {
    return (
      <FeatureDisabledState explanation="Invitations are currently unavailable. Please try again later." />
    );
  }

  const params = await searchParams;
  const clearedAttempt =
    firstParam(params[INVITE_CONTINUATION_CLEARED_QUERY]) ===
    INVITE_CONTINUATION_CLEARED_VALUE;

  const cookieStore = await cookies();
  const sealed = cookieStore.get(INVITE_CONTINUATION_COOKIE_NAME)?.value;
  const originCookie = cookieStore.get(INVITE_REGISTRATION_ORIGIN_COOKIE_NAME)?.value;
  const publicRegistrationEnabled = isPublicRegistrationEnabled();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (sealed) {
    const active = hasValidInvitationContinuation(sealed);
    if (active) {
      if (!user) {
        return (
          <ContinuationSignedOutState
            publicRegistrationEnabled={publicRegistrationEnabled}
          />
        );
      }

      return (
        <InviteAcceptControls
          publicRegistrationEnabled={publicRegistrationEnabled}
          showAccept
        />
      );
    }

    if (!clearedAttempt) {
      redirect("/invite/accept/exchange");
    }
  }

  if (
    user &&
    isBoundInvitationRegistrationOrigin(originCookie, user.id)
  ) {
    return (
      <RecoveryState publicRegistrationEnabled={publicRegistrationEnabled} />
    );
  }

  return (
    <UnavailableState
      showAbandon={Boolean(user || originCookie)}
      publicRegistrationEnabled={publicRegistrationEnabled}
    />
  );
}
