/**
 * Narrow server-only plaintext credential payload.
 * Safe metadata such as expiry stays outside the encrypted envelope.
 */

import "server-only";

export const SOCIAL_CREDENTIAL_PAYLOAD_VERSION = 1 as const;

export type SocialCredentialPlaintextPayload = {
  payloadVersion: typeof SOCIAL_CREDENTIAL_PAYLOAD_VERSION;
  accessToken: string;
  refreshToken: string | null;
};

export type SocialCredentialPayloadValidationFailure =
  | "invalid_payload"
  | "invalid_access_token"
  | "invalid_refresh_token"
  | "unsupported_payload_version";

export function validateSocialCredentialPlaintextPayload(
  value: unknown,
):
  | { ok: true; payload: SocialCredentialPlaintextPayload }
  | { ok: false; reason: SocialCredentialPayloadValidationFailure } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "invalid_payload" };
  }
  const record = value as Record<string, unknown>;
  if (record.payloadVersion !== SOCIAL_CREDENTIAL_PAYLOAD_VERSION) {
    return { ok: false, reason: "unsupported_payload_version" };
  }
  if (typeof record.accessToken !== "string" || record.accessToken.length === 0) {
    return { ok: false, reason: "invalid_access_token" };
  }
  if (record.refreshToken !== null && typeof record.refreshToken !== "string") {
    return { ok: false, reason: "invalid_refresh_token" };
  }
  if (typeof record.refreshToken === "string" && record.refreshToken.length === 0) {
    return { ok: false, reason: "invalid_refresh_token" };
  }
  return {
    ok: true,
    payload: {
      payloadVersion: SOCIAL_CREDENTIAL_PAYLOAD_VERSION,
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
    },
  };
}
