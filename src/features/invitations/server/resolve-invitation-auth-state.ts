/**
 * Server-only Invitation auth-state resolver (Slice B).
 * Derives trusted Invitation routing context from sealed cookies + auth.uid.
 * Does not expose raw bearer tokens to callers.
 */

import {
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_COOKIE_NAME,
} from "@/features/invitations/server/continuation";
import {
  INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
  isBoundInvitationRegistrationOrigin,
} from "@/features/invitations/server/registration-origin";

export type InvitationAuthState =
  | { kind: "raw_continuation" }
  | { kind: "bound_registration_origin" }
  | { kind: "none" };

export type InvitationCookieBag = {
  continuation?: string | null;
  registrationOrigin?: string | null;
};

export function readInvitationCookiesFromStore(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): InvitationCookieBag {
  return {
    continuation: cookieStore.get(INVITE_CONTINUATION_COOKIE_NAME)?.value,
    registrationOrigin: cookieStore.get(INVITE_REGISTRATION_ORIGIN_COOKIE_NAME)
      ?.value,
  };
}

/**
 * Priority:
 * 1. valid short raw Invitation continuation
 * 2. valid registration-origin bound to authenticated user
 * 3. none
 */
export function resolveInvitationAuthState(options: {
  cookies: InvitationCookieBag;
  authenticatedUserId?: string | null;
  nowMs?: number;
  env?: Record<string, string | undefined>;
}): InvitationAuthState {
  if (
    hasValidInvitationContinuation(options.cookies.continuation, {
      nowMs: options.nowMs,
      env: options.env,
    })
  ) {
    return { kind: "raw_continuation" };
  }

  if (
    isBoundInvitationRegistrationOrigin(
      options.cookies.registrationOrigin,
      options.authenticatedUserId,
      {
        nowMs: options.nowMs,
        env: options.env,
      },
    )
  ) {
    return { kind: "bound_registration_origin" };
  }

  return { kind: "none" };
}

export function hasTrustedInvitationAuthContext(
  state: InvitationAuthState,
): boolean {
  return (
    state.kind === "raw_continuation" ||
    state.kind === "bound_registration_origin"
  );
}
