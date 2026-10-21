import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../login/page.module.css";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.page} aria-labelledby="reset-password-title">
      <p className={styles.brand}>ZyntixAI</p>
      <ResetPasswordForm hasRecoverySession={Boolean(user)} />
    </main>
  );
}
