import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import styles from "../login/page.module.css";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const reason = firstParam(params.reason);
  const recoveryExpired = reason === "recovery_expired";

  return (
    <main className={styles.page} aria-labelledby="forgot-password-title">
      <p className={styles.brand}>ZyntixAI</p>
      <ForgotPasswordForm recoveryExpired={recoveryExpired} />
    </main>
  );
}
