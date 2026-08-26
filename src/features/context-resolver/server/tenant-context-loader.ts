import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { BusinessActivity } from "@/features/org-context/domain/types";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import { mapMembershipError, mapOrgContextError } from "./map-errors";

export type AuthenticatedResolverClient = SupabaseClient<Database>;

export type TenantResolutionLoad = {
  organizationId: string;
  locale: string | null;
  activity: BusinessActivity;
  contextPackVersionId: string;
};

export async function loadTenantResolutionContext(input: {
  client: AuthenticatedResolverClient;
  organizationId: string;
  activityId: string;
}): Promise<ContextResolverResult<TenantResolutionLoad>> {
  const membership = await resolveOrganizationContext({
    supabase: input.client,
    organizationId: input.organizationId,
  });
  if (!membership.ok) {
    return mapMembershipError(membership.error);
  }

  const repository = new OrganizationContextRepository(
    input.client as unknown as OrgContextQueryClient,
  );
  const locale = await repository.getOrganizationLocale(membership.context.organizationId);
  if (!locale.ok) {
    return mapOrgContextError(locale.error);
  }
  const activity = await repository.getBusinessActivity(
    membership.context.organizationId,
    input.activityId,
  );
  if (!activity.ok) {
    return mapOrgContextError(activity.error);
  }
  const pin = await repository.getPinnedContextVersion(
    membership.context.organizationId,
    input.activityId,
  );
  if (!pin.ok) {
    return mapOrgContextError(pin.error);
  }
  if (!pin.value) {
    return contextResolverFail(
      "CONTEXT_UNASSIGNED",
      "Business Activity has no active Context assignment",
      { organizationId: input.organizationId, activityId: input.activityId },
    );
  }
  return contextResolverOk({
    organizationId: membership.context.organizationId,
    locale: locale.value,
    activity: activity.value,
    contextPackVersionId: pin.value.contextPackVersionId,
  });
}

export async function loadPrimaryActivityId(input: {
  client: AuthenticatedResolverClient;
  organizationId: string;
}): Promise<ContextResolverResult<string>> {
  const membership = await resolveOrganizationContext({
    supabase: input.client,
    organizationId: input.organizationId,
  });
  if (!membership.ok) {
    return mapMembershipError(membership.error);
  }
  const repository = new OrganizationContextRepository(
    input.client as unknown as OrgContextQueryClient,
  );
  const primary = await repository.getPrimaryBusinessActivity(
    membership.context.organizationId,
  );
  if (!primary.ok) {
    return mapOrgContextError(primary.error);
  }
  if (!primary.value) {
    return contextResolverFail(
      "NO_PRIMARY_ACTIVITY",
      "Organization has no active primary Business Activity",
      { organizationId: membership.context.organizationId },
    );
  }
  return contextResolverOk(primary.value.activityId);
}
