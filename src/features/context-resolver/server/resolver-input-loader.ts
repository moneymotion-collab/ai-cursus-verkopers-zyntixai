import "server-only";

import type { TaxonomyNodeKind, TaxonomyPath } from "@/features/control-plane/domain/types";
import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import {
  CONTEXT_CHAIN_MAX_DEPTH,
  type ContextResolutionInput,
  type ResolverContextPack,
  type ResolverContextVersion,
} from "@/features/context-resolver/domain/types";
import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import type { BusinessActivity } from "@/features/org-context/domain/types";
import { mapControlPlaneError } from "./map-errors";

export type ControlPlaneReaders = ReturnType<typeof createControlPlaneReaders>;

function taxonomyNode(
  path: TaxonomyPath,
  kind: TaxonomyNodeKind,
) {
  if (kind === "foundation") return path.foundation;
  if (kind === "industry") return path.industry;
  if (kind === "niche") return path.niche;
  if (kind === "specialization") return path.specialization;
  return path.deepSpecialization;
}

export async function loadResolverCatalogInput(input: {
  readers: ControlPlaneReaders;
  organizationId: string;
  activity: BusinessActivity;
  leafVersionId: string;
  requestedLocale: string | null;
  mode: ContextResolutionInput["mode"];
}): Promise<ContextResolverResult<ContextResolutionInput>> {
  const classification = input.activity.classification;
  if (!classification) {
    return contextResolverFail(
      "ACTIVITY_UNCLASSIFIED",
      "Unclassified Business Activity cannot be resolved",
    );
  }

  const versions: ResolverContextVersion[] = [];
  const seen = new Set<string>();
  let currentId: string | null = input.leafVersionId;
  while (currentId) {
    if (seen.has(currentId)) {
      return contextResolverFail(
        "PARENT_CONTEXT_CYCLE",
        "Pinned Context parent chain contains a cycle",
        { versionId: currentId },
      );
    }
    if (versions.length >= CONTEXT_CHAIN_MAX_DEPTH) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Pinned Context parent chain exceeds maximum depth",
        { maxDepth: CONTEXT_CHAIN_MAX_DEPTH },
      );
    }
    seen.add(currentId);
    const version = await input.readers.context.getVersionById(currentId);
    if (!version.ok) {
      return mapControlPlaneError(
        version.error,
        versions.length === 0 ? "CONTEXT_VERSION_NOT_FOUND" : "PARENT_CONTEXT_NOT_FOUND",
      );
    }
    versions.push({
      id: version.value.id,
      packId: version.value.packId,
      versionNumber: version.value.versionNumber,
      publicationStatus: version.value.publicationStatus,
      parentVersionId: version.value.parentVersionId,
    });
    currentId = version.value.parentVersionId;
  }
  versions.reverse();

  const packsResult = await input.readers.context.getPacksByIds(
    versions.map((version) => version.packId),
  );
  if (!packsResult.ok) {
    return mapControlPlaneError(packsResult.error);
  }
  const versionIds = versions.map((version) => version.id);
  const mappings = await input.readers.context.getMappingsForVersions(versionIds);
  if (!mappings.ok) {
    return mapControlPlaneError(mappings.error, "CAPABILITY_NOT_FOUND");
  }
  const terminology = await input.readers.context.getTerminologyForVersions(versionIds);
  if (!terminology.ok) {
    return mapControlPlaneError(terminology.error);
  }
  const contextReadiness = await input.readers.context.getPackReadinessForVersions(versionIds);
  if (!contextReadiness.ok) {
    return mapControlPlaneError(contextReadiness.error);
  }

  const taxonomyPath = await input.readers.taxonomy.getTaxonomyPathById({
    kind: classification.kind,
    id: classification.targetId,
  });
  if (!taxonomyPath.ok) {
    return mapControlPlaneError(taxonomyPath.error);
  }

  const packs: ResolverContextPack[] = [];
  for (const pack of packsResult.value) {
    const pathNode = taxonomyNode(taxonomyPath.value, pack.packKind);
    let targetKey = pathNode?.id === pack.target.id ? pathNode.key : null;
    if (!targetKey) {
      const node = await input.readers.taxonomy.getNodeById(pack.packKind, pack.target.id);
      if (!node.ok) {
        return mapControlPlaneError(node.error);
      }
      targetKey = node.value.key;
    }
    packs.push({
      id: pack.id,
      packKey: pack.packKey,
      packKind: pack.packKind,
      defaultLocale: pack.defaultLocale,
      target: pack.target,
      targetKey,
    });
  }

  // Full canonical CAP catalog (Option A): current global catalog is small.
  // Core baseline keys are included when present; the pure engine still fails
  // if a Core or mapped definition is missing. Missing CAP readiness is omitted.
  const definitions = await input.readers.capabilities.listAllDefinitions();
  if (!definitions.ok) {
    return mapControlPlaneError(definitions.error, "CAPABILITY_NOT_FOUND");
  }
  const dependencies = await input.readers.capabilities.getDirectDependencies();
  if (!dependencies.ok) {
    return mapControlPlaneError(dependencies.error);
  }
  const capabilityReadiness = await input.readers.capabilities.listReadiness();
  if (!capabilityReadiness.ok) {
    return mapControlPlaneError(capabilityReadiness.error);
  }

  const classified = {
    ...classification,
    targetKey:
      classification.targetKey ??
      taxonomyNode(taxonomyPath.value, classification.kind)?.key,
  };

  return contextResolverOk({
    organization: { id: input.organizationId },
    activity: {
      id: input.activity.activityId,
      activityKey: input.activity.activityKey,
      displayName: input.activity.displayName,
      status: input.activity.status,
      isPrimary: input.activity.isPrimary,
      classification: classified,
    },
    leafVersionId: input.leafVersionId,
    packs,
    versions,
    mappings: mappings.value.map((mapping) => ({
      versionId: mapping.versionId,
      capabilityKey: mapping.capabilityKey,
      mappingOp: mapping.mappingOp,
      relevance: mapping.relevance,
    })),
    terminology: terminology.value.map((row) => ({
      versionId: row.versionId,
      locale: row.locale,
      termKey: row.termKey,
      singularLabel: row.singularLabel,
      pluralLabel: row.pluralLabel,
      shortLabel: row.shortLabel,
      helpText: row.helpText,
    })),
    contextReadiness: contextReadiness.value.map((row) => ({
      versionId: row.versionId,
      readinessStatus: row.readinessStatus,
    })),
    taxonomyPath: taxonomyPath.value,
    capabilities: definitions.value.map((item) => ({
      capabilityKey: item.capabilityKey,
      lifecycleStatus: item.lifecycleStatus,
    })),
    dependencies: dependencies.value.map((edge) => ({
      capabilityKey: edge.capabilityKey,
      dependsOnCapabilityKey: edge.dependsOnCapabilityKey,
    })),
    capabilityReadiness: capabilityReadiness.value.map((row) => ({
      capabilityKey: row.capabilityKey,
      readinessStatus: row.readinessStatus,
      supportedScope: row.supportedScope,
    })),
    requestedLocale: input.requestedLocale,
    mode: input.mode,
  });
}
