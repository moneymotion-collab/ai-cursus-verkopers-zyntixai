import { redirect } from "next/navigation";
import { CompleteRegistrationPanel } from "@/features/auth/ui/register-status";
import { tryProvisionAndLand } from "@/features/auth/server/resolve-registration-destination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../login/page.module.css";

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

  const landed = await tryProvisionAndLand(supabase, user);
  if (landed.ok) {
    redirect(landed.path);
  }

  return (
    <main className={styles.page} aria-labelledby="complete-title">
      <p className={styles.brand}>ZyntixAI</p>
      <CompleteRegistrationPanel />
    </main>
  );
}
