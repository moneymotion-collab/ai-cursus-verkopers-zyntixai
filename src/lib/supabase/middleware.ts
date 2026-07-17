import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";
import {
  isAuthCallbackPath,
  isProtectedApplicationPath,
  isRegistrationPath,
} from "@/features/auth/server/safe-return-path";
import {
  isPublicRegistrationEnabled,
  isPublicRegistrationEntryPath,
} from "@/features/auth/server/public-registration";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applyCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("auth-token") ||
        (cookie.name.startsWith("sb-") && cookie.name.includes("auth")),
    );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const cookiesToSet: CookieToSet[] = [];
  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(incoming) {
        incoming.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.splice(0, cookiesToSet.length, ...incoming);
        supabaseResponse = NextResponse.next({ request });
        applyCookies(supabaseResponse, cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isRegister = isRegistrationPath(pathname);
  const isCallback = isAuthCallbackPath(pathname);
  const isProtected = isProtectedApplicationPath(pathname);

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    if (hasSupabaseAuthCookie(request)) {
      loginUrl.searchParams.set("reason", "session_expired");
    }
    const redirectResponse = NextResponse.redirect(loginUrl);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (user && isProtected && !user.email_confirmed_at) {
    const verifyUrl = request.nextUrl.clone();
    verifyUrl.pathname = "/register/check-email";
    verifyUrl.search = "";
    const redirectResponse = NextResponse.redirect(verifyUrl);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (user && isLogin) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    const redirectResponse = NextResponse.redirect(homeUrl);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  // Authenticated visitors on /register: never create a second org via the form.
  if (user && pathname === "/register") {
    const target = request.nextUrl.clone();
    target.search = "";
    if (!user.email_confirmed_at) {
      target.pathname = "/register/check-email";
    } else {
      target.pathname = "/";
    }
    const redirectResponse = NextResponse.redirect(target);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  // PX2-DARK.1: exact /register only — nested recovery routes stay reachable.
  if (
    !user &&
    isPublicRegistrationEntryPath(pathname) &&
    !isPublicRegistrationEnabled()
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("registration", "disabled");
    const redirectResponse = NextResponse.redirect(loginUrl);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (!user && (isRegister || isCallback)) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
