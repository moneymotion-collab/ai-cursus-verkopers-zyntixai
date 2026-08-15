/**
 * Server-controlled Instagram connection initiation (SMM-B1.1-C).
 * Feature gate → auth → org membership → Owner/Admin → intent → auth URL.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import type { SocialConnectResult } from "@/features/social-media/domain/results";
import { validateSocialConnectRequest } from "@/features/social-media/validation/mutation-schemas";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { readInstagramOAuthConfig } from "@/features/social-media/server/instagram-oauth-config";
import { buildInstagramAuthorizationUrl } from "@/features/social-media/server/instagram-authorization-url";
import { generateSocialOAuthState } from "@/features/social-media/server/oauth-state";
import { createSocialConnectionIntent } from "@/features/social-media/server/oauth-intent-repository";
import { SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS } from "@/features/social-media/server/oauth-intent-cookie";

export const SOCIAL_OAUTH_INTENT_TTL_MS =
  SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS * 1000;

export type InitiateInstagramConnectionInput = {
  organizationId: string;
  workspaceId: string;
  provider: string;
};

export type InitiateInstagramConnectionSuccess = {
  ok: true;
  authorizationUrl: string;
  intentId: string;
  connectionId: string;
  rawStateValue: string;
};

export type InitiateInstagramConnectionFailure = Extract<
  SocialConnectResult,
  { ok: false }
>;

export type InitiateInstagramConnectionResult =
  | InitiateInstagramConnectionSuccess
  | InitiateInstagramConnectionFailure;

function mapCreateIntentFailure(
  reason: string,
): InitiateInstagramConnectionFailure {
  switch (reason) {
    case "provider_unsupported":
      return { ok: false, code: "provider_unsupported" };
    case "forbidden":
      return { ok: false, code: "forbidden" };
    case "workspace_not_found":
      return { ok: false, code: "workspace_not_found" };
    case "rate_limited":
      return { ok: false, code: "rate_limited" };
    case "invalid_input":
      return { ok: false, code: "invalid_request" };
    default:
      return { ok: false, code: "internal_error" };
  }
}

export async function initiateInstagramConnection(
  supabase: SupabaseClient<Database>,
  input: InitiateInstagramConnectionInput,
  options?: {
    env?: Record<string, string | undefined>;
    now?: Date;
  },
): Promise<InitiateInstagramConnectionResult> {
  const env = options?.env ?? process.env;
  if (!isSocialInstagramConnectionsFeatureEnabled(env)) {
    return { ok: false, code: "feature_disabled" };
  }

  const parsed = validateSocialConnectRequest({
    workspaceId: input.workspaceId,
    provider: input.provider,
  });
  if (!parsed.success) {
    return { ok: false, code: "invalid_request" };
  }
  if (parsed.data.provider !== "instagram") {
    return { ok: false, code: "provider_unsupported" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: input.organizationId,
  });
  if (!orgContext.ok) {
    if (orgContext.error.code === "AUTH_REQUIRED") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }

  if (
    !canManageSocialConnections(orgContext.context.role, "active")
  ) {
    return { ok: false, code: "forbidden" };
  }

  const config = readInstagramOAuthConfig(env);
  if (!config.ok) {
    return { ok: false, code: "internal_error" };
  }

  const encryptionKey = env.SOCIAL_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!encryptionKey) {
    // Gate may be ON in non-prod tests with injected crypto key later;
    // initiation still requires provider config. Encryption is checked at callback.
    // Missing encryption key at initiate is not fatal for URL build, but
    // production live OAuth must not proceed without it at callback.
  }

  let generated;
  try {
    generated = generateSocialOAuthState();
  } catch {
    return { ok: false, code: "internal_error" };
  }

  const now = options?.now ?? new Date();
  const expiresAt = new Date(now.getTime() + SOCIAL_OAUTH_INTENT_TTL_MS);

  const created = await createSocialConnectionIntent(supabase, {
    organizationId: orgContext.context.organizationId,
    workspaceId: parsed.data.workspaceId,
    provider: "instagram",
    returnPathId: "social_workspace",
    stateFingerprint: generated.fingerprint,
    expiresAt: expiresAt.toISOString(),
  });
  if (!created.ok) {
    return mapCreateIntentFailure(created.reason);
  }

  const authorizationUrl = buildInstagramAuthorizationUrl({
    config: config.config,
    rawState: generated.rawState,
  });

  return {
    ok: true,
    authorizationUrl,
    intentId: created.intentId,
    connectionId: created.connectionId,
    rawStateValue: generated.rawState.value,
  };
}
