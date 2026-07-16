import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";
import { isProtectedApplicationPath } from "@/features/auth/server/safe-return-path";

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

  if (user && isLogin) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    const redirectResponse = NextResponse.redirect(homeUrl);
    applyCookies(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  return supabaseResponse;
}
