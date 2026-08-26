import "server-only";

import {
  controlPlaneFail,
  controlPlaneOk,
  type ControlPlaneResult,
} from "@/features/control-plane/domain/errors";
import type {
  CapabilityDefinition,
  CatalogLifecycleStatus,
  ContextCapabilityMapping,
  ContextChangeImpact,
  ContextCompleteness,
  ContextMappingOp,
  ContextPackDefinition,
  ContextPackKind,
  ContextPackReadiness,
  ContextPackVersion,
  ContextPublicationStatus,
  ContextReadinessStatus,
  ContextRelevance,
  ContextTaxonomyTarget,
  ContextTerminology,
  ContextVersionBundle,
  TaxonomyNodeKind,
} from "@/features/control-plane/domain/types";
import { CapabilitiesRepository } from "@/features/control-plane/server/capabilities.repository";
import {
  asNullableString,
  asNumber,
  asScope,
  asString,
  executeControlPlaneQuery,
  type ControlPlaneQueryClient,
} from "@/features/control-plane/server/control-plane-query";

const TARGET_FK: Record<TaxonomyNodeKind, string> = {
  foundation: "foundation_id",
  industry: "industry_id",
  niche: "niche_id",
  specialization: "specialization_id",
  deep_specialization: "deep_specialization_id",
};

function parsePackKind(value: unknown): ContextPackKind | null {
  if (
    value === "foundation" ||
    value === "industry" ||
    value === "niche" ||
    value === "specialization" ||
    value === "deep_specialization"
  ) {
    return value;
  }
  return null;
}

function parseLifecycle(value: unknown): CatalogLifecycleStatus | null {
  if (value === "draft" || value === "active" || value === "superseded") {
    return value;
  }
  return null;
}

function parsePublication(value: unknown): ContextPublicationStatus | null {
  if (value === "draft" || value === "published" || value === "superseded") {
    return value;
  }
  return null;
}

function parseCompleteness(value: unknown): ContextCompleteness | null {
  if (value === "full" || value === "delta") {
    return value;
  }
  return null;
}

function parseImpact(value: unknown): ContextChangeImpact | null {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return null;
}

function parseMappingOp(value: unknown): ContextMappingOp | null {
  if (value === "set" || value === "remove") {
    return value;
  }
  return null;
}

function parseRelevance(value: unknown): ContextRelevance | null {
  if (value === "required" || value === "recommended" || value === "optional") {
    return value;
  }
  return null;
}

function parseContextReadiness(value: unknown): ContextReadinessStatus | null {
  if (
    value === "planned" ||
    value === "context_ready" ||
    value === "beta_supported" ||
    value === "production_verified"
  ) {
    return value;
  }
  return null;
}

function packTarget(
  packKind: ContextPackKind,
  row: Record<string, unknown>,
): ControlPlaneResult<ContextTaxonomyTarget> {
  const populated = (Object.keys(TARGET_FK) as TaxonomyNodeKind[]).filter(
    (kind) => asString(row[TARGET_FK[kind]]),
  );
  if (populated.length !== 1 || populated[0] !== packKind) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context pack taxonomy target is not a typed XOR match",
      { packKind, populated },
    );
  }
  const id = asString(row[TARGET_FK[packKind]]);
  if (!id) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context pack taxonomy target id is missing",
    );
  }
  return controlPlaneOk({ kind: packKind, id });
}

function mapPack(
  row: Record<string, unknown>,
): ControlPlaneResult<ContextPackDefinition> {
  const id = asString(row.id);
  const packKey = asString(row.pack_key);
  const label = asString(row.label);
  const packKind = parsePackKind(row.pack_kind);
  const defaultLocale = asString(row.default_locale);
  const lifecycleStatus = parseLifecycle(row.lifecycle_status);
  if (!id || !packKey || !label || !packKind || !defaultLocale || !lifecycleStatus) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context pack row is missing required canonical fields",
    );
  }
  const target = packTarget(packKind, row);
  if (!target.ok) {
    return target;
  }
  return controlPlaneOk({
    id,
    packKey,
    label,
    packKind,
    defaultLocale,
    lifecycleStatus,
    target: target.value,
  });
}

function mapVersion(
  row: Record<string, unknown>,
): ControlPlaneResult<ContextPackVersion> {
  const id = asString(row.id);
  const packId = asString(row.pack_id);
  const versionNumber = asNumber(row.version_number);
  const publicationStatus = parsePublication(row.publication_status);
  const completeness = parseCompleteness(row.completeness);
  const changeImpact = parseImpact(row.change_impact);
  const definitionSummary = asString(row.definition_summary);
  if (
    !id ||
    !packId ||
    versionNumber === null ||
    !publicationStatus ||
    !completeness ||
    !changeImpact ||
    !definitionSummary
  ) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context pack version row is missing required canonical fields",
    );
  }
  return controlPlaneOk({
    id,
    packId,
    versionNumber,
    publicationStatus,
    completeness,
    parentVersionId: asNullableString(row.parent_version_id),
    changeImpact,
    impactNote: asNullableString(row.impact_note),
    definitionSummary,
    intendedOperator: asNullableString(row.intended_operator),
    primaryExchange: asNullableString(row.primary_exchange),
  });
}

export class ContextRepository {
  constructor(private readonly client: ControlPlaneQueryClient) {}

  async findPackByKey(packKey: string): Promise<ControlPlaneResult<ContextPackDefinition>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("context_packs").select("*").eq("pack_key", packKey),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Context pack not found", { packKey });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate context pack key results",
        { packKey, count: rows.value.length },
      );
    }
    return mapPack(rows.value[0]);
  }

  async findPackForTaxonomyTarget(input: {
    kind: TaxonomyNodeKind;
    key: string;
  }): Promise<ControlPlaneResult<ContextPackDefinition>> {
    const table =
      input.kind === "foundation"
        ? "taxonomy_foundations"
        : input.kind === "industry"
          ? "taxonomy_industries"
          : input.kind === "niche"
            ? "taxonomy_niches"
            : input.kind === "specialization"
              ? "taxonomy_specializations"
              : "taxonomy_deep_specializations";
    const taxRows = await executeControlPlaneQuery(
      this.client.from(table).select("*").eq("key", input.key),
    );
    if (!taxRows.ok) {
      return taxRows;
    }
    if (taxRows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Taxonomy target not found", input);
    }
    if (taxRows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate taxonomy target key results",
        { ...input, count: taxRows.value.length },
      );
    }
    const targetId = asString(taxRows.value[0].id);
    if (!targetId) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Taxonomy target is missing id",
        input,
      );
    }
    const packRows = await executeControlPlaneQuery(
      this.client
        .from("context_packs")
        .select("*")
        .eq("pack_kind", input.kind)
        .eq(TARGET_FK[input.kind], targetId),
    );
    if (!packRows.ok) {
      return packRows;
    }
    if (packRows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "No context pack for taxonomy target", input);
    }
    if (packRows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Multiple context packs for a taxonomy target",
        { ...input, count: packRows.value.length },
      );
    }
    return mapPack(packRows.value[0]);
  }

  async getVersionById(versionId: string): Promise<ControlPlaneResult<ContextPackVersion>> {
    return this.loadVersion("id", versionId);
  }

  async getVersionByPackAndNumber(
    packKey: string,
    versionNumber: number,
  ): Promise<ControlPlaneResult<ContextPackVersion>> {
    const pack = await this.findPackByKey(packKey);
    if (!pack.ok) {
      return pack;
    }
    const rows = await executeControlPlaneQuery(
      this.client
        .from("context_pack_versions")
        .select("*")
        .eq("pack_id", pack.value.id)
        .eq("version_number", versionNumber),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Context pack version not found", {
        packKey,
        versionNumber,
      });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate pack version number results",
        { packKey, versionNumber, count: rows.value.length },
      );
    }
    return mapVersion(rows.value[0]);
  }

  async listPublishedVersionsForPack(
    packKey: string,
  ): Promise<ControlPlaneResult<ContextPackVersion[]>> {
    const pack = await this.findPackByKey(packKey);
    if (!pack.ok) {
      return pack;
    }
    const rows = await executeControlPlaneQuery(
      this.client
        .from("context_pack_versions")
        .select("*")
        .eq("pack_id", pack.value.id)
        .eq("publication_status", "published")
        .order("version_number"),
    );
    if (!rows.ok) {
      return rows;
    }
    const versions: ContextPackVersion[] = [];
    for (const row of rows.value) {
      const mapped = mapVersion(row);
      if (!mapped.ok) {
        return mapped;
      }
      versions.push(mapped.value);
    }
    return controlPlaneOk(versions);
  }

  async getParentVersion(
    version: Pick<ContextPackVersion, "parentVersionId">,
  ): Promise<ControlPlaneResult<ContextPackVersion | null>> {
    if (!version.parentVersionId) {
      return controlPlaneOk(null);
    }
    const parent = await this.getVersionById(version.parentVersionId);
    if (!parent.ok) {
      if (parent.error.code === "NOT_FOUND") {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context parent_version_id cannot be loaded",
          { parentVersionId: version.parentVersionId },
        );
      }
      return parent;
    }
    return parent;
  }

  async getMappings(
    versionId: string,
  ): Promise<ControlPlaneResult<ContextCapabilityMapping[]>> {
    const mappingRows = await executeControlPlaneQuery(
      this.client
        .from("context_capability_mappings")
        .select("*")
        .eq("version_id", versionId),
    );
    if (!mappingRows.ok) {
      return mappingRows;
    }
    const capabilityIds = mappingRows.value
      .map((row) => asString(row.capability_id))
      .filter((id): id is string => Boolean(id));
    const capabilities = await this.loadCapabilitiesByIds(capabilityIds);
    if (!capabilities.ok) {
      return capabilities;
    }
    const byId = new Map(capabilities.value.map((item) => [item.id, item]));
    const mappings: ContextCapabilityMapping[] = [];
    for (const row of mappingRows.value) {
      const mapped = this.mapMapping(row, byId);
      if (!mapped.ok) {
        return mapped;
      }
      mappings.push(mapped.value);
    }
    return controlPlaneOk(
      mappings.sort((a, b) => a.capabilityKey.localeCompare(b.capabilityKey)),
    );
  }

  async getTerminology(
    versionId: string,
  ): Promise<ControlPlaneResult<ContextTerminology[]>> {
    const rows = await executeControlPlaneQuery(
      this.client
        .from("context_terminology")
        .select("*")
        .eq("version_id", versionId)
        .order("term_key"),
    );
    if (!rows.ok) {
      return rows;
    }
    const terms: ContextTerminology[] = [];
    for (const row of rows.value) {
      const version = asString(row.version_id);
      const locale = asString(row.locale);
      const termKey = asString(row.term_key);
      const singularLabel = asString(row.singular_label);
      const pluralLabel = asString(row.plural_label);
      if (!version || !locale || !termKey || !singularLabel || !pluralLabel) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context terminology row is missing required fields",
        );
      }
      terms.push({
        versionId: version,
        locale,
        termKey,
        singularLabel,
        pluralLabel,
        shortLabel: asNullableString(row.short_label),
        helpText: asNullableString(row.help_text),
      });
    }
    return controlPlaneOk(terms);
  }

  async getMappingsForVersions(
    versionIds: readonly string[],
  ): Promise<ControlPlaneResult<ContextCapabilityMapping[]>> {
    if (versionIds.length === 0) {
      return controlPlaneOk([]);
    }
    const unique = [...new Set(versionIds)];
    const mappingRows = await executeControlPlaneQuery(
      this.client
        .from("context_capability_mappings")
        .select("*")
        .in("version_id", unique),
    );
    if (!mappingRows.ok) {
      return mappingRows;
    }
    const capabilityIds = mappingRows.value
      .map((row) => asString(row.capability_id))
      .filter((id): id is string => Boolean(id));
    const capabilities = await this.loadCapabilitiesByIds(capabilityIds);
    if (!capabilities.ok) {
      return capabilities;
    }
    const byId = new Map(capabilities.value.map((item) => [item.id, item]));
    const mappings: ContextCapabilityMapping[] = [];
    for (const row of mappingRows.value) {
      const mapped = this.mapMapping(row, byId);
      if (!mapped.ok) {
        return mapped;
      }
      mappings.push(mapped.value);
    }
    return controlPlaneOk(
      mappings.sort((a, b) =>
        `${a.versionId}:${a.capabilityKey}`.localeCompare(`${b.versionId}:${b.capabilityKey}`),
      ),
    );
  }

  async getTerminologyForVersions(
    versionIds: readonly string[],
  ): Promise<ControlPlaneResult<ContextTerminology[]>> {
    if (versionIds.length === 0) {
      return controlPlaneOk([]);
    }
    const unique = [...new Set(versionIds)];
    const rows = await executeControlPlaneQuery(
      this.client
        .from("context_terminology")
        .select("*")
        .in("version_id", unique)
        .order("term_key"),
    );
    if (!rows.ok) {
      return rows;
    }
    const terms: ContextTerminology[] = [];
    for (const row of rows.value) {
      const version = asString(row.version_id);
      const locale = asString(row.locale);
      const termKey = asString(row.term_key);
      const singularLabel = asString(row.singular_label);
      const pluralLabel = asString(row.plural_label);
      if (!version || !locale || !termKey || !singularLabel || !pluralLabel) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context terminology row is missing required fields",
        );
      }
      terms.push({
        versionId: version,
        locale,
        termKey,
        singularLabel,
        pluralLabel,
        shortLabel: asNullableString(row.short_label),
        helpText: asNullableString(row.help_text),
      });
    }
    return controlPlaneOk(
      terms.sort((left, right) =>
        `${left.versionId}:${left.locale}:${left.termKey}`.localeCompare(
          `${right.versionId}:${right.locale}:${right.termKey}`,
        ),
      ),
    );
  }

  async getPacksByIds(
    packIds: readonly string[],
  ): Promise<ControlPlaneResult<ContextPackDefinition[]>> {
    if (packIds.length === 0) {
      return controlPlaneOk([]);
    }
    const unique = [...new Set(packIds)];
    const rows = await executeControlPlaneQuery(
      this.client.from("context_packs").select("*").in("id", unique),
    );
    if (!rows.ok) {
      return rows;
    }
    const packs: ContextPackDefinition[] = [];
    for (const row of rows.value) {
      const mapped = mapPack(row);
      if (!mapped.ok) {
        return mapped;
      }
      packs.push(mapped.value);
    }
    if (packs.length !== unique.length) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context version pack was not supplied",
        { expected: unique.length, found: packs.length },
      );
    }
    return controlPlaneOk(packs);
  }

  async getPackReadinessForVersions(
    versionIds: readonly string[],
  ): Promise<ControlPlaneResult<ContextPackReadiness[]>> {
    if (versionIds.length === 0) {
      return controlPlaneOk([]);
    }
    const unique = [...new Set(versionIds)];
    const rows = await executeControlPlaneQuery(
      this.client
        .from("context_pack_readiness")
        .select("*")
        .in("version_id", unique),
    );
    if (!rows.ok) {
      return rows;
    }
    const seen = new Set<string>();
    const items: ContextPackReadiness[] = [];
    for (const row of rows.value) {
      const versionId = asString(row.version_id);
      if (!versionId) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context pack readiness row is missing version identity",
        );
      }
      if (seen.has(versionId)) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Duplicate context pack readiness rows",
          { versionId },
        );
      }
      seen.add(versionId);
      const readinessStatus = parseContextReadiness(row.readiness_status);
      const supportedScope = asScope(row.supported_scope);
      if (!readinessStatus || !supportedScope) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context pack readiness row is missing required fields",
          { versionId },
        );
      }
      items.push({
        versionId,
        readinessStatus,
        supportedScope,
        evidencePhase: asNullableString(row.evidence_phase),
        verifiedAt: asNullableString(row.verified_at),
      });
    }
    return controlPlaneOk(items);
  }

  async getPackReadiness(
    versionId: string,
  ): Promise<ControlPlaneResult<ContextPackReadiness>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("context_pack_readiness").select("*").eq("version_id", versionId),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Context pack readiness not found", {
        versionId,
      });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate context pack readiness rows",
        { versionId, count: rows.value.length },
      );
    }
    const row = rows.value[0];
    const readinessStatus = parseContextReadiness(row.readiness_status);
    const supportedScope = asScope(row.supported_scope);
    if (!readinessStatus || !supportedScope) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context pack readiness row is missing required fields",
        { versionId },
      );
    }
    return controlPlaneOk({
      versionId,
      readinessStatus,
      supportedScope,
      evidencePhase: asNullableString(row.evidence_phase),
      verifiedAt: asNullableString(row.verified_at),
    });
  }

  async loadContextVersionBundle(
    versionId: string,
  ): Promise<ControlPlaneResult<ContextVersionBundle>> {
    const version = await this.getVersionById(versionId);
    if (!version.ok) {
      return version;
    }
    const packRows = await executeControlPlaneQuery(
      this.client.from("context_packs").select("*").eq("id", version.value.packId),
    );
    if (!packRows.ok) {
      return packRows;
    }
    if (packRows.value.length !== 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context version points at a missing pack",
        { versionId, packId: version.value.packId, count: packRows.value.length },
      );
    }
    const pack = mapPack(packRows.value[0]);
    if (!pack.ok) {
      return pack;
    }
    const parentVersion = await this.getParentVersion(version.value);
    if (!parentVersion.ok) {
      return parentVersion;
    }
    const mappings = await this.getMappings(versionId);
    if (!mappings.ok) {
      return mappings;
    }
    const terminology = await this.getTerminology(versionId);
    if (!terminology.ok) {
      return terminology;
    }
    const readiness = await this.getPackReadiness(versionId);
    if (!readiness.ok) {
      if (readiness.error.code === "NOT_FOUND") {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context version is missing pack readiness",
          { versionId },
        );
      }
      return readiness;
    }
    const capabilitiesReferenced = mappings.value.map((mapping) => mapping.capabilityKey);
    const caps = await new CapabilitiesRepository(this.client).listByKeys(
      capabilitiesReferenced,
      { requireComplete: true },
    );
    if (!caps.ok) {
      if (caps.error.code === "NOT_FOUND") {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context mapping refers to a missing capability",
          caps.error.details,
        );
      }
      return caps;
    }
    return controlPlaneOk({
      pack: pack.value,
      version: version.value,
      parentVersion: parentVersion.value,
      mappings: mappings.value,
      terminology: terminology.value,
      readiness: readiness.value,
      capabilitiesReferenced: caps.value,
    });
  }

  private async loadVersion(
    column: "id",
    value: string,
  ): Promise<ControlPlaneResult<ContextPackVersion>> {
    const rows = await executeControlPlaneQuery(
      this.client.from("context_pack_versions").select("*").eq(column, value),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Context pack version not found", {
        [column]: value,
      });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate context pack version results",
        { [column]: value, count: rows.value.length },
      );
    }
    return mapVersion(rows.value[0]);
  }

  private async loadCapabilitiesByIds(
    ids: readonly string[],
  ): Promise<ControlPlaneResult<CapabilityDefinition[]>> {
    if (ids.length === 0) {
      return controlPlaneOk([]);
    }
    const unique = [...new Set(ids)];
    const rows = await executeControlPlaneQuery(
      this.client.from("capabilities").select("*").in("id", unique),
    );
    if (!rows.ok) {
      return rows;
    }
    const items: CapabilityDefinition[] = [];
    const capabilitiesRepo = new CapabilitiesRepository(this.client);
    const listed = await capabilitiesRepo.listByKeys(
      rows.value
        .map((row) => asString(row.capability_key))
        .filter((key): key is string => Boolean(key)),
      { requireComplete: true },
    );
    if (!listed.ok) {
      return listed;
    }
    items.push(...listed.value);
    if (items.length !== unique.length) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context mapping refers to a missing capability",
        { expected: unique.length, found: items.length },
      );
    }
    return controlPlaneOk(items);
  }

  private mapMapping(
    row: Record<string, unknown>,
    capabilities: Map<string, CapabilityDefinition>,
  ): ControlPlaneResult<ContextCapabilityMapping> {
    const versionId = asString(row.version_id);
    const capabilityId = asString(row.capability_id);
    const mappingOp = parseMappingOp(row.mapping_op);
    if (!versionId || !capabilityId || !mappingOp) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context capability mapping row is missing required fields",
      );
    }
    const capability = capabilities.get(capabilityId);
    if (!capability) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context mapping refers to a missing capability",
        { capabilityId },
      );
    }
    const relevance = row.relevance === null ? null : parseRelevance(row.relevance);
    if (mappingOp === "set" && relevance === null) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "SET mapping requires non-null relevance",
        { capabilityKey: capability.capabilityKey },
      );
    }
    if (mappingOp === "remove" && row.relevance !== null) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "REMOVE mapping requires null relevance",
        { capabilityKey: capability.capabilityKey },
      );
    }
    if (mappingOp === "set" && relevance === null) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "SET mapping relevance is invalid",
      );
    }
    return controlPlaneOk({
      versionId,
      capabilityId,
      capabilityKey: capability.capabilityKey,
      mappingOp,
      relevance,
    });
  }
}
