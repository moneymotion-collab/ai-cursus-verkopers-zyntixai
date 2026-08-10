import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckEmailPanel } from "@/features/auth/ui/register-status";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";
import styles from "../../login/page.module.css";

export const dynamic = "force-dynamic";

export default async function RegisterCheckEmailPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    const cookieStore = await cookies();
    const destination = await resolvePostAuthDestination(supabase, user, {
      invitationCookies: readInvitationCookiesFromStore(cookieStore),
    });
    redirect(destination.path);
  }

  return (
    <main className={styles.page} aria-labelledby="check-email-title">
      <p className={styles.brand}>ZyntixAI</p>
      <CheckEmailPanel />
    </main>
  );
}
