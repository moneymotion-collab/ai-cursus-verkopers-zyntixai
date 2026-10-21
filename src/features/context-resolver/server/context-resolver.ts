import "server-only";

import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import { resolveEffectiveContext } from "@/features/context-resolver/domain/context-resolution";
import type { ContextResolutionMode, EffectiveContext } from "@/features/context-resolver/domain/types";
import {
  contextResolverFail,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadResolverCatalogInput, type ControlPlaneReaders } from "./resolver-input-loader";
import {
  loadPrimaryActivityId,
  loadTenantResolutionContext,
  type AuthenticatedResolverClient,
} from "./tenant-context-loader";

export type ResolveBusinessActivityContextInput = {
  organizationId: string;
  activityId: string;
  mode: ContextResolutionMode;
  locale?: string | null;
};

export type ResolvePrimaryBusinessActivityContextInput = {
  organizationId: string;
  mode: ContextResolutionMode;
  locale?: string | null;
};

export type ContextResolverServerRuntime = {
  getAuthenticatedClient: () => Promise<AuthenticatedResolverClient>;
  getControlPlaneReaders: () => ControlPlaneReaders;
};

function defaultRuntime(): ContextResolverServerRuntime {
  return {
    getAuthenticatedClient: () => createSupabaseServerClient(),
    getControlPlaneReaders: () => createControlPlaneReaders(),
  };
}

/**
 * Tenant-authorized Effective Context resolution.
 * Membership is proven through authenticated RLS before any Control Plane read.
 * relevantCapabilities are Context relevance, not entitlement.
 */
export async function resolveBusinessActivityContext(
  input: ResolveBusinessActivityContextInput,
  runtime: ContextResolverServerRuntime = defaultRuntime(),
): Promise<ContextResolverResult<EffectiveContext>> {
  if (!input.organizationId || !input.activityId) {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "organizationId and activityId are required",
    );
  }
  const client = await runtime.getAuthenticatedClient();
  const tenant = await loadTenantResolutionContext({
    client,
    organizationId: input.organizationId,
    activityId: input.activityId,
  });
  if (!tenant.ok) {
    return tenant;
  }

  const readers = runtime.getControlPlaneReaders();
  const requestedLocale = input.locale ?? tenant.value.locale ?? null;
  const catalog = await loadResolverCatalogInput({
    readers,
    organizationId: tenant.value.organizationId,
    activity: tenant.value.activity,
    leafVersionId: tenant.value.contextPackVersionId,
    requestedLocale,
    mode: input.mode,
  });
  if (!catalog.ok) {
    return catalog;
  }
  return resolveEffectiveContext(catalog.value);
}

export async function resolvePrimaryBusinessActivityContext(
  input: ResolvePrimaryBusinessActivityContextInput,
  runtime: ContextResolverServerRuntime = defaultRuntime(),
): Promise<ContextResolverResult<EffectiveContext>> {
  if (!input.organizationId) {
    return contextResolverFail("ORG_NOT_FOUND", "organizationId is required");
  }
  const client = await runtime.getAuthenticatedClient();
  const primaryId = await loadPrimaryActivityId({
    client,
    organizationId: input.organizationId,
  });
  if (!primaryId.ok) {
    return primaryId;
  }
  return resolveBusinessActivityContext(
    {
      organizationId: input.organizationId,
      activityId: primaryId.value,
      mode: input.mode,
      locale: input.locale,
    },
    { ...runtime, getAuthenticatedClient: async () => client },
  );
}
