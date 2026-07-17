import { redirect } from "next/navigation";
import { CheckEmailPanel } from "@/features/auth/ui/register-status";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import { resolveAuthenticatedLanding } from "@/features/auth/server/resolve-authenticated-landing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../login/page.module.css";

export default async function RegisterCheckEmailPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    const memberships = await listActiveOrganizationMemberships(supabase);
    if (memberships.ok && memberships.memberships.length > 0) {
      redirect(await resolveAuthenticatedLanding(supabase));
    }
    redirect("/register/complete");
  }

  return (
    <main className={styles.page} aria-labelledby="check-email-title">
      <p className={styles.brand}>ZyntixAI</p>
      <CheckEmailPanel />
    </main>
  );
}
