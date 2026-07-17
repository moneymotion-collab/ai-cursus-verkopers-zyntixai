import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/ui/register-form";
import {
  isPublicRegistrationEnabled,
  PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
} from "@/features/auth/server/public-registration";
import styles from "../login/page.module.css";

/** Evaluate PUBLIC_REGISTRATION_ENABLED per request (fail-closed). */
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  if (!isPublicRegistrationEnabled()) {
    redirect(PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH);
  }

  return (
    <main className={styles.page} aria-labelledby="register-title">
      <p className={styles.brand}>ZyntixAI</p>
      <RegisterForm />
    </main>
  );
}
