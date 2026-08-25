/**
 * Deterministic Context capability SET/REMOVE merge and CAP coherence.
 * Relevance is not entitlement. Missing hard dependencies are never inserted.
 */

import { computeCapabilityClosure } from "@/features/control-plane/domain/capability-closure";
import type { ContextRelevance } from "@/features/control-plane/domain/types";
import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import {
  SYSTEM_BASELINE_CAPABILITY_KEYS,
  type ContextChainEntry,
  type EffectiveCapability,
  type ResolverCapabilityDefinition,
  type ResolverCapabilityDependency,
  type ResolverCapabilityReadiness,
  type ResolverContextMapping,
} from "@/features/context-resolver/domain/types";

export function relevanceRank(relevance: ContextRelevance): number {
  if (relevance === "required") {
    return 3;
  }
  if (relevance === "recommended") {
    return 2;
  }
  return 1;
}

function isSystemBaselineKey(capabilityKey: string): boolean {
  return (SYSTEM_BASELINE_CAPABILITY_KEYS as readonly string[]).includes(capabilityKey);
}

function indexUniqueByKey<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  label: string,
): ContextResolverResult<Map<string, T>> {
  const index = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    if (index.has(key)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        `Duplicate ${label}`,
        { key },
      );
    }
    index.set(key, row);
  }
  return contextResolverOk(index);
}

export function seedSystemBaselineCapabilities(input: {
  capabilities: ReadonlyMap<string, ResolverCapabilityDefinition>;
  readiness: ReadonlyMap<string, ResolverCapabilityReadiness>;
}): ContextResolverResult<Map<string, EffectiveCapability>> {
  const seeded = new Map<string, EffectiveCapability>();
  for (const capabilityKey of SYSTEM_BASELINE_CAPABILITY_KEYS) {
    const definition = input.capabilities.get(capabilityKey);
    if (!definition) {
      return contextResolverFail(
        "CAPABILITY_NOT_FOUND",
        "System Core baseline capability definition is missing",
        { capabilityKey },
      );
    }
    if (definition.lifecycleStatus === "draft") {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "System Core baseline capability must not be draft",
        { capabilityKey },
      );
    }
    const readiness = input.readiness.get(capabilityKey);
    if (!readiness) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "System Core baseline capability readiness is missing",
        { capabilityKey },
      );
    }
    seeded.set(capabilityKey, {
      capabilityKey,
      effectiveRelevance: "required",
      provenance: {
        sourceKind: "system_baseline",
        sourceContextPackKey: null,
        sourceVersionNumber: null,
        establishedBy: "set",
      },
      lifecycleStatus: definition.lifecycleStatus,
      readinessStatus: readiness.readinessStatus,
    });
  }
  return contextResolverOk(seeded);
}

export function mergeContextCapabilityMappings(input: {
  chain: readonly ContextChainEntry[];
  mappings: readonly ResolverContextMapping[];
  capabilities: readonly ResolverCapabilityDefinition[];
  capabilityReadiness: readonly ResolverCapabilityReadiness[];
}): ContextResolverResult<readonly EffectiveCapability[]> {
  const capabilities = indexUniqueByKey(
    input.capabilities,
    (row) => row.capabilityKey,
    "capability definition",
  );
  if (!capabilities.ok) {
    return capabilities;
  }
  const readiness = indexUniqueByKey(
    input.capabilityReadiness,
    (row) => row.capabilityKey,
    "capability readiness",
  );
  if (!readiness.ok) {
    return readiness;
  }

  const seenMapping = new Set<string>();
  for (const mapping of input.mappings) {
    const identity = `${mapping.versionId}::${mapping.capabilityKey}`;
    if (seenMapping.has(identity)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate Context capability mapping for one version",
        { versionId: mapping.versionId, capabilityKey: mapping.capabilityKey },
      );
    }
    seenMapping.add(identity);
    if (!capabilities.value.has(mapping.capabilityKey)) {
      return contextResolverFail(
        "CAPABILITY_NOT_FOUND",
        "Context mapping capability definition is missing",
        { capabilityKey: mapping.capabilityKey },
      );
    }
    if (isSystemBaselineKey(mapping.capabilityKey)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context Packs cannot SET or REMOVE system Core baseline capabilities",
        { capabilityKey: mapping.capabilityKey, mappingOp: mapping.mappingOp },
      );
    }
    if (mapping.mappingOp === "set" && mapping.relevance == null) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "SET mapping requires relevance",
        { capabilityKey: mapping.capabilityKey },
      );
    }
    if (mapping.mappingOp === "remove" && mapping.relevance != null) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "REMOVE mapping requires null relevance",
        { capabilityKey: mapping.capabilityKey },
      );
    }
  }

  const effective = seedSystemBaselineCapabilities({
    capabilities: capabilities.value,
    readiness: readiness.value,
  });
  if (!effective.ok) {
    return effective;
  }

  for (const entry of input.chain) {
    const versionMappings = input.mappings
      .filter((mapping) => mapping.versionId === entry.version.id)
      .slice()
      .sort((left, right) => left.capabilityKey.localeCompare(right.capabilityKey));

    for (const mapping of versionMappings) {
      const current = effective.value.get(mapping.capabilityKey);
      if (mapping.mappingOp === "remove") {
        if (!current) {
          continue;
        }
        if (current.effectiveRelevance === "required") {
          return contextResolverFail(
            "CATALOG_INTEGRITY_ERROR",
            "Cannot REMOVE an inherited required capability",
            { capabilityKey: mapping.capabilityKey, packKey: entry.pack.packKey },
          );
        }
        effective.value.delete(mapping.capabilityKey);
        continue;
      }
      const relevance = mapping.relevance;
      if (relevance == null) {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "SET mapping requires relevance",
          { capabilityKey: mapping.capabilityKey },
        );
      }
      if (current && relevanceRank(relevance) < relevanceRank(current.effectiveRelevance)) {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "Child Context cannot weaken inherited capability relevance",
          {
            capabilityKey: mapping.capabilityKey,
            from: current.effectiveRelevance,
            to: relevance,
          },
        );
      }
      const definition = capabilities.value.get(mapping.capabilityKey);
      const capReadiness = readiness.value.get(mapping.capabilityKey);
      if (!definition || !capReadiness) {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "Mapped capability is missing definition or readiness",
          { capabilityKey: mapping.capabilityKey },
        );
      }
      if (definition.lifecycleStatus === "draft") {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "Published Context cannot reference a draft capability",
          { capabilityKey: mapping.capabilityKey },
        );
      }
      const overriddenFromPackKey =
        current?.provenance.sourceKind === "context_mapping" &&
        current.provenance.sourceContextPackKey &&
        current.provenance.sourceContextPackKey !== entry.pack.packKey
          ? current.provenance.sourceContextPackKey
          : undefined;
      effective.value.set(mapping.capabilityKey, {
        capabilityKey: mapping.capabilityKey,
        effectiveRelevance: relevance,
        provenance: {
          sourceKind: "context_mapping",
          sourceContextPackKey: entry.pack.packKey,
          sourceVersionNumber: entry.version.versionNumber,
          establishedBy: "set",
          ...(overriddenFromPackKey ? { overriddenFromPackKey } : {}),
        },
        lifecycleStatus: definition.lifecycleStatus,
        readinessStatus: capReadiness.readinessStatus,
      });
    }
  }

  return contextResolverOk(
    [...effective.value.values()].sort((left, right) =>
      left.capabilityKey.localeCompare(right.capabilityKey),
    ),
  );
}

export function assertCapabilityDependencyCoherence(input: {
  capabilities: readonly EffectiveCapability[];
  dependencies: readonly ResolverCapabilityDependency[];
}): ContextResolverResult<true> {
  const cycleCheck = computeCapabilityClosure(
    [...new Set(input.dependencies.flatMap((edge) => [edge.capabilityKey, edge.dependsOnCapabilityKey]))],
    input.dependencies,
  );
  if (!cycleCheck.ok) {
    return contextResolverFail(
      "CAPABILITY_DEPENDENCY_CYCLE",
      "Capability dependency graph contains a cycle",
      cycleCheck.error.details,
    );
  }

  const byKey = new Map(input.capabilities.map((item) => [item.capabilityKey, item]));
  for (const capability of input.capabilities) {
    const closure = computeCapabilityClosure([capability.capabilityKey], input.dependencies);
    if (!closure.ok) {
      return contextResolverFail(
        "CAPABILITY_DEPENDENCY_CYCLE",
        "Capability dependency graph contains a cycle",
        closure.error.details,
      );
    }
    for (const requiredKey of closure.value.closedKeys) {
      if (requiredKey === capability.capabilityKey) {
        continue;
      }
      const dependency = byKey.get(requiredKey);
      if (!dependency) {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "Effective Context is missing a hard CAP dependency",
          {
            capabilityKey: capability.capabilityKey,
            missingDependency: requiredKey,
          },
        );
      }
      if (
        capability.effectiveRelevance === "required" &&
        dependency.effectiveRelevance !== "required"
      ) {
        return contextResolverFail(
          "CATALOG_INTEGRITY_ERROR",
          "Required capability hard dependencies must also be required",
          {
            capabilityKey: capability.capabilityKey,
            dependencyKey: requiredKey,
            dependencyRelevance: dependency.effectiveRelevance,
          },
        );
      }
    }
  }
  return contextResolverOk(true);
}
