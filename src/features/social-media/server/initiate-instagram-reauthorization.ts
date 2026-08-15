/**
 * Owner/Admin Instagram reauthorization initiation (SMM-B1.1-C).
 * Preserves expected external account identity via B1.1-B RPC.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import type { SocialReauthorizeResult } from "@/features/social-media/domain/results";
import { validateSocialReauthorizeRequest } from "@/features/social-media/validation/mutation-schemas";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { readInstagramOAuthConfig } from "@/features/social-media/server/instagram-oauth-config";
import { buildInstagramAuthorizationUrl } from "@/features/social-media/server/instagram-authorization-url";
import { generateSocialOAuthState } from "@/features/social-media/server/oauth-state";
import { createSocialReauthorizationIntent } from "@/features/social-media/server/oauth-intent-repository";
import { SOCIAL_OAUTH_INTENT_TTL_MS } from "@/features/social-media/server/initiate-instagram-connection";

export type InitiateInstagramReauthorizationInput = {
  organizationId: string;
  connectionId: string;
};

export type InitiateInstagramReauthorizationSuccess = {
  ok: true;
  authorizationUrl: string;
  intentId: string;
  connectionId: string;
  expectedExternalAccountId: string;
  rawStateValue: string;
};

export type InitiateInstagramReauthorizationResult =
  | InitiateInstagramReauthorizationSuccess
  | Extract<SocialReauthorizeResult, { ok: false }>;

export async function initiateInstagramReauthorization(
  supabase: SupabaseClient<Database>,
  input: InitiateInstagramReauthorizationInput,
  options?: {
    env?: Record<string, string | undefined>;
    now?: Date;
  },
): Promise<InitiateInstagramReauthorizationResult> {
  const env = options?.env ?? process.env;
  if (!isSocialInstagramConnectionsFeatureEnabled(env)) {
    return { ok: false, code: "feature_disabled" };
  }

  const parsed = validateSocialReauthorizeRequest({
    connectionId: input.connectionId,
  });
  if (!parsed.success) {
    return { ok: false, code: "invalid_request" };
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

  if (!canManageSocialConnections(orgContext.context.role, "active")) {
    return { ok: false, code: "forbidden" };
  }

  const config = readInstagramOAuthConfig(env);
  if (!config.ok) {
    return { ok: false, code: "internal_error" };
  }

  let generated;
  try {
    generated = generateSocialOAuthState();
  } catch {
    return { ok: false, code: "internal_error" };
  }

  const now = options?.now ?? new Date();
  const expiresAt = new Date(now.getTime() + SOCIAL_OAUTH_INTENT_TTL_MS);

  const created = await createSocialReauthorizationIntent(supabase, {
    connectionId: parsed.data.connectionId,
    returnPathId: "social_workspace",
    stateFingerprint: generated.fingerprint,
    expiresAt: expiresAt.toISOString(),
  });
  if (!created.ok) {
    if (created.reason === "not_found") {
      return { ok: false, code: "connection_not_found" };
    }
    if (created.reason === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    if (created.reason === "rate_limited") {
      return { ok: false, code: "rate_limited" };
    }
    if (created.reason === "conflict") {
      return { ok: false, code: "invalid_request" };
    }
    return { ok: false, code: "internal_error" };
  }

  return {
    ok: true,
    authorizationUrl: buildInstagramAuthorizationUrl({
      config: config.config,
      rawState: generated.rawState,
      forceReauth: true,
    }),
    intentId: created.intentId,
    connectionId: created.connectionId,
    expectedExternalAccountId: created.expectedExternalAccountId,
    rawStateValue: generated.rawState.value,
  };
}
