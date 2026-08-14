import type { ImplementedSocialProvider } from "./provider";
import type { SocialCredentialReferenceId } from "./types";

/**
 * Non-secret credential metadata. Token values must never appear here.
 * `credentialVersion` is the compare-and-swap / single-writer refresh token
 * for B1.1-B/D. Persistence/locking is not this slice.
 *
 * Meta's ≥24h refresh rule is provider policy later, not generic domain.
 */
export type SocialCredentialMetadata = {
  credentialReferenceId: SocialCredentialReferenceId;
  provider: ImplementedSocialProvider;
  tokenExpiresAt: string | null;
  lastRefreshedAt: string | null;
  credentialVersion: number;
  reauthorizationRequired: boolean;
};

export type SocialTokenExpiryWarningState =
  | "unknown"
  | "valid"
  | "expiring_soon"
  | "expired";

export function resolveSocialTokenExpiryWarningState(input: {
  tokenExpiresAt: string | null;
  nowIso: string;
  expiringSoonWindowMs?: number;
}): SocialTokenExpiryWarningState {
  if (input.tokenExpiresAt == null) {
    return "unknown";
  }
  const expiresAt = Date.parse(input.tokenExpiresAt);
  const now = Date.parse(input.nowIso);
  if (Number.isNaN(expiresAt) || Number.isNaN(now)) {
    return "unknown";
  }
  if (expiresAt <= now) {
    return "expired";
  }
  const windowMs = input.expiringSoonWindowMs ?? 24 * 60 * 60 * 1000;
  if (expiresAt - now <= windowMs) {
    return "expiring_soon";
  }
  return "valid";
}
