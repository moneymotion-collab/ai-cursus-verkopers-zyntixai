"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSiteOrigin } from "@/lib/env/site-origin";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { listActiveSocialWorkspaces } from "@/features/social-media/server/list-social-workspaces";
import { createSocialWorkspace } from "@/features/social-media/server/workspace-repository";
import { initiateInstagramConnection } from "@/features/social-media/server/initiate-instagram-connection";
import {
  assertClosedBetaConnectAllowed,
  mapClosedBetaConnectFailure,
} from "@/features/social-media/server/social-closed-beta-enrollment";
import { R1_INSTAGRAM_CONNECT_WORKSPACE_DISPLAY_NAME } from "@/features/social-media/domain/r1-connect-navigation";
import type { SocialConnectResult } from "@/features/social-media/domain/results";
import {
  buildSocialOAuthIntentCookieOptions,
  shouldUseSecureSocialOAuthIntentCookie,
  SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
  SOCIAL_OAUTH_INTENT_COOKIE_NAME,
} from "@/features/social-media/server/oauth-intent-cookie";

/**
 * Owner/Admin R1 helper: ensure a Social Brand+Workspace via RPC, then start
 * Instagram OAuth through the existing initiation path. Publishing is never enabled.
 */
export async function startR1InstagramConnectAction(input: {
  organizationId: string;
}): Promise<SocialConnectResult> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }

  const organizationId = input.organizationId?.trim();
  if (!organizationId) {
    return { ok: false, code: "invalid_request" };
  }

  const supabase = await createSupabaseServerClient();
  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId,
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

  const connectEntitlement = await assertClosedBetaConnectAllowed(
    supabase,
    orgContext.context.organizationId,
  );
  if (!connectEntitlement.ok) {
    return mapClosedBetaConnectFailure(connectEntitlement);
  }

  const listed = await listActiveSocialWorkspaces(
    supabase,
    orgContext.context.organizationId,
  );
  if (!listed.ok) {
    return { ok: false, code: "internal_error" };
  }

  let workspaceId = listed.workspaces[0]?.id ?? null;
  if (!workspaceId) {
    const created = await createSocialWorkspace(supabase, {
      organizationId: orgContext.context.organizationId,
      displayName: R1_INSTAGRAM_CONNECT_WORKSPACE_DISPLAY_NAME,
    });
    if (!created.ok) {
      if (created.reason === "forbidden") {
        return { ok: false, code: "forbidden" };
      }
      if (created.reason === "invalid_input") {
        return { ok: false, code: "invalid_request" };
      }
      return { ok: false, code: "internal_error" };
    }
    workspaceId = created.workspaceId;
  }

  const result = await initiateInstagramConnection(supabase, {
    organizationId: orgContext.context.organizationId,
    workspaceId,
    provider: "instagram",
  });
  if (!result.ok) {
    return result;
  }

  const cookieStore = await cookies();
  const secure = shouldUseSecureSocialOAuthIntentCookie(resolveSiteOrigin());
  cookieStore.set(
    SOCIAL_OAUTH_INTENT_COOKIE_NAME,
    result.intentId,
    buildSocialOAuthIntentCookieOptions(
      SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
      secure,
    ),
  );

  return {
    ok: true,
    code: "authorization_redirect",
    authorizationUrl: result.authorizationUrl,
  };
}
