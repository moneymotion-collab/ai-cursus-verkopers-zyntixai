import "server-only";

import {
  controlPlaneFail,
  controlPlaneOk,
  type ControlPlaneResult,
} from "@/features/control-plane/domain/errors";
import type {
  CatalogLifecycleStatus,
  CatalogListOptions,
  CatalogVisibility,
  TaxonomyAliasCandidate,
  TaxonomyNodeKind,
  TaxonomyNodeRef,
  TaxonomyPath,
  TaxonomyRelease,
} from "@/features/control-plane/domain/types";
import {
  asString,
  executeControlPlaneQuery,
  type ControlPlaneQueryClient,
  type ControlPlaneTableName,
} from "@/features/control-plane/server/control-plane-query";

const NODE_TABLE: Record<TaxonomyNodeKind, ControlPlaneTableName> = {
  foundation: "taxonomy_foundations",
  industry: "taxonomy_industries",
  niche: "taxonomy_niches",
  specialization: "taxonomy_specializations",
  deep_specialization: "taxonomy_deep_specializations",
};

const CHILD_KIND: Record<TaxonomyNodeKind, TaxonomyNodeKind | null> = {
  foundation: "industry",
  industry: "niche",
  niche: "specialization",
  specialization: "deep_specialization",
  deep_specialization: null,
};

const PARENT_FK: Record<Exclude<TaxonomyNodeKind, "foundation">, string> = {
  industry: "foundation_id",
  niche: "industry_id",
  specialization: "niche_id",
  deep_specialization: "specialization_id",
};

const ALIAS_TARGET_FK: Array<{ column: string; kind: TaxonomyNodeKind }> = [
  { column: "foundation_id", kind: "foundation" },
  { column: "industry_id", kind: "industry" },
  { column: "niche_id", kind: "niche" },
  { column: "specialization_id", kind: "specialization" },
  { column: "deep_specialization_id", kind: "deep_specialization" },
];

function parseLifecycle(value: unknown): CatalogLifecycleStatus | null {
  if (value === "draft" || value === "active" || value === "superseded") {
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

function mapNode(
  kind: TaxonomyNodeKind,
  row: Record<string, unknown>,
): ControlPlaneResult<TaxonomyNodeRef> {
  const id = asString(row.id);
  const key = asString(row.key);
  const label = asString(row.label);
  const lifecycleStatus = parseLifecycle(row.lifecycle_status);
  const catalogVisibility = parseVisibility(row.catalog_visibility);
  if (!id || !key || !label || !lifecycleStatus || !catalogVisibility) {
    return controlPlaneFail(
      "CATALOG_INTEGRITY_ERROR",
      "Taxonomy node row is missing required canonical fields",
      { kind },
    );
  }
  return controlPlaneOk({
    kind,
    id,
    key,
    label,
    lifecycleStatus,
    catalogVisibility,
  });
}

export class TaxonomyRepository {
  constructor(private readonly client: ControlPlaneQueryClient) {}

  findFoundationByKey(key: string) {
    return this.findNodeByKey("foundation", key);
  }

  findIndustryByKey(key: string) {
    return this.findNodeByKey("industry", key);
  }

  findNicheByKey(key: string) {
    return this.findNodeByKey("niche", key);
  }

  findSpecializationByKey(key: string) {
    return this.findNodeByKey("specialization", key);
  }

  findDeepSpecializationByKey(key: string) {
    return this.findNodeByKey("deep_specialization", key);
  }

  getNodeById(kind: TaxonomyNodeKind, id: string) {
    return this.findNodeById(kind, id);
  }

  async findActiveRelease(): Promise<ControlPlaneResult<TaxonomyRelease>> {
    const rows = await executeControlPlaneQuery(
      this.client
        .from("taxonomy_releases")
        .select("*")
        .eq("lifecycle_status", "active"),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0 || rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Expected exactly one active taxonomy release",
        { count: rows.value.length },
      );
    }
    const row = rows.value[0];
    const id = asString(row.id);
    const key = asString(row.key);
    const label = asString(row.label);
    const lifecycleStatus = parseLifecycle(row.lifecycle_status);
    if (!id || !key || !label || !lifecycleStatus) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Active taxonomy release row is missing required fields",
      );
    }
    return controlPlaneOk({ id, key, label, lifecycleStatus });
  }

  async getTaxonomyPath(input: {
    kind: TaxonomyNodeKind;
    key: string;
  }): Promise<ControlPlaneResult<TaxonomyPath>> {
    const start = await this.findNodeByKey(input.kind, input.key);
    if (!start.ok) {
      return start;
    }
    return this.buildPathFromNode(start.value);
  }

  async listActiveListedChildren(
    parent: Pick<TaxonomyNodeRef, "kind" | "id">,
    options: CatalogListOptions = {},
  ): Promise<ControlPlaneResult<TaxonomyNodeRef[]>> {
    const childKind = CHILD_KIND[parent.kind];
    if (!childKind || childKind === "foundation") {
      return controlPlaneOk([]);
    }
    const fk = PARENT_FK[childKind];
    const rows = await executeControlPlaneQuery(
      this.client.from(NODE_TABLE[childKind]).select("*").eq(fk, parent.id),
    );
    if (!rows.ok) {
      return rows;
    }
    const includeInternal = options.includeInternal === true;
    const nodes: TaxonomyNodeRef[] = [];
    for (const row of rows.value) {
      const mapped = mapNode(childKind, row);
      if (!mapped.ok) {
        return mapped;
      }
      if (mapped.value.lifecycleStatus !== "active") {
        continue;
      }
      if (!includeInternal && mapped.value.catalogVisibility !== "listed") {
        continue;
      }
      nodes.push(mapped.value);
    }
    return controlPlaneOk(nodes.sort((a, b) => a.key.localeCompare(b.key)));
  }

  async resolveAliasCandidates(
    aliasLabel: string,
    locale?: string,
  ): Promise<ControlPlaneResult<TaxonomyAliasCandidate>> {
    const normalized = aliasLabel.trim().toLowerCase();
    let builder = this.client
      .from("taxonomy_aliases")
      .select("*")
      .eq("alias_normalized", normalized);
    if (locale) {
      builder = builder.eq("locale", locale);
    }
    const rows = await executeControlPlaneQuery(builder);
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "No taxonomy alias candidates", {
        aliasLabel,
        locale: locale ?? null,
      });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail("AMBIGUOUS", "Multiple taxonomy alias candidates", {
        aliasLabel,
        locale: locale ?? null,
        count: rows.value.length,
      });
    }
    const row = rows.value[0];
    const alias = asString(row.alias_label);
    const rowLocale = asString(row.locale);
    if (!alias || !rowLocale) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Taxonomy alias row is missing identity fields",
      );
    }
    const targets = ALIAS_TARGET_FK.filter((entry) => asString(row[entry.column]));
    if (targets.length !== 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Taxonomy alias must have exactly one target",
        { count: targets.length },
      );
    }
    const targetId = asString(row[targets[0].column]);
    if (!targetId) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Taxonomy alias target id is missing",
      );
    }
    const target = await this.findNodeById(targets[0].kind, targetId);
    if (!target.ok) {
      if (target.error.code === "NOT_FOUND") {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Taxonomy alias points at a missing node",
          { kind: targets[0].kind, id: targetId },
        );
      }
      return target;
    }
    return controlPlaneOk({
      aliasLabel: alias,
      locale: rowLocale,
      target: target.value,
    });
  }

  private parentKind(
    kind: Exclude<TaxonomyNodeKind, "foundation">,
  ): TaxonomyNodeKind {
    if (kind === "industry") return "foundation";
    if (kind === "niche") return "industry";
    if (kind === "specialization") return "niche";
    return "specialization";
  }

  private async findNodeByKey(
    kind: TaxonomyNodeKind,
    key: string,
  ): Promise<ControlPlaneResult<TaxonomyNodeRef>> {
    const rows = await executeControlPlaneQuery(
      this.client.from(NODE_TABLE[kind]).select("*").eq("key", key),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Taxonomy node not found", { kind, key });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate taxonomy key results",
        { kind, key, count: rows.value.length },
      );
    }
    return mapNode(kind, rows.value[0]);
  }

  private async findNodeById(
    kind: TaxonomyNodeKind,
    id: string,
  ): Promise<ControlPlaneResult<TaxonomyNodeRef>> {
    const rows = await executeControlPlaneQuery(
      this.client.from(NODE_TABLE[kind]).select("*").eq("id", id),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return controlPlaneFail("NOT_FOUND", "Taxonomy node not found", { kind, id });
    }
    if (rows.value.length > 1) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate taxonomy id results",
        { kind, id, count: rows.value.length },
      );
    }
    return mapNode(kind, rows.value[0]);
  }

  private async loadRawNode(
    kind: TaxonomyNodeKind,
    id: string,
  ): Promise<ControlPlaneResult<Record<string, unknown>>> {
    const rows = await executeControlPlaneQuery(
      this.client.from(NODE_TABLE[kind]).select("*").eq("id", id),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length !== 1) {
      return controlPlaneFail(
        rows.value.length === 0 ? "NOT_FOUND" : "CATALOG_INTEGRITY_ERROR",
        "Expected exactly one taxonomy node",
        { kind, id, count: rows.value.length },
      );
    }
    return controlPlaneOk(rows.value[0]);
  }

  private async buildPathFromNode(
    start: TaxonomyNodeRef,
  ): Promise<ControlPlaneResult<TaxonomyPath>> {
    const collected: Partial<Record<TaxonomyNodeKind, TaxonomyNodeRef>> = {
      [start.kind]: start,
    };
    let current = start;
    while (current.kind !== "foundation") {
      const raw = await this.loadRawNode(current.kind, current.id);
      if (!raw.ok) {
        return raw.error.code === "NOT_FOUND"
          ? controlPlaneFail(
              "CATALOG_INTEGRITY_ERROR",
              "Taxonomy path is missing a canonical node",
              { kind: current.kind, id: current.id },
            )
          : raw;
      }
      const parentKind = this.parentKind(current.kind);
      const parentId = asString(raw.value[PARENT_FK[current.kind]]);
      if (!parentId) {
        return controlPlaneFail(
          "CATALOG_INTEGRITY_ERROR",
          "Taxonomy parent chain is broken",
          { kind: current.kind, key: current.key },
        );
      }
      const parent = await this.findNodeById(parentKind, parentId);
      if (!parent.ok) {
        return parent.error.code === "NOT_FOUND"
          ? controlPlaneFail(
              "CATALOG_INTEGRITY_ERROR",
              "Taxonomy parent chain is broken",
              { kind: current.kind, key: current.key, parentKind },
            )
          : parent;
      }
      collected[parent.value.kind] = parent.value;
      current = parent.value;
    }
    const foundation = collected.foundation;
    if (!foundation) {
      return controlPlaneFail(
        "CATALOG_INTEGRITY_ERROR",
        "Taxonomy path is missing Foundation",
      );
    }
    return controlPlaneOk({
      foundation,
      industry: collected.industry ?? null,
      niche: collected.niche ?? null,
      specialization: collected.specialization ?? null,
      deepSpecialization: collected.deep_specialization ?? null,
    });
  }
}
