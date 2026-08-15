/**
 * Instagram OAuth callback orchestration (SMM-B1.1-C).
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
 * Never logs code/state/tokens/secrets.
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
import {
  buildDefaultSocialOAuthFailurePath,
  buildSocialOAuthContinuationPath,
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
  clearIntentCookie: boolean;
};

function failure(
  outcome: SocialOAuthOutcomeCode,
  callbackCode: SocialCallbackFailureCode,
  clearIntentCookie = true,
): HandleInstagramOAuthCallbackResult {
  return {
    redirectPath: buildDefaultSocialOAuthFailurePath(outcome),
    outcome,
    callbackCode,
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
    return failure("connection_failed", "provider_mismatch", true);
  }

  const shortLived = await exchangeInstagramAuthorizationCode(
    config.config,
    rawCode,
    { fetchImpl: options?.fetchImpl },
  );
  if (!shortLived.ok) {
    return mapProviderFailure(shortLived.reason);
  }

  const longLived = await exchangeInstagramLongLivedToken(
    config.config,
    shortLived.value.accessToken,
    { fetchImpl: options?.fetchImpl },
  );
  if (!longLived.ok) {
    return mapProviderFailure(longLived.reason);
  }

  const identity = await fetchInstagramProfessionalIdentity(
    config.config,
    longLived.value.accessToken,
    { fetchImpl: options?.fetchImpl },
  );
  if (!identity.ok) {
    if (identity.reason === "unsupported_account") {
      return failure("unsupported_account", "unsupported_account", true);
    }
    return mapProviderFailure(identity.reason);
  }

  if (
    consumed.expectedExternalAccountId &&
    consumed.expectedExternalAccountId !== identity.value.externalAccountId
  ) {
    return failure("connection_failed", "provider_mismatch", true);
  }

  // Prefer identity user_id; token-exchange user_id must agree when present.
  if (
    shortLived.value.userId &&
    shortLived.value.userId !== identity.value.externalAccountId
  ) {
    return failure("connection_failed", "provider_mismatch", true);
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
      return failure("connection_failed", "internal_error", true);
    }
    if (
      stored.reason === "configuration_error" ||
      stored.reason === "malformed_envelope" ||
      stored.reason === "version_unsupported" ||
      stored.reason === "invalid_payload"
    ) {
      return failure("configuration_error", "internal_error", true);
    }
    return failure("connection_failed", "internal_error", true);
  }

  const finalized = await finalizeSocialConnection(supabase, {
    connectionId: consumed.connectionId,
    externalAccountId: identity.value.externalAccountId,
    displayName: identity.value.username,
    professionalAccountType: identity.value.accountType,
    capabilities: [],
  });
  if (!finalized.ok) {
    switch (finalized.reason) {
      case "unsupported_account":
        return failure("unsupported_account", "unsupported_account", true);
      case "duplicate_connection":
        return failure("duplicate_connection", "duplicate_connection", true);
      case "identity_mismatch":
        return failure("connection_failed", "provider_mismatch", true);
      default:
        return failure("connection_failed", "internal_error", true);
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
): HandleInstagramOAuthCallbackResult {
  if (reason === "timeout" || reason === "network_error" || reason === "non_2xx") {
    return failure("provider_unavailable", "provider_exchange_failed", true);
  }
  if (reason === "unsupported_account") {
    return failure("unsupported_account", "unsupported_account", true);
  }
  return failure("connection_failed", "provider_exchange_failed", true);
}
