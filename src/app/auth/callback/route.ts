import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";
import { tryProvisionAndLand } from "@/features/auth/server/resolve-registration-destination";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Email verification / Auth callback.
 * Accepts only Supabase code exchange; redirects via allowlisted paths.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const safeNext = resolveSafeReturnPath(nextRaw, "/register/complete");

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

  if (!code) {
    return finalize("/register/check-email?reason=verification_expired");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return finalize("/register/check-email?reason=verification_expired");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return finalize("/login");
  }

  if (!user.email_confirmed_at) {
    return finalize("/register/check-email");
  }

  const provisioned = await tryProvisionAndLand(supabase, user);
  if (provisioned.ok) {
    if (safeNext.startsWith("/leads") || safeNext.startsWith("/customers") || safeNext.startsWith("/tasks")) {
      return finalize(safeNext.includes("org=") ? safeNext : provisioned.path);
    }
    return finalize(provisioned.path);
  }

  return finalize("/register/complete");
}
