/**
 * Page loader for /social/r1-instagram-connect (SMM-B1.7-R1).
 * Owner/Admin only. Organization from verified membership.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { listActiveSocialWorkspaces } from "@/features/social-media/server/list-social-workspaces";
import {
  listSocialAccountConnections,
  type ListedSocialConnection,
} from "@/features/social-media/server/list-social-connections";
import type { ListedSocialWorkspace } from "@/features/social-media/server/list-social-workspaces";
import {
  isSocialOAuthFailureStage,
  isSocialOAuthOutcomeCode,
  SOCIAL_OAUTH_FAILURE_STAGE_QUERY,
  SOCIAL_OAUTH_OUTCOME_QUERY,
  type SocialOAuthFailureStage,
  type SocialOAuthOutcomeCode,
} from "@/features/social-media/server/oauth-callback-redirect";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export type R1InstagramConnectPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "feature_disabled" }
  | { kind: "forbidden"; message: string; role: OrganizationRole }
  | {
      kind: "query_error";
      message: string;
      retryable: true;
      organizationId?: string;
    }
  | {
      kind: "success";
      organizationId: string;
      organizationName: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      workspaces: ListedSocialWorkspace[];
      connections: ListedSocialConnection[];
      oauthOutcome: SocialOAuthOutcomeCode | null;
      oauthFailureStage: SocialOAuthFailureStage | null;
      publishingGateOffNotice: true;
    };

export async function loadR1InstagramConnectPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<R1InstagramConnectPageResult> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { kind: "feature_disabled" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "auth_required" };
  }

  const membershipsResult = await listActiveOrganizationMemberships(supabase);
  if (!membershipsResult.ok) {
    return {
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
      retryable: true,
    };
  }
  if (membershipsResult.memberships.length === 0) {
    return { kind: "no_organizations" };
  }

  const orgParam = firstSearchParam(rawSearchParams.org);
  const selection = resolveSelectedOrganization(
    membershipsResult.memberships,
    orgParam,
  );
  const orgIds = membershipsResult.memberships.map((m) => m.organizationId);
  const { data: orgRows } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);
  const namesById = Object.fromEntries(
    (orgRows ?? []).map((row) => [row.id, row.name]),
  );
  const organizationOptions = buildOrganizationOptions(
    membershipsResult.memberships,
    namesById,
  );

  if (selection.requiresSelection || !selection.organizationId) {
    return { kind: "organization_required", organizations: organizationOptions };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: selection.organizationId,
  });
  if (!orgContext.ok) {
    return {
      kind: "org_context_missing",
      message: orgContext.error.message,
    };
  }

  const { role, organizationId } = orgContext.context;
  if (!canManageSocialConnections(role, "active")) {
    return {
      kind: "forbidden",
      message:
        "Only Owner or Admin may connect Instagram for controlled R1 verification.",
      role,
    };
  }

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    organizationId,
    role,
  );

  const [workspacesResult, connectionsResult] = await Promise.all([
    listActiveSocialWorkspaces(supabase, organizationId),
    listSocialAccountConnections(supabase, organizationId),
  ]);
  if (!workspacesResult.ok || !connectionsResult.ok) {
    return {
      kind: "query_error",
      message: "Unable to load Social workspace state. Please try again.",
      retryable: true,
      organizationId,
    };
  }

  const outcomeRaw = firstSearchParam(rawSearchParams[SOCIAL_OAUTH_OUTCOME_QUERY]);
  const oauthOutcome =
    outcomeRaw && isSocialOAuthOutcomeCode(outcomeRaw) ? outcomeRaw : null;
  const stageRaw = firstSearchParam(
    rawSearchParams[SOCIAL_OAUTH_FAILURE_STAGE_QUERY],
  );
  const oauthFailureStage =
    stageRaw && isSocialOAuthFailureStage(stageRaw) ? stageRaw : null;

  return {
    kind: "success",
    organizationId,
    organizationName:
      namesById[organizationId]?.trim() || "Organization",
    organizationOptions,
    role,
    workspaces: workspacesResult.workspaces,
    connections: connectionsResult.connections,
    oauthOutcome,
    oauthFailureStage,
    publishingGateOffNotice: true,
  };
}
