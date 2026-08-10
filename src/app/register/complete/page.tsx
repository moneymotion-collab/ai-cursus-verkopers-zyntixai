import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CompleteRegistrationPanel,
  OwnerOnboardingUnavailablePanel,
} from "@/features/auth/ui/register-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPublicRegistrationEnabled } from "@/features/auth/server/public-registration";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";
import styles from "../../login/page.module.css";

/** Cookie-aware owner completion surface — never provisions on GET. */
export const dynamic = "force-dynamic";

export default async function RegisterCompletePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/register/check-email");
  }

  const cookieStore = await cookies();
  const invitationCookies = readInvitationCookiesFromStore(cookieStore);
  const destination = await resolvePostAuthDestination(supabase, user, {
    invitationCookies,
  });

  if (destination.kind === "invite_accept") {
    redirect(destination.path);
  }

  if (destination.kind === "product") {
    redirect(destination.path);
  }

  const ownerOnboardingEnabled = isPublicRegistrationEnabled();

  return (
    <main className={styles.page} aria-labelledby="complete-title">
      <p className={styles.brand}>ZyntixAI</p>
      {ownerOnboardingEnabled ? (
        <CompleteRegistrationPanel />
      ) : (
        <OwnerOnboardingUnavailablePanel />
      )}
    </main>
  );
}
