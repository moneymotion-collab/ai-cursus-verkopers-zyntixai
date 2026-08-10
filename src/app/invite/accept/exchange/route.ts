import { NextResponse, type NextRequest } from "next/server";
import {
  applyInvitationContinuationCookie,
  clearInvitationContinuationCookie,
  INVITE_CONTINUATION_CLEARED_QUERY,
  INVITE_CONTINUATION_CLEARED_VALUE,
  isInvitationRawTokenShape,
  sealInvitationContinuation,
  shouldUseSecureInvitationContinuationCookie,
} from "@/features/invitations/server/continuation";

const TOKEN_FREE_ACCEPT_PATH = "/invite/accept";
const REFERRER_POLICY = "no-referrer";

function tokenFreeAcceptUrl(
  request: NextRequest,
  options?: { cleared?: boolean },
): URL {
  const destination = new URL(TOKEN_FREE_ACCEPT_PATH, request.url);
  if (options?.cleared) {
    destination.searchParams.set(
      INVITE_CONTINUATION_CLEARED_QUERY,
      INVITE_CONTINUATION_CLEARED_VALUE,
    );
  }
  return destination;
}

function nonCacheableRedirect(destination: URL): NextResponse {
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Referrer-Policy", REFERRER_POLICY);
  // Set-Cookie must never be shared via CDN/proxy caches.
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Pragma", "no-cache");
  return response;
}

/**
 * Public Invitation entry exchange (Slice A).
 *
 * GET may only: validate raw-token shape, seal HttpOnly continuation, redirect.
 * MUST NOT invoke Acceptance mutation RPCs or mutate Invitation DB state.
 * Client-controlled redirect parameters are ignored (open-redirect safe).
 */
export async function GET(request: NextRequest) {
  const secure = shouldUseSecureInvitationContinuationCookie(request.url);
  const rawToken = request.nextUrl.searchParams.get("token");

  if (!isInvitationRawTokenShape(rawToken)) {
    const response = nonCacheableRedirect(
      tokenFreeAcceptUrl(request, { cleared: true }),
    );
    clearInvitationContinuationCookie(response, secure);
    return response;
  }

  const sealed = sealInvitationContinuation(rawToken);
  if (!sealed.ok) {
    const response = nonCacheableRedirect(
      tokenFreeAcceptUrl(request, { cleared: true }),
    );
    clearInvitationContinuationCookie(response, secure);
    return response;
  }

  const response = nonCacheableRedirect(tokenFreeAcceptUrl(request));
  applyInvitationContinuationCookie(
    response,
    sealed.cookieValue,
    sealed.maxAge,
    secure,
  );
  return response;
}
