import "server-only";

import {
  controlPlaneFail,
  controlPlaneOk,
  type ControlPlaneResult,
} from "@/features/control-plane/domain/errors";
import type {
  CapabilityDefinition,
  CapabilityDependencyEdge,
  CapabilityLifecycleStatus,
  CapabilityOwnerClass,
  CapabilityReadiness,
  CapabilityReadinessStatus,
  CatalogListOptions,
  CatalogVisibility,
} from "@/features/control-plane/domain/types";
import {
  asNullableString,
  asScope,
  asString,
  executeControlPlaneQuery,
  type ControlPlaneQueryClient,
} from "@/features/control-plane/server/control-plane-query";

function parseOwnerClass(value: unknown): CapabilityOwnerClass | null {
  if (
    value === "core" ||
    value === "shared" ||
    value === "foundation" ||
    value === "horizontal"
  ) {
    return value;
  }
  return null;
}

function parseLifecycle(value: unknown): CapabilityLifecycleStatus | null {
  if (
    value === "draft" ||
    value === "active" ||
    value === "deprecated" ||
    value === "superseded"
  ) {
    return value;
  }
  return null;
}

function parseVisibility(value: unknown): CatalogVisibility | null {
  if (value === "internal" || value === "listed") {
    return value;
  }
  return null;
}

function parseReadiness(value: unknown): CapabilityReadinessStatus | null {
  if (
    value === "planned" ||
    value === "context_ready" ||
    value === "foundation_ready" ||
    value === "beta_supported" ||
    value === "production_verified"
  ) {
    return value;
  }
  return null;
}

function mapCapability(
  row: Record<string, unknown>,
): ControlPlaneResult<CapabilityDefinition> {
  const id = asString(row.id);
  const capabilityKey = asString(row.capability_key);
  const label = asString(row.label);
  const description = asString(row.description);
  const ownerClass = parseOwnerClass(row.owner_class);
  const ownerKey = asString(row.owner_key);
  const lifecycleStatus = parseLifecycle(row.lifecycle_status);
  const catalogVisibility = parseVisibility(row.catalog_visibility);
  if (
    !id ||
    !capabilityKey ||
    !label ||
    !description ||
    !ownerClass ||
    !ownerKey ||
    !lifecycleStatus ||
    !catalogVisibility
  ) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Capability row is missing required canonical fields",
    );
  }
  return controlPlaneOk({
    id,
    capabilityKey,
    label,
    description,
    ownerClass,
    ownerKey,
    foundationId: asNullableString(row.foundation_id),
    lifecycleStatus,
    catalogVisibility,
    supersededByCapabilityId: asNullableString(row.superseded_by_capability_id),
  });
}

export class CapabilitiesRepository {
  constructor(private readonly client: ControlPlaneQueryClient) {}

  async findByKey(capabilityKey: string): Promise<ControlPlaneResult<CapabilityDefinition>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*").eq("capability_key", capabilityKey),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Capability not found", { capabilityKey });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate capability key results",
        { capabilityKey, count: rows.value.length },
      );
    }
    return mapCapability(rows.value[0]);
  }

  async listByKeys(
    capabilityKeys: readonly string[],
    options: { requireComplete?: boolean } = {},
  ): Promise<ControlPlaneResult<CapabilityDefinition[]>> {
    if (capabilityKeys.length === 0) {
      return controlPlaneOk([]);
    }
    const rows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*").in("capability_key", capabilityKeys),
    );
    if (!rows.ok) {
      return rows;
    }
    const mapped: CapabilityDefinition[] = [];
    for (const row of rows.value) {
      const item = mapCapability(row);
      if (!item.ok) {
        return item;
      }
      mapped.push(item.value);
    }
    const byKey = new Map(mapped.map((item) => [item.capabilityKey, item]));
    const missing = capabilityKeys.filter((key) => !byKey.has(key));
    const requireComplete = options.requireComplete !== false;
    if (requireComplete && missing.length > 0) {
      return controlPlaneFail("NOT_FOUND", "One or more capabilities were not found", {
        missing,
      });
    }
    return controlPlaneOk(
      capabilityKeys
        .map((key) => byKey.get(key))
        .filter((item): item is CapabilityDefinition => item !== undefined),
    );
  }

  async listCatalog(
    options: CatalogListOptions = {},
  ): Promise<ControlPlaneResult<CapabilityDefinition[]>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*").order("capability_key"),
    );
    if (!rows.ok) {
      return rows;
    }
    const includeInternal = options.includeInternal === true;
    const items: CapabilityDefinition[] = [];
    for (const row of rows.value) {
      const mapped = mapCapability(row);
      if (!mapped.ok) {
        return mapped;
      }
      if (mapped.value.lifecycleStatus !== "active") {
        continue;
      }
      if (!includeInternal && mapped.value.catalogVisibility !== "listed") {
        continue;
      }
      items.push(mapped.value);
    }
    return controlPlaneOk(items);
  }

  /**
   * Full canonical capability catalog, including non-active and internal rows.
   * Used by Context Resolver so missing mapped/Core keys can fail at the engine.
   */
  async listAllDefinitions(): Promise<ControlPlaneResult<CapabilityDefinition[]>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*").order("capability_key"),
    );
    if (!rows.ok) {
      return rows;
    }
    const items: CapabilityDefinition[] = [];
    for (const row of rows.value) {
      const mapped = mapCapability(row);
      if (!mapped.ok) {
        return mapped;
      }
      items.push(mapped.value);
    }
    return controlPlaneOk(items);
  }

  async getDirectDependencies(
    capabilityKeys?: readonly string[],
  ): Promise<ControlPlaneResult<CapabilityDependencyEdge[]>> {
    const capabilityRows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*"),
    );
    if (!capabilityRows.ok) {
      return capabilityRows;
    }
    const capabilities: CapabilityDefinition[] = [];
    for (const row of capabilityRows.value) {
      const mapped = mapCapability(row);
      if (!mapped.ok) {
        return mapped;
      }
      capabilities.push(mapped.value);
    }
    const byId = new Map(capabilities.map((item) => [item.id, item]));
    const byKey = new Map(capabilities.map((item) => [item.capabilityKey, item]));

    const edgeRows = await executeControlPlaneQuery(
      this.client.from("capability_dependencies").select("*"),
    );
    if (!edgeRows.ok) {
      return edgeRows;
    }

    const wanted =
      capabilityKeys === undefined
        ? null
        : new Set(capabilityKeys);

    const edges: CapabilityDependencyEdge[] = [];
    for (const row of edgeRows.value) {
      const capabilityId = asString(row.capability_id);
      const dependsOnCapabilityId = asString(row.depends_on_capability_id);
      if (!capabilityId || !dependsOnCapabilityId) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Capability dependency row is missing identity fields",
        );
      }
      const dependent = byId.get(capabilityId);
      const required = byId.get(dependsOnCapabilityId);
      if (!dependent || !required) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Capability dependency references a missing capability",
          { capabilityId, dependsOnCapabilityId },
        );
      }
      if (wanted && !wanted.has(dependent.capabilityKey)) {
        continue;
      }
      edges.push({
        capabilityId,
        capabilityKey: dependent.capabilityKey,
        dependsOnCapabilityId,
        dependsOnCapabilityKey: required.capabilityKey,
      });
    }

    if (wanted) {
      for (const key of wanted) {
        if (!byKey.has(key)) {
          return controlPlaneFail("NOT_FOUND", "Capability not found", {
            capabilityKey: key,
          });
        }
      }
    }

    return controlPlaneOk(
      edges.sort((a, b) =>
        `${a.capabilityKey}:${a.dependsOnCapabilityKey}`.localeCompare(
          `${b.capabilityKey}:${b.dependsOnCapabilityKey}`,
        ),
      ),
    );
  }

  async getReadiness(
    capabilityKey: string,
  ): Promise<ControlPlaneResult<CapabilityReadiness>> {
    const capability = await this.findByKey(capabilityKey);
    if (!capability.ok) {
      return capability;
    }
    const rows = await executeControlPlaneQuery(
      this.client
        .from("capability_readiness")
        .select("*")
        .eq("capability_id", capability.value.id),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Capability is missing a readiness row",
        { capabilityKey },
      );
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate capability readiness rows",
        { capabilityKey, count: rows.value.length },
      );
    }
    const row = rows.value[0];
    const readinessStatus = parseReadiness(row.readiness_status);
    const supportedScope = asScope(row.supported_scope);
    if (!readinessStatus || !supportedScope) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Capability readiness row is missing required fields",
        { capabilityKey },
      );
    }
    return controlPlaneOk({
      capabilityId: capability.value.id,
      capabilityKey,
      readinessStatus,
      supportedScope,
      evidencePhase: asNullableString(row.evidence_phase),
      verifiedAt: asNullableString(row.verified_at),
    });
  }

  /**
   * Optional CAP readiness catalog. Missing rows are omitted, not invented.
   * Duplicate capability_id is integrity corruption.
   */
  async listReadiness(): Promise<ControlPlaneResult<CapabilityReadiness[]>> {
    const capabilityRows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*"),
    );
    if (!capabilityRows.ok) {
      return capabilityRows;
    }
    const byId = new Map<string, CapabilityDefinition>();
    for (const row of capabilityRows.value) {
      const mapped = mapCapability(row);
      if (!mapped.ok) {
        return mapped;
      }
      byId.set(mapped.value.id, mapped.value);
    }
    const rows = await executeControlPlaneQuery(
      this.client.from("capability_readiness").select("*"),
    );
    if (!rows.ok) {
      return rows;
    }
    const seen = new Set<string>();
    const items: CapabilityReadiness[] = [];
    for (const row of rows.value) {
      const capabilityId = asString(row.capability_id);
      if (!capabilityId) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Capability readiness row is missing identity",
        );
      }
      if (seen.has(capabilityId)) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Duplicate capability readiness rows",
          { capabilityId },
        );
      }
      seen.add(capabilityId);
      const capability = byId.get(capabilityId);
      if (!capability) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Capability readiness references a missing capability",
          { capabilityId },
        );
      }
      const readinessStatus = parseReadiness(row.readiness_status);
      if (!readinessStatus) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Capability readiness row is missing required fields",
          { capabilityKey: capability.capabilityKey },
        );
      }
      items.push({
        capabilityId,
        capabilityKey: capability.capabilityKey,
        readinessStatus,
        supportedScope: asScope(row.supported_scope) ?? {},
        evidencePhase: asNullableString(row.evidence_phase),
        verifiedAt: asNullableString(row.verified_at),
      });
    }
    return controlPlaneOk(
      items.sort((left, right) => left.capabilityKey.localeCompare(right.capabilityKey)),
    );
  }
}
