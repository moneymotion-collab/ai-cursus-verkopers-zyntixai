"use server";

import { redirect } from "next/navigation";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";
import { parseLoginInput } from "@/features/auth/server/login-schema";
import {
  normalizeLoginError,
  zodFieldErrors,
} from "@/features/auth/server/normalize-auth-error";
import {
  parseRegisterInput,
  parseResendVerificationInput,
} from "@/features/auth/server/register-schema";
import {
  normalizeRegistrationAuthError,
  registrationErrorMessage,
  type RegistrationErrorCode,
} from "@/features/auth/server/normalize-registration-error";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryProvisionAndLand } from "@/features/auth/server/resolve-registration-destination";
import { ensureRegistrationIntent } from "@/features/auth/server/complete-owner-provisioning";
import {
  isPublicRegistrationEnabled,
  PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
} from "@/features/auth/server/public-registration";

export type LoginActionResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type RegisterActionResult =
  | { ok: true; status: "verification_required"; redirectTo: string }
  | {
      ok: false;
      code: RegistrationErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
      redirectTo?: string;
    };

function siteOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://127.0.0.1:3000";
}

export async function loginAction(input: unknown): Promise<LoginActionResult> {
  const parsed = parseLoginInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return {
        ok: false,
        message: normalizeLoginError(error),
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !user.email_confirmed_at) {
      return { ok: true, redirectTo: "/register/check-email" };
    }

    const redirectTo = await resolvePostLoginDestination(supabase, parsed.data.next);
    return { ok: true, redirectTo };
  } catch {
    return {
      ok: false,
      message: "Unable to sign in. Please try again.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function registerAction(input: unknown): Promise<RegisterActionResult> {
  if (!isPublicRegistrationEnabled()) {
    return {
      ok: false,
      code: "registration_disabled",
      message: registrationErrorMessage("registration_disabled"),
      redirectTo: PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
    };
  }

  const parsed = parseRegisterInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_input",
      message: registrationErrorMessage("invalid_input"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser();

    if (existingUser) {
      const memberships = await listActiveOrganizationMemberships(supabase);
      if (memberships.ok && memberships.memberships.length > 0) {
        return {
          ok: false,
          code: "authenticated_user_cannot_self_register",
          message: registrationErrorMessage("authenticated_user_cannot_self_register"),
          redirectTo: await resolvePostLoginDestination(supabase, "/"),
        };
      }

      if (!existingUser.email_confirmed_at) {
        return {
          ok: false,
          code: "email_verification_required",
          message: registrationErrorMessage("email_verification_required"),
          redirectTo: "/register/check-email",
        };
      }

      return {
        ok: false,
        code: "provisioning_incomplete",
        message: registrationErrorMessage("provisioning_incomplete"),
        redirectTo: "/register/complete",
      };
    }

    const origin = siteOrigin();
    if (!origin) {
      return {
        ok: false,
        code: "configuration_error",
        message: registrationErrorMessage("configuration_error"),
      };
    }

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          display_name: parsed.data.name,
          company_name: parsed.data.companyName,
        },
      },
    });

    if (error) {
      const code = normalizeRegistrationAuthError(error);
      return {
        ok: false,
        code,
        message: registrationErrorMessage(code),
      };
    }

    // Enumeration-safe success: always send the user to check-email.
    return {
      ok: true,
      status: "verification_required",
      redirectTo: "/register/check-email",
    };
  } catch {
    return {
      ok: false,
      code: "temporary_service_failure",
      message: registrationErrorMessage("temporary_service_failure"),
    };
  }
}

const RESEND_SAFE_MESSAGE =
  "If your email still needs verification, a new message will arrive shortly.";

/**
 * Resend signup verification. Uses the authenticated unverified user when present;
 * otherwise accepts an email so check-email works without a pre-confirm session.
 * Always enumeration-safe except for an explicit rate-limit signal.
 */
export async function resendVerificationAction(
  input?: unknown,
): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const origin = siteOrigin();
    if (!origin) {
      return { ok: true, message: RESEND_SAFE_MESSAGE };
    }

    if (user?.email_confirmed_at) {
      return {
        ok: true,
        message: "Your email is already verified. Continue account setup.",
      };
    }

    let email = user?.email?.trim().toLowerCase() ?? null;
    if (!email) {
      const parsed = parseResendVerificationInput(input ?? {});
      if (!parsed.success) {
        // Invalid or missing email: do not reveal whether an account exists.
        return { ok: true, message: RESEND_SAFE_MESSAGE };
      }
      email = parsed.data.email;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      const code = normalizeRegistrationAuthError(error);
      if (code === "rate_limited") {
        return { ok: false, message: registrationErrorMessage("rate_limited") };
      }
    }

    return { ok: true, message: RESEND_SAFE_MESSAGE };
  } catch {
    return { ok: true, message: RESEND_SAFE_MESSAGE };
  }
}

export async function completeRegistrationAction(): Promise<{
  ok: boolean;
  redirectTo: string;
  message?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        redirectTo: "/login",
        message: registrationErrorMessage("unauthorized"),
      };
    }

    if (!user.email_confirmed_at) {
      return {
        ok: false,
        redirectTo: "/register/check-email",
        message: registrationErrorMessage("email_verification_required"),
      };
    }

    await ensureRegistrationIntent(supabase, user);
    const result = await tryProvisionAndLand(supabase, user);
    if (!result.ok) {
      return {
        ok: false,
        redirectTo: "/register/complete",
        message: registrationErrorMessage("provisioning_failed"),
      };
    }

    return { ok: true, redirectTo: result.path };
  } catch {
    return {
      ok: false,
      redirectTo: "/register/complete",
      message: registrationErrorMessage("temporary_service_failure"),
    };
  }
}
