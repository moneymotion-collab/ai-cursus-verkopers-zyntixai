/**
 * Pure Effective Context resolver.
 * No I/O, auth, or latest-version lookup. Relevance is not entitlement.
 */

import type { ContextReadinessStatus } from "@/features/control-plane/domain/types";
import { isExactTaxContextCompatible } from "@/features/org-context/domain/validation";
import {
  assertCapabilityDependencyCoherence,
  mergeContextCapabilityMappings,
} from "@/features/context-resolver/domain/capability-resolution";
import { buildPinnedContextChain, taxonomyPathNodeId } from "@/features/context-resolver/domain/context-chain";
import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import { resolveTerminology } from "@/features/context-resolver/domain/terminology-resolution";
import type {
  ContextResolutionInput,
  ContextResolutionMode,
  EffectiveContext,
} from "@/features/context-resolver/domain/types";

const MODE_ALLOWED_READINESS: Readonly<
  Record<ContextResolutionMode, ReadonlySet<ContextReadinessStatus>>
> = {
  internal_qa: new Set(["context_ready", "beta_supported", "production_verified"]),
  beta: new Set(["beta_supported", "production_verified"]),
  production: new Set(["production_verified"]),
};

function assertResolutionMode(
  mode: ContextResolutionMode,
  readinessStatus: ContextReadinessStatus | undefined,
): ContextResolverResult<ContextReadinessStatus> {
  if (!readinessStatus) {
    return contextResolverFail(
      "CONTEXT_NOT_RESOLVABLE_FOR_MODE",
      "Context pack readiness is missing",
      { mode },
    );
  }
  const allowed = MODE_ALLOWED_READINESS[mode];
  if (!allowed) {
    return contextResolverFail(
      "CONTEXT_NOT_RESOLVABLE_FOR_MODE",
      "Unsupported Context resolution mode",
      { mode },
    );
  }
  if (!allowed.has(readinessStatus)) {
    return contextResolverFail(
      "CONTEXT_NOT_RESOLVABLE_FOR_MODE",
      "Context pack readiness is not resolvable for this mode",
      { mode, readinessStatus },
    );
  }
  return contextResolverOk(readinessStatus);
}

export function resolveEffectiveContext(
  input: ContextResolutionInput,
): ContextResolverResult<EffectiveContext> {
  if (input.activity.status !== "active") {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Only an active Business Activity can be resolved",
      { status: input.activity.status },
    );
  }
  if (!input.activity.classification) {
    return contextResolverFail(
      "ACTIVITY_UNCLASSIFIED",
      "Unclassified Business Activity cannot be resolved",
    );
  }

  const readinessByVersion = new Map<string, ContextReadinessStatus>();
  for (const row of input.contextReadiness) {
    if (readinessByVersion.has(row.versionId)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate Context readiness for one version",
        { versionId: row.versionId },
      );
    }
    readinessByVersion.set(row.versionId, row.readinessStatus);
  }

  const chain = buildPinnedContextChain({
    leafVersionId: input.leafVersionId,
    packs: input.packs,
    versions: input.versions,
    taxonomyPath: input.taxonomyPath,
  });
  if (!chain.ok) {
    return chain;
  }
  const leaf = chain.value[chain.value.length - 1];
  if (!leaf) {
    return contextResolverFail(
      "CONTEXT_VERSION_NOT_FOUND",
      "Pinned Context chain is empty",
    );
  }

  const leafReadiness = assertResolutionMode(
    input.mode,
    readinessByVersion.get(leaf.version.id),
  );
  if (!leafReadiness.ok) {
    return leafReadiness;
  }

  if (
    !isExactTaxContextCompatible({
      classification: input.activity.classification,
      packKind: leaf.pack.packKind,
      packTargetId: leaf.pack.target.id,
    })
  ) {
    return contextResolverFail(
      "CONTEXT_TAXONOMY_MISMATCH",
      "Business Activity classification does not match the pinned leaf Context Pack",
      {
        classificationKind: input.activity.classification.kind,
        packKind: leaf.pack.packKind,
      },
    );
  }

  const pathNodeId = taxonomyPathNodeId(
    input.taxonomyPath,
    input.activity.classification.kind,
  );
  if (pathNodeId !== input.activity.classification.targetId) {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Supplied TAX path does not match Activity classification",
    );
  }

  const capabilities = mergeContextCapabilityMappings({
    chain: chain.value,
    mappings: input.mappings,
    capabilities: input.capabilities,
    capabilityReadiness: input.capabilityReadiness,
  });
  if (!capabilities.ok) {
    return capabilities;
  }
  const coherent = assertCapabilityDependencyCoherence({
    capabilities: capabilities.value,
    dependencies: input.dependencies,
  });
  if (!coherent.ok) {
    return coherent;
  }

  const terminology = resolveTerminology({
    chain: chain.value,
    terminology: input.terminology,
    requestedLocale: input.requestedLocale,
    defaultLocale: leaf.pack.defaultLocale,
  });
  if (!terminology.ok) {
    return terminology;
  }

  return contextResolverOk({
    organization: { id: input.organization.id },
    businessActivity: {
      id: input.activity.id,
      activityKey: input.activity.activityKey,
      displayName: input.activity.displayName,
      status: input.activity.status,
      isPrimary: input.activity.isPrimary,
      classification: input.activity.classification,
    },
    taxonomy: { canonicalPath: input.taxonomyPath },
    context: {
      packKey: leaf.pack.packKey,
      versionNumber: leaf.version.versionNumber,
      publicationStatus: leaf.version.publicationStatus,
      readinessStatus: leafReadiness.value,
      ancestry: chain.value.map((entry) => ({
        packKey: entry.pack.packKey,
        versionNumber: entry.version.versionNumber,
        packKind: entry.pack.packKind,
        taxonomyTargetKey: entry.pack.targetKey,
      })),
      resolutionMode: input.mode,
    },
    relevantCapabilities: capabilities.value,
    terminology: terminology.value.terms,
    resolution: {
      mode: input.mode,
      requestedLocale: input.requestedLocale,
      resolvedLocale: terminology.value.resolvedLocale,
      fallbackUsed: terminology.value.fallbackUsed,
    },
  });
}
