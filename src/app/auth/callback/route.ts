import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";
import {
  isPasswordResetDestination,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import { INVITE_CONTINUATION_COOKIE_NAME } from "@/features/invitations/server/continuation";
import { INVITE_REGISTRATION_ORIGIN_COOKIE_NAME } from "@/features/invitations/server/registration-origin";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isEmailOtpType(value: string): value is EmailOtpType {
  return EMAIL_OTP_TYPES.has(value);
}

/**
 * Email verification / password-recovery Auth callback.
 * Accepts Supabase PKCE `code` exchange or email `token_hash`+`type` verifyOtp.
 * Redirects via allowlisted paths. Never logs authorization codes or tokens.
 * NEVER auto-provisions owner Organizations (OD-APP-B3 / B4).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpTypeRaw = searchParams.get("type");
  const nextRaw = searchParams.get("next");
  const providerError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const safeNext = resolveSafeReturnPath(nextRaw, "/register/complete");
  const isRecoveryDestination = isPasswordResetDestination(safeNext);

  const cookiesToSet: CookieToSet[] = [];
  let response = NextResponse.redirect(new URL("/register/check-email", origin));

  const { url, publishableKey } = getPublicSupabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(incoming) {
        cookiesToSet.splice(0, cookiesToSet.length, ...incoming);
      },
    },
  });

  function finalize(targetPath: string) {
    response = NextResponse.redirect(new URL(targetPath, origin));
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  function failurePath() {
    if (isRecoveryDestination || nextRaw === "/reset-password") {
      return "/forgot-password?reason=recovery_expired";
    }
    // Account may already be confirmed even when session exchange fails.
    return "/register/check-email?reason=verification_expired";
  }

  if (providerError || errorCode) {
    return finalize(failurePath());
  }

  let sessionError: { message?: string } | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    sessionError = error;
  } else if (tokenHash && otpTypeRaw && isEmailOtpType(otpTypeRaw)) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpTypeRaw,
      token_hash: tokenHash,
    });
    sessionError = error;
  } else {
    return finalize(failurePath());
  }

  if (sessionError) {
    return finalize(failurePath());
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return finalize(isRecoveryDestination ? failurePath() : "/login");
  }

  // Password recovery: land on reset form. Do not run owner provisioning.
  if (isRecoveryDestination) {
    return finalize("/reset-password");
  }

  if (!user.email_confirmed_at) {
    return finalize("/register/check-email");
  }

  const invitationCookies = {
    continuation: request.cookies.get(INVITE_CONTINUATION_COOKIE_NAME)?.value,
    registrationOrigin: request.cookies.get(INVITE_REGISTRATION_ORIGIN_COOKIE_NAME)
      ?.value,
  };

  const destination = await resolvePostAuthDestination(supabase, user, {
    invitationCookies,
  });

  if (destination.kind === "invite_accept") {
    return finalize(destination.path);
  }

  if (destination.kind === "product") {
    if (
      safeNext.startsWith("/leads") ||
      safeNext.startsWith("/customers") ||
      safeNext.startsWith("/tasks")
    ) {
      return finalize(safeNext);
    }
    return finalize(destination.path);
  }

  // Prefer allowlisted next when it is the invite accept surface.
  if (safeNext === "/invite/accept" || safeNext.startsWith("/invite/accept?")) {
    return finalize(safeNext);
  }

  return finalize(destination.path);
}
