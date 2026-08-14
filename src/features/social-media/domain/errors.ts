/**
 * Provider-neutral error kinds for connection work (SMM-B1.0 / preflight).
 * Raw provider bodies remain internal diagnostic input, never public results.
 */

export const SOCIAL_PROVIDER_ERROR_KINDS = [
  "authorization_failed",
  "credential_expired",
  "permission_missing",
  "provider_rate_limited",
  "provider_unavailable",
  "validation_failed",
  "unsupported_account",
  "unsupported_capability",
  "external_not_found",
  "internal_error",
] as const;

export type SocialProviderErrorKind =
  (typeof SOCIAL_PROVIDER_ERROR_KINDS)[number];

export type SafeSocialProviderError = {
  kind: SocialProviderErrorKind;
  message: string;
};

export const SOCIAL_PUBLIC_ERROR_FORBIDDEN_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "authorizationCode",
  "clientSecret",
  "rawProviderPayload",
  "rawProviderBody",
  "encryptionKey",
  "ciphertext",
  "iv",
  "authTag",
  "stack",
  "stackTrace",
] as const;

export type SocialPublicErrorForbiddenKey =
  (typeof SOCIAL_PUBLIC_ERROR_FORBIDDEN_KEYS)[number];

export function isSocialProviderErrorKind(
  value: string,
): value is SocialProviderErrorKind {
  return (SOCIAL_PROVIDER_ERROR_KINDS as readonly string[]).includes(value);
}

export function createSafeSocialProviderError(
  kind: SocialProviderErrorKind,
  message: string,
): SafeSocialProviderError {
  return { kind, message };
}

export function socialPublicErrorHasForbiddenKey(
  value: Record<string, unknown>,
): boolean {
  return SOCIAL_PUBLIC_ERROR_FORBIDDEN_KEYS.some((key) => key in value);
}
