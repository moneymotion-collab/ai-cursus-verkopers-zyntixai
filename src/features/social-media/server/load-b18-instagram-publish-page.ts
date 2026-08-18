/**
 * Page loader for /social/b18-instagram-publish (SMM-B1.8).
 * Owner/Admin only. Publishing gate flag is read-only for UI; never enabled here.
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
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { listActiveSocialWorkspaces } from "@/features/social-media/server/list-social-workspaces";
import {
  listSocialAccountConnections,
  type ListedSocialConnection,
} from "@/features/social-media/server/list-social-connections";
import type { ListedSocialWorkspace } from "@/features/social-media/server/list-social-workspaces";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export type B18InstagramPublishPageResult =
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
      publishingEnabled: boolean;
      /** Queued publication ready for one controlled execute (opaque id only). */
      queuedPublicationId: string | null;
    };

export async function loadB18InstagramPublishPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<B18InstagramPublishPageResult> {
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
        "Only Owner or Admin may run controlled B1.8 Instagram IMAGE publish verification.",
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

  const requestedPublicationId = firstSearchParam(
    rawSearchParams.publication,
  )?.trim();
  let queuedPublicationId: string | null = null;

  // social_publications is not yet in generated Database types — session client cast.
  const publications = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => unknown;
      };
    };
  };

  function asPublicationId(data: unknown): string | null {
    if (!data || typeof data !== "object") {
      return null;
    }
    const id = (data as { id?: unknown }).id;
    return typeof id === "string" && id.length > 0 ? id : null;
  }

  if (requestedPublicationId) {
    const requestedQuery = publications
      .from("social_publications")
      .select("id, status") as {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => PromiseLike<{ data: unknown }>;
        };
      };
    };
    const { data: requested } = await requestedQuery
      .eq("organization_id", organizationId)
      .eq("id", requestedPublicationId)
      .maybeSingle();
    if (
      asPublicationId(requested) &&
      requested &&
      typeof requested === "object" &&
      (requested as { status?: unknown }).status === "queued"
    ) {
      queuedPublicationId = asPublicationId(requested);
    }
  }

  if (!queuedPublicationId) {
    const latestQuery = publications.from("social_publications").select("id") as {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            order: (
              column: string,
              options: { ascending: boolean },
            ) => {
              limit: (count: number) => {
                maybeSingle: () => PromiseLike<{ data: unknown }>;
              };
            };
          };
        };
      };
    };
    const { data: latestQueued } = await latestQuery
      .eq("organization_id", organizationId)
      .eq("status", "queued")
      .eq("provider", "instagram")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    queuedPublicationId = asPublicationId(latestQueued);
  }

  return {
    kind: "success",
    organizationId,
    organizationName: namesById[organizationId]?.trim() || "Organization",
    organizationOptions,
    role,
    workspaces: workspacesResult.workspaces,
    connections: connectionsResult.connections,
    publishingEnabled: isSocialPublishingFeatureEnabled(),
    queuedPublicationId,
  };
}
