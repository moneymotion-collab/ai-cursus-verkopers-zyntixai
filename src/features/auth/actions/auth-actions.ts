"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";
import { parseLoginInput } from "@/features/auth/server/login-schema";
import {
  getRecoveryGenericSuccessMessage,
  normalizeLoginError,
  normalizePasswordUpdateError,
  normalizeRecoveryRequestError,
  recoveryErrorMessage,
  zodFieldErrors,
} from "@/features/auth/server/normalize-auth-error";
import {
  parseInviteRegisterInput,
  parseRegisterInput,
  parseResendVerificationInput,
} from "@/features/auth/server/register-schema";
import {
  parseForgotPasswordInput,
  parseResetPasswordInput,
} from "@/features/auth/server/recovery-schema";
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
  OWNER_ONBOARDING_UNAVAILABLE_MESSAGE,
  PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
} from "@/features/auth/server/public-registration";
import {
  buildAuthCallbackUrl,
  resolveSiteOrigin,
} from "@/lib/env/site-origin";
import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_COOKIE_NAME,
  shouldUseSecureInvitationContinuationCookie,
} from "@/features/invitations/server/continuation";
import {
  buildInvitationRegistrationOriginCookieOptions,
  INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
  isBoundInvitationRegistrationOrigin,
  isRealNewAuthIdentity,
  sealInvitationRegistrationOrigin,
} from "@/features/invitations/server/registration-origin";
import { readInvitationCookiesFromStore } from "@/features/invitations/server/resolve-invitation-auth-state";

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

export type ForgotPasswordActionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type ResetPasswordActionResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      redirectTo?: string;
    };

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

    const cookieStore = await cookies();
    const invitationCookies = readInvitationCookiesFromStore(cookieStore);
    const redirectTo = await resolvePostLoginDestination(
      supabase,
      parsed.data.next,
      {
        invitationCookies,
        authenticatedUserId: user?.id ?? null,
      },
    );
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
  const cookieStore = await cookies();
  const continuationCookie = cookieStore.get(INVITE_CONTINUATION_COOKIE_NAME)?.value;
  const trustedInviteContinuation = hasValidInvitationContinuation(continuationCookie);
  const publicEnabled = isPublicRegistrationEnabled();

  // Mode authority derived server-side only (never trust client registrationMode).
  const inviteMode = trustedInviteContinuation;
  const normalMode = publicEnabled && !trustedInviteContinuation;

  if (!inviteMode && !normalMode) {
    return {
      ok: false,
      code: "registration_disabled",
      message: registrationErrorMessage("registration_disabled"),
      redirectTo: PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH,
    };
  }

  if (inviteMode) {
    const parsed = parseInviteRegisterInput(input);
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
        return {
          ok: false,
          code: "authenticated_user_cannot_self_register",
          message: registrationErrorMessage("authenticated_user_cannot_self_register"),
          redirectTo: "/invite/accept",
        };
      }

      const origin = resolveSiteOrigin();
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(origin),
          data: {
            display_name: parsed.data.name,
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

      // Only seal registration-origin for real newly created identities.
      if (isRealNewAuthIdentity(data.user)) {
        const sealed = sealInvitationRegistrationOrigin(data.user.id);
        if (sealed.ok) {
          const secure = shouldUseSecureInvitationContinuationCookie(origin);
          cookieStore.set(
            INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
            sealed.cookieValue,
            buildInvitationRegistrationOriginCookieOptions(sealed.maxAge, secure),
          );
        }
      }

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
          redirectTo: await resolvePostLoginDestination(supabase, "/", {
            invitationCookies: readInvitationCookiesFromStore(cookieStore),
            authenticatedUserId: existingUser.id,
          }),
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

    const origin = resolveSiteOrigin();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(origin),
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

    const origin = resolveSiteOrigin();

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
        emailRedirectTo: buildAuthCallbackUrl(origin),
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
    // OD-APP-B6 Option A: owner completion requires public registration enabled.
    if (!isPublicRegistrationEnabled()) {
      return {
        ok: false,
        redirectTo: "/register/complete",
        message: OWNER_ONBOARDING_UNAVAILABLE_MESSAGE,
      };
    }

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

    const cookieStore = await cookies();
    const invitationCookies = readInvitationCookiesFromStore(cookieStore);
    // Invitation priority: do not owner-provision while trusted invite context exists.
    if (
      hasValidInvitationContinuation(invitationCookies.continuation) ||
      isBoundInvitationRegistrationOrigin(
        invitationCookies.registrationOrigin,
        user.id,
      )
    ) {
      return {
        ok: false,
        redirectTo: "/invite/accept",
        message: "Finish your invitation before creating a workspace.",
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

/**
 * Explicit abandonment of Invitation registration context.
 * Clears invite cookies; never creates an Organization.
 */
export async function abandonInvitationRegistrationAction(): Promise<{
  ok: true;
  redirectTo: string;
  message?: string;
}> {
  const secure = shouldUseSecureInvitationContinuationCookie(
    resolveSiteOrigin(),
  );
  const cookieStore = await cookies();

  cookieStore.set(
    INVITE_CONTINUATION_COOKIE_NAME,
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure,
      expires: new Date(0),
    },
  );
  cookieStore.set(
    INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
    "",
    buildInvitationRegistrationOriginCookieOptions(0, secure),
  );

  if (isPublicRegistrationEnabled()) {
    return { ok: true, redirectTo: "/register/complete" };
  }

  return {
    ok: true,
    redirectTo: "/register/complete",
    message: OWNER_ONBOARDING_UNAVAILABLE_MESSAGE,
  };
}

/**
 * Password recovery request. Enumeration-safe success; never gated by
 * PUBLIC_REGISTRATION_ENABLED.
 */
export async function requestPasswordResetAction(
  input: unknown,
): Promise<ForgotPasswordActionResult> {
  const parsed = parseForgotPasswordInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: recoveryErrorMessage("invalid_input"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const success = {
    ok: true as const,
    message: getRecoveryGenericSuccessMessage(),
  };

  try {
    const origin = resolveSiteOrigin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: buildAuthCallbackUrl(origin, "/reset-password"),
    });

    if (error) {
      const code = normalizeRecoveryRequestError(error);
      if (code === "rate_limited") {
        return {
          ok: false,
          message: recoveryErrorMessage("rate_limited"),
        };
      }
      // Enumeration-safe: treat other provider failures as generic success.
      return success;
    }

    return success;
  } catch {
    return success;
  }
}

/**
 * Update password using the authenticated recovery session, then sign out so
 * the user signs in fresh with the new password.
 */
export async function updatePasswordAction(
  input: unknown,
): Promise<ResetPasswordActionResult> {
  const parsed = parseResetPasswordInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: recoveryErrorMessage("invalid_input"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        message: recoveryErrorMessage("recovery_expired"),
        redirectTo: "/forgot-password?reason=recovery_expired",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      const code = normalizePasswordUpdateError(error);
      return {
        ok: false,
        message: recoveryErrorMessage(code),
        redirectTo:
          code === "recovery_expired"
            ? "/forgot-password?reason=recovery_expired"
            : undefined,
      };
    }

    await supabase.auth.signOut();
    return { ok: true, redirectTo: "/login?reset=success" };
  } catch {
    return {
      ok: false,
      message: recoveryErrorMessage("temporary_service_failure"),
    };
  }
}
