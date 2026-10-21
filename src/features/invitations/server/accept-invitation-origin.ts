/**
 * Same-origin defense for Invitation Accept mutation (Slice C).
 * Complements SameSite=Lax + Server Action POST semantics.
 */

import { resolveSiteOrigin } from "@/lib/env/site-origin";

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Fail closed when Origin is missing or does not match the trusted site origin.
 * Unit tests must supply a matching Origin header mock.
 */
export function assertInvitationAcceptSameOrigin(
  headerStore: { get: (name: string) => string | null },
  env: Record<string, string | undefined> = process.env,
): boolean {
  const trusted = normalizeOrigin(resolveSiteOrigin(env));
  if (!trusted) {
    return false;
  }

  const rawOrigin = headerStore.get("origin");
  if (!rawOrigin) {
    return false;
  }

  const requestOrigin = normalizeOrigin(rawOrigin);
  if (!requestOrigin) {
    return false;
  }

  return requestOrigin === trusted;
}
