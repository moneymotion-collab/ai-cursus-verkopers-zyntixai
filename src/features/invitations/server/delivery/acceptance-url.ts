import "server-only";

import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";
import { resolveSiteOrigin } from "@/lib/env/site-origin";

export const INVITATION_ACCEPTANCE_EXCHANGE_PATH =
  "/invite/accept/exchange" as const;

export const INVITATION_ACCEPTANCE_TOKEN_QUERY = "token" as const;

/**
 * Validate that an origin string is a usable absolute http(s) origin
 * (no credentials, path, query, or hash).
 */
export function isTrustedInvitationEmailOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      return false;
    }
    if (parsed.search !== "" || parsed.hash !== "") {
      return false;
    }
    if (!parsed.hostname) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the trusted invitation acceptance exchange URL.
 * Origin from resolveSiteOrigin — never from client input.
 * Only the `token` query parameter is set.
 */
export function buildInvitationAcceptanceUrl(
  rawToken: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (!isInvitationRawTokenShape(rawToken)) {
    return null;
  }

  const origin = resolveSiteOrigin(env);
  if (!isTrustedInvitationEmailOrigin(origin)) {
    return null;
  }

  const url = new URL(INVITATION_ACCEPTANCE_EXCHANGE_PATH, `${origin}/`);
  url.searchParams.set(INVITATION_ACCEPTANCE_TOKEN_QUERY, rawToken);

  if (url.pathname !== INVITATION_ACCEPTANCE_EXCHANGE_PATH) {
    return null;
  }

  const keys = [...url.searchParams.keys()];
  if (keys.length !== 1 || keys[0] !== INVITATION_ACCEPTANCE_TOKEN_QUERY) {
    return null;
  }

  const tokenValue = url.searchParams.get(INVITATION_ACCEPTANCE_TOKEN_QUERY);
  if (!isInvitationRawTokenShape(tokenValue)) {
    return null;
  }

  return url.toString();
}

/**
 * Confirm a candidate acceptance URL matches the trusted contract
 * (exact path + single token query). Used before rendering email bodies.
 */
export function isTrustedInvitationAcceptanceUrl(
  candidate: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    const origin = resolveSiteOrigin(env);
    if (!isTrustedInvitationEmailOrigin(origin)) {
      return false;
    }

    const parsed = new URL(candidate);
    const expectedOrigin = new URL(origin).origin;
    if (parsed.origin !== expectedOrigin) {
      return false;
    }
    if (parsed.pathname !== INVITATION_ACCEPTANCE_EXCHANGE_PATH) {
      return false;
    }

    const keys = [...parsed.searchParams.keys()];
    if (keys.length !== 1 || keys[0] !== INVITATION_ACCEPTANCE_TOKEN_QUERY) {
      return false;
    }

    return isInvitationRawTokenShape(
      parsed.searchParams.get(INVITATION_ACCEPTANCE_TOKEN_QUERY),
    );
  } catch {
    return false;
  }
}
