/**
 * Page loader for /social/lifecycle (SMM-B1.9).
 * Owner/Admin only. Never enables publishing. Never calls Meta.
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
import {
  listSocialLifecycleInventory,
  type ListedLifecycleConnection,
  type ListedSocialPublication,
} from "@/features/social-media/server/list-social-lifecycle-inventory";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export type B19LifecyclePageResult =
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
      publishingEnabled: boolean;
      connections: ListedLifecycleConnection[];
      publications: ListedSocialPublication[];
      healthyConnectedCount: number;
      pendingShellCount: number;
      queuedPublicationCount: number;
      succeededPublicationCount: number;
    };

export async function loadB19LifecyclePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<B19LifecyclePageResult> {
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

  const orgParam =
    firstSearchParam(rawSearchParams.org) ??
    firstSearchParam(rawSearchParams.organizationId);
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
      message: "Only Owner or Admin may manage Social publishing lifecycle.",
      role,
    };
  }

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    organizationId,
    role,
  );

  const publishingEnabled = isSocialPublishingFeatureEnabled();
  const inventory = await listSocialLifecycleInventory(
    supabase,
    organizationId,
    new Date().toISOString(),
    publishingEnabled,
  );
  if (!inventory.ok) {
    return {
      kind: "query_error",
      message: "Unable to load Social lifecycle inventory. Please try again.",
      retryable: true,
      organizationId,
    };
  }

  const organizationName =
    organizationOptions.find((o) => o.organizationId === organizationId)
      ?.displayName ?? "Organization";

  return {
    kind: "success",
    organizationId,
    organizationName,
    organizationOptions,
    role,
    publishingEnabled,
    connections: inventory.connections,
    publications: inventory.publications,
    healthyConnectedCount: inventory.connections.filter(
      (c) => c.operationalHealth === "healthy",
    ).length,
    pendingShellCount: inventory.connections.filter(
      (c) => c.operationalHealth === "pending_shell",
    ).length,
    queuedPublicationCount: inventory.publications.filter(
      (p) => p.status === "queued" || p.status === "pending",
    ).length,
    succeededPublicationCount: inventory.publications.filter(
      (p) => p.status === "succeeded",
    ).length,
  };
}
