/**
 * Instagram OAuth callback orchestration (SMM-B1.1-C / R1 diagnostics).
 *
 * Order:
 * 1) feature gate
 * 2) parse safe callback params
 * 3) authenticated session
 * 4) consume single-use intent (before provider exchange)
 * 5) code → short-lived → long-lived token
 * 6) professional identity verification
 * 7) AES-256-GCM encrypt + private upsert
 * 8) finalize connection
 *
 * Never logs code/state/tokens/secrets/provider bodies.
 * Opaque failure stages may be returned in allowlisted redirect query only.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { readInstagramOAuthConfig } from "@/features/social-media/server/instagram-oauth-config";
import { fingerprintSocialOAuthRawState } from "@/features/social-media/server/oauth-state";
import { consumeSocialOAuthIntent } from "@/features/social-media/server/oauth-intent-repository";
import { finalizeSocialConnection } from "@/features/social-media/server/oauth-intent-repository";
import {
  exchangeInstagramAuthorizationCode,
  exchangeInstagramLongLivedToken,
  fetchInstagramProfessionalIdentity,
  type InstagramProviderFetch,
} from "@/features/social-media/server/instagram-provider-client";
import { upsertEncryptedSocialProviderCredential } from "@/features/social-media/server/credential-repository";
import { deriveInstagramCapabilitiesFromGrantedPermissions } from "@/features/social-media/server/instagram-publishing/permissions";
import {
  buildDefaultSocialOAuthFailurePath,
  buildSocialOAuthContinuationPath,
  type SocialOAuthFailureStage,
  type SocialOAuthOutcomeCode,
} from "@/features/social-media/server/oauth-callback-redirect";
import { readSocialCredentialEncryptionKey } from "@/features/social-media/server/credential-key";
import type { SocialCallbackFailureCode } from "@/features/social-media/domain/results";

export type InstagramOAuthCallbackQuery = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  error_reason?: string | null;
  error_description?: string | null;
};

export type HandleInstagramOAuthCallbackResult = {
  redirectPath: string;
  outcome: SocialOAuthOutcomeCode;
  callbackCode?: SocialCallbackFailureCode | "connection_established";
  failureStage?: SocialOAuthFailureStage;
  clearIntentCookie: boolean;
};

function failure(
  outcome: SocialOAuthOutcomeCode,
  callbackCode: SocialCallbackFailureCode,
  clearIntentCookie = true,
  failureStage?: SocialOAuthFailureStage,
): HandleInstagramOAuthCallbackResult {
  return {
    redirectPath: buildDefaultSocialOAuthFailurePath(outcome, failureStage),
    outcome,
    callbackCode,
    failureStage,
    clearIntentCookie,
  };
}

export async function handleInstagramOAuthCallback(
  supabase: SupabaseClient<Database>,
  input: {
    query: InstagramOAuthCallbackQuery;
    intentIdFromCookie: string | null;
  },
  options?: {
    env?: Record<string, string | undefined>;
    fetchImpl?: InstagramProviderFetch;
    now?: Date;
  },
): Promise<HandleInstagramOAuthCallbackResult> {
  const env = options?.env ?? process.env;

  if (!isSocialInstagramConnectionsFeatureEnabled(env)) {
    return failure("feature_disabled", "feature_disabled", true);
  }

  if (input.query.error || input.query.error_reason) {
    return failure("authorization_denied", "oauth_denied", true);
  }

  const rawState =
    typeof input.query.state === "string" ? input.query.state.trim() : "";
  const rawCode =
    typeof input.query.code === "string" ? input.query.code.trim() : "";

  if (!rawState) {
    return failure("authorization_invalid", "invalid_state", true);
  }
  if (!rawCode) {
    return failure("authorization_invalid", "invalid_state", true);
  }
  if (!input.intentIdFromCookie) {
    return failure("authorization_invalid", "invalid_state", true);
  }

  const fingerprint = fingerprintSocialOAuthRawState(rawState);
  if (!fingerprint) {
    return failure("authorization_invalid", "invalid_state", true);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return failure("wrong_actor", "wrong_actor", true);
  }

  const config = readInstagramOAuthConfig(env);
  if (!config.ok) {
    return failure("configuration_error", "internal_error", true);
  }

  const keyCheck = readSocialCredentialEncryptionKey(env);
  if (!keyCheck.ok) {
    return failure("configuration_error", "internal_error", true);
  }

  const consumed = await consumeSocialOAuthIntent(supabase, {
    intentId: input.intentIdFromCookie,
    stateFingerprint: fingerprint,
  });
  if (!consumed.ok) {
    switch (consumed.reason) {
      case "expired_state":
        return failure("authorization_expired", "expired_state", true);
      case "replayed_state":
        return failure("authorization_replayed", "replayed_state", true);
      case "wrong_actor":
        return failure("wrong_actor", "wrong_actor", true);
      case "rate_limited":
        return failure("rate_limited", "internal_error", true);
      case "invalid_state":
      default:
        return failure("authorization_invalid", "invalid_state", true);
    }
  }

  if (consumed.provider !== "instagram") {
    return failure(
      "connection_failed",
      "provider_mismatch",
      true,
      "authorization_code_exchange",
    );
  }

  const shortLived = await exchangeInstagramAuthorizationCode(
    config.config,
    rawCode,
    { fetchImpl: options?.fetchImpl },
  );
  if (!shortLived.ok) {
    return mapProviderFailure(
      shortLived.reason,
      "authorization_code_exchange",
    );
  }

  const longLived = await exchangeInstagramLongLivedToken(
    config.config,
    shortLived.value.accessToken,
    { fetchImpl: options?.fetchImpl },
  );
  if (!longLived.ok) {
    return mapProviderFailure(
      longLived.reason,
      "long_lived_token_exchange",
    );
  }

  const identity = await fetchInstagramProfessionalIdentity(
    config.config,
    longLived.value.accessToken,
    { fetchImpl: options?.fetchImpl },
  );
  if (!identity.ok) {
    return mapProfessionalIdentityFailure(identity.reason);
  }

  // Reconnect binding only: expected professional IG_ID must match /me.user_id.
  // Do not compare token-exchange user_id to /me.id — Meta documents token
  // user_id as an Instagram-scoped ID and /me.id as an app-scoped ID, and does
  // not require them to be equal. Account identity is established by the
  // authenticated /me response after a successful token exchange.
  if (
    consumed.expectedExternalAccountId &&
    consumed.expectedExternalAccountId !== identity.value.externalAccountId
  ) {
    return failure(
      "connection_failed",
      "provider_mismatch",
      true,
      "professional_identity_fetch",
    );
  }

  const now = options?.now ?? new Date();
  const tokenExpiresAt =
    longLived.value.expiresInSeconds != null
      ? new Date(
          now.getTime() + longLived.value.expiresInSeconds * 1000,
        ).toISOString()
      : null;

  const stored = await upsertEncryptedSocialProviderCredential(supabase, {
    connectionId: consumed.connectionId,
    organizationId: consumed.organizationId,
    expectedCredentialVersion: 0,
    payload: {
      payloadVersion: 1,
      accessToken: longLived.value.accessToken,
      refreshToken: null,
    },
    tokenExpiresAt,
    env,
  });
  if (!stored.ok) {
    if (stored.reason === "stale_version") {
      return failure(
        "connection_failed",
        "internal_error",
        true,
        "credential_encrypt_or_upsert",
      );
    }
    if (
      stored.reason === "configuration_error" ||
      stored.reason === "malformed_envelope" ||
      stored.reason === "version_unsupported" ||
      stored.reason === "invalid_payload"
    ) {
      return failure(
        "configuration_error",
        "internal_error",
        true,
        "credential_encrypt_or_upsert",
      );
    }
    return failure(
      "connection_failed",
      "internal_error",
      true,
      "credential_encrypt_or_upsert",
    );
  }

  const finalized = await finalizeSocialConnection(supabase, {
    connectionId: consumed.connectionId,
    externalAccountId: identity.value.externalAccountId,
    displayName: identity.value.username,
    professionalAccountType: identity.value.accountType,
    capabilities: deriveInstagramCapabilitiesFromGrantedPermissions(
      shortLived.value.permissions,
    ),
  });
  if (!finalized.ok) {
    switch (finalized.reason) {
      case "unsupported_account":
        return failure(
          "unsupported_account",
          "unsupported_account",
          true,
          "connection_finalize",
        );
      case "duplicate_connection":
        return failure(
          "duplicate_connection",
          "duplicate_connection",
          true,
          "connection_finalize",
        );
      case "identity_mismatch":
        return failure(
          "connection_failed",
          "provider_mismatch",
          true,
          "connection_finalize",
        );
      default:
        return failure(
          "connection_failed",
          "internal_error",
          true,
          "connection_finalize",
        );
    }
  }

  return {
    redirectPath: buildSocialOAuthContinuationPath(
      consumed.returnPathId,
      "connected",
    ),
    outcome: "connected",
    callbackCode: "connection_established",
    clearIntentCookie: true,
  };
}

function mapProviderFailure(
  reason: string,
  failureStage: SocialOAuthFailureStage,
): HandleInstagramOAuthCallbackResult {
  if (reason === "timeout" || reason === "network_error" || reason === "non_2xx") {
    return failure(
      "provider_unavailable",
      "provider_exchange_failed",
      true,
      failureStage,
    );
  }
  if (reason === "unsupported_account") {
    return failure(
      "unsupported_account",
      "unsupported_account",
      true,
      failureStage,
    );
  }
  return failure(
    "connection_failed",
    "provider_exchange_failed",
    true,
    failureStage,
  );
}

function mapProfessionalIdentityFailure(
  reason: string,
): HandleInstagramOAuthCallbackResult {
  switch (reason) {
    case "timeout":
    case "network_error":
    case "non_2xx":
      return failure(
        "provider_unavailable",
        "provider_exchange_failed",
        true,
        "professional_identity_http",
      );
    case "invalid_json":
      return failure(
        "connection_failed",
        "provider_exchange_failed",
        true,
        "professional_identity_invalid_json",
      );
    case "missing_id":
      return failure(
        "connection_failed",
        "provider_exchange_failed",
        true,
        "professional_identity_missing_id",
      );
    case "missing_user_id":
      return failure(
        "connection_failed",
        "provider_exchange_failed",
        true,
        "professional_identity_missing_user_id",
      );
    case "missing_username":
      return failure(
        "connection_failed",
        "provider_exchange_failed",
        true,
        "professional_identity_missing_username",
      );
    case "unsupported_account":
      return failure(
        "unsupported_account",
        "unsupported_account",
        true,
        "professional_identity_account_type",
      );
    default:
      return failure(
        "connection_failed",
        "provider_exchange_failed",
        true,
        "professional_identity_fetch",
      );
  }
}
