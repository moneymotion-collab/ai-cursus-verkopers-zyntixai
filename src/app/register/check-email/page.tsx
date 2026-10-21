import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckEmailPanel } from "@/features/auth/ui/register-status";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";
import styles from "../../login/page.module.css";

export const dynamic = "force-dynamic";

type RegisterCheckEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function RegisterCheckEmailPage({
  searchParams,
}: RegisterCheckEmailPageProps) {
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

  const params = await searchParams;
  const reason = firstParam(params.reason) ?? null;

  return (
    <main className={styles.page} aria-labelledby="check-email-title">
      <p className={styles.brand}>ZyntixAI</p>
      <CheckEmailPanel reason={reason} />
    </main>
  );
}
