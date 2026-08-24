import { controlPlaneFail, controlPlaneOk, type ControlPlaneResult } from "./errors";
import type { CapabilityDependencyEdge } from "./types";

export type CapabilityClosure = {
  seedKeys: readonly string[];
  closedKeys: readonly string[];
};

/**
 * Deterministic transitive requires closure over direct catalog edges.
 * Pure domain: no I/O, no seed graph constants.
 */
export function computeCapabilityClosure(
  seedKeys: readonly string[],
  directEdges: readonly Pick<
    CapabilityDependencyEdge,
    "capabilityKey" | "dependsOnCapabilityKey"
  >[],
): ControlPlaneResult<CapabilityClosure> {
  const adjacency = new Map<string, string[]>();
  for (const edge of directEdges) {
    const current = adjacency.get(edge.capabilityKey) ?? [];
    if (!current.includes(edge.dependsOnCapabilityKey)) {
      current.push(edge.dependsOnCapabilityKey);
    }
    adjacency.set(edge.capabilityKey, current);
  }

  const closed = new Set<string>();
  const visiting = new Set<string>();

  const visit = (key: string): ControlPlaneResult<void> => {
    if (visiting.has(key)) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Capability dependency graph contains a cycle",
        { seedKeys: [...seedKeys], cycleAt: key },
      );
    }
    if (closed.has(key)) {
      return controlPlaneOk(undefined);
    }
    visiting.add(key);
    for (const required of adjacency.get(key) ?? []) {
      const nested = visit(required);
      if (!nested.ok) {
        return nested;
      }
    }
    visiting.delete(key);
    closed.add(key);
    return controlPlaneOk(undefined);
  };

  for (const seed of seedKeys) {
    const walked = visit(seed);
    if (!walked.ok) {
      return walked;
    }
  }

  return controlPlaneOk({
    seedKeys: [...seedKeys],
    closedKeys: [...closed].sort(),
  });
}
