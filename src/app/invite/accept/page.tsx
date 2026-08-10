import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_CLEARED_QUERY,
  INVITE_CONTINUATION_CLEARED_VALUE,
  INVITE_CONTINUATION_COOKIE_NAME,
} from "@/features/invitations/server/continuation";
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

function UnavailableState() {
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
    </main>
  );
}

function ReadyState() {
  return (
    <main className={styles.page} aria-labelledby="invite-accept-title">
      <p className={styles.brand}>ZyntixAI</p>
      <h1 id="invite-accept-title" className={styles.title}>
        Invitation ready
      </h1>
      <p className={styles.copy}>
        Your invitation continuation is active. Sign in with the invited email
        to continue in a later step.
      </p>
    </main>
  );
}

/**
 * Token-free Invitation continuation surface (Slice A).
 *
 * Does not expose organization, role, email, or invitation identifiers.
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

  if (sealed) {
    const active = hasValidInvitationContinuation(sealed);
    if (active) {
      return <ReadyState />;
    }

    // Loop breaker: after exchange clear redirect (?cleared=1), terminate even
    // if the browser still presents a stale/invalid cookie.
    if (clearedAttempt) {
      return <UnavailableState />;
    }

    redirect("/invite/accept/exchange");
  }

  return <UnavailableState />;
}
