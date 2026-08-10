import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_CLEARED_QUERY,
  INVITE_CONTINUATION_CLEARED_VALUE,
  INVITE_CONTINUATION_COOKIE_NAME,
} from "@/features/invitations/server/continuation";
import { isBoundInvitationRegistrationOrigin } from "@/features/invitations/server/registration-origin";
import { INVITE_REGISTRATION_ORIGIN_COOKIE_NAME } from "@/features/invitations/server/registration-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPublicRegistrationEnabled } from "@/features/auth/server/public-registration";
import { AbandonInvitationButton } from "@/features/invitations/ui/abandon-invitation-button";
import styles from "./page.module.css";

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

function UnavailableState({
  showAbandon,
  publicRegistrationEnabled,
}: {
  showAbandon: boolean;
  publicRegistrationEnabled: boolean;
}) {
  return (
    <main className={styles.page} aria-labelledby="invite-accept-title">
      <p className={styles.brand}>ZyntixAI</p>
      <h1 id="invite-accept-title" className={styles.title}>
        Invitation unavailable
      </h1>
      <p className={styles.copy}>
        This invitation link is unavailable. Request a new invitation from your
        organization administrator if you still need access.
      </p>
      {showAbandon ? (
        <AbandonInvitationButton
          publicRegistrationEnabled={publicRegistrationEnabled}
        />
      ) : (
        <p className={styles.copy}>
          <Link href="/login">Sign in</Link>
        </p>
      )}
    </main>
  );
}

function ReadyState({
  signedIn,
  publicRegistrationEnabled,
}: {
  signedIn: boolean;
  publicRegistrationEnabled: boolean;
}) {
  return (
    <main className={styles.page} aria-labelledby="invite-accept-title">
      <p className={styles.brand}>ZyntixAI</p>
      <h1 id="invite-accept-title" className={styles.title}>
        Invitation ready
      </h1>
      <p className={styles.copy}>
        {signedIn
          ? "Your invitation continuation is active. Acceptance will be available in a later step."
          : "Your invitation continuation is active. Sign in or create an account with the invited email to continue."}
      </p>
      {!signedIn ? (
        <p className={styles.copy}>
          <Link href="/login?next=/invite/accept">Sign in</Link>
          {" · "}
          <Link href="/register">Create account</Link>
        </p>
      ) : null}
      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
      />
    </main>
  );
}

function RecoveryState({
  publicRegistrationEnabled,
}: {
  publicRegistrationEnabled: boolean;
}) {
  return (
    <main className={styles.page} aria-labelledby="invite-accept-title">
      <p className={styles.brand}>ZyntixAI</p>
      <h1 id="invite-accept-title" className={styles.title}>
        Reopen your invitation
      </h1>
      <p className={styles.copy}>
        Your invitation session needs the latest invitation link from your email.
        Open that link again to continue. Acceptance is not available yet from this
        page.
      </p>
      <AbandonInvitationButton
        publicRegistrationEnabled={publicRegistrationEnabled}
      />
    </main>
  );
}

/**
 * Token-free Invitation continuation surface.
 * Does not call Acceptance. Auth resume and Accept POST belong to later slices.
 */
export default async function InviteAcceptPage({
  searchParams,
}: InviteAcceptPageProps) {
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
      return (
        <ReadyState
          signedIn={Boolean(user)}
          publicRegistrationEnabled={publicRegistrationEnabled}
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
