import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/ui/register-form";
import {
  isPublicRegistrationEnabled,
  PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
} from "@/features/auth/server/public-registration";
import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_COOKIE_NAME,
} from "@/features/invitations/server/continuation";
import { isInvitationsFeatureEnabled } from "@/features/invitations/server/invitations-feature";
import styles from "../login/page.module.css";

/** Evaluate registration mode per request from flag + trusted continuation. */
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const continuation = cookieStore.get(INVITE_CONTINUATION_COOKIE_NAME)?.value;
  const trustedInvite =
    isInvitationsFeatureEnabled() &&
    hasValidInvitationContinuation(continuation);
  const publicEnabled = isPublicRegistrationEnabled();

  if (!publicEnabled && !trustedInvite) {
    redirect(PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH);
  }

  const mode = trustedInvite ? "invitation" : "owner";

  return (
    <main className={styles.page} aria-labelledby="register-title">
      <p className={styles.brand}>ZyntixAI</p>
      <RegisterForm mode={mode} />
    </main>
  );
}
