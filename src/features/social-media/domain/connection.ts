import type { InstagramProfessionalAccountType } from "./account-type";
import type { SocialCapabilitySnapshot } from "./capabilities";
import {
  resolveSocialTokenExpiryWarningState,
  type SocialCredentialMetadata,
  type SocialTokenExpiryWarningState,
} from "./credentials";
import type { SocialConnectionHealthOverlay } from "./health";
import type { SocialLoginProduct } from "./login-product";
import type { ImplementedSocialProvider } from "./provider";
import type { SocialConnectionStatus } from "./status";
import type {
  SocialConnectionId,
  SocialExternalAccountId,
  SocialOrganizationId,
  SocialWorkspaceId,
} from "./types";

/**
 * Durable Social Account Connection domain object.
 * Structurally cannot hold plaintext tokens, codes, app secrets, or keys.
 */
export type SocialAccountConnection = {
  id: SocialConnectionId;
  organizationId: SocialOrganizationId;
  workspaceId: SocialWorkspaceId;
  provider: ImplementedSocialProvider;
  loginProduct: SocialLoginProduct;
  externalAccountId: SocialExternalAccountId;
  displayName: string | null;
  professionalAccountType: InstagramProfessionalAccountType | null;
  status: SocialConnectionStatus;
  health: SocialConnectionHealthOverlay;
  capabilitySnapshot: SocialCapabilitySnapshot | null;
  credential: SocialCredentialMetadata | null;
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reauthorizationRequiredAt: string | null;
};

/**
 * Client-safe read model for future UI (B1.1-E).
 * Must not expose ciphertext, tokens, OAuth state hashes, or key versions.
 */
export type SocialConnectionClientReadModel = {
  id: SocialConnectionId;
  provider: ImplementedSocialProvider;
  displayName: string | null;
  professionalAccountType: InstagramProfessionalAccountType | null;
  status: SocialConnectionStatus;
  health: SocialConnectionHealthOverlay;
  capabilities: readonly string[];
  tokenExpiryWarning: SocialTokenExpiryWarningState;
  needsReauthorization: boolean;
  connectedAt: string | null;
};

export const SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS = [
  "accessToken",
  "refreshToken",
  "authorizationCode",
  "clientSecret",
  "encryptionKey",
  "ciphertext",
  "iv",
  "authTag",
  "oauthState",
  "oauthStateHash",
  "rawOAuthState",
  "keyVersion",
  "credentialCiphertext",
] as const;

export type SocialConnectionClientForbiddenKey =
  (typeof SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS)[number];

type AssertTrue<T extends true> = T;

export type SocialConnectionClientReadModelHasNoForbiddenKeys = AssertTrue<
  Extract<
    keyof SocialConnectionClientReadModel,
    SocialConnectionClientForbiddenKey
  > extends never
    ? true
    : false
>;

export type SocialAccountConnectionHasNoForbiddenKeys = AssertTrue<
  Extract<
    keyof SocialAccountConnection,
    SocialConnectionClientForbiddenKey
  > extends never
    ? true
    : false
>;

export function socialConnectionClientReadModelLooksSafe(
  value: Record<string, unknown>,
): boolean {
  return !SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS.some((key) => key in value);
}

export function toSocialConnectionClientReadModel(
  connection: SocialAccountConnection,
  nowIso: string,
): SocialConnectionClientReadModel {
  return {
    id: connection.id,
    provider: connection.provider,
    displayName: connection.displayName,
    professionalAccountType: connection.professionalAccountType,
    status: connection.status,
    health: connection.health,
    capabilities: connection.capabilitySnapshot?.capabilities ?? [],
    tokenExpiryWarning: resolveSocialTokenExpiryWarningState({
      tokenExpiresAt: connection.credential?.tokenExpiresAt ?? null,
      nowIso,
    }),
    needsReauthorization:
      connection.status === "reauthorization_required" ||
      connection.credential?.reauthorizationRequired === true,
    connectedAt: connection.connectedAt,
  };
}
