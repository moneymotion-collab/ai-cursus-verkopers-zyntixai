import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/login-form";
import { getSessionExpiredMessage } from "@/features/auth/server/normalize-auth-error";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";
import {
  isPublicRegistrationEnabled,
  PUBLIC_REGISTRATION_UNAVAILABLE_MESSAGE,
} from "@/features/auth/server/public-registration";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextRaw = firstParam(params.next);
  const reason = firstParam(params.reason);
  const registration = firstParam(params.registration);
  const safeNext = resolveSafeReturnPath(nextRaw);
  const sessionExpired = reason === "session_expired";
  const publicRegistrationEnabled = isPublicRegistrationEnabled();
  const registrationUnavailable =
    !publicRegistrationEnabled && registration === "disabled"
      ? PUBLIC_REGISTRATION_UNAVAILABLE_MESSAGE
      : undefined;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(await resolvePostLoginDestination(supabase, safeNext));
  }

  return (
    <main className={styles.page} aria-labelledby="login-title">
      <p className={styles.brand}>ZyntixAI</p>
      <LoginForm
        nextPath={safeNext}
        sessionExpired={sessionExpired}
        sessionExpiredMessage={sessionExpired ? getSessionExpiredMessage() : undefined}
        showRegistrationLink={publicRegistrationEnabled}
        registrationUnavailableMessage={registrationUnavailable}
      />
    </main>
  );
}
