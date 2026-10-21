import "server-only";

import type {
  ContextPackKind,
  ContextPublicationStatus,
  ContextReadinessStatus,
  TaxonomyNodeKind,
  TaxonomyNodeRef,
} from "@/features/control-plane/domain/types";
import { ContextRepository } from "@/features/control-plane/server/context.repository";
import { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";
import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import { isTaxonomyClassificationKind } from "@/features/org-context/domain/validation";

export type OrgContextCatalogPin = {
  versionId: string;
  publicationStatus: ContextPublicationStatus;
  packKind: ContextPackKind;
  targetId: string;
  readinessStatus: ContextReadinessStatus;
};

export class OrgContextCatalogReader {
  constructor(
    private readonly taxonomy: TaxonomyRepository,
    private readonly context: ContextRepository,
  ) {}

  async getTaxonomyNode(
    kind: TaxonomyNodeKind,
    id: string,
  ): Promise<OrgContextResult<TaxonomyNodeRef>> {
    const node = await this.taxonomy.getNodeById(kind, id);
    if (!node.ok) {
      if (node.error.code === "NOT_FOUND") {
        return orgContextFail(
          "CLASSIFICATION_NOT_FOUND",
          "TAX classification target not found",
          { kind, id },
        );
      }
      if (node.error.code === "DATABASE_READ_ERROR") {
        return orgContextFail("DATABASE_READ_ERROR", node.error.message);
      }
      return orgContextFail("CATALOG_INTEGRITY_ERROR", node.error.message);
    }
    return orgContextOk(node.value);
  }

  async getAssignableContextVersion(
    versionId: string,
  ): Promise<OrgContextResult<OrgContextCatalogPin>> {
    const bundle = await this.context.loadContextVersionBundle(versionId);
    if (!bundle.ok) {
      if (bundle.error.code === "NOT_FOUND") {
        return orgContextFail(
          "CONTEXT_NOT_AVAILABLE",
          "Context pack version not found",
          { versionId },
        );
      }
      if (bundle.error.code === "DATABASE_READ_ERROR") {
        return orgContextFail("DATABASE_READ_ERROR", bundle.error.message);
      }
      return orgContextFail("CATALOG_INTEGRITY_ERROR", bundle.error.message);
    }
    if (!isTaxonomyClassificationKind(bundle.value.pack.packKind)) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context pack kind is not a TAX classification kind",
      );
    }
    return orgContextOk({
      versionId: bundle.value.version.id,
      publicationStatus: bundle.value.version.publicationStatus,
      packKind: bundle.value.pack.packKind,
      targetId: bundle.value.pack.target.id,
      readinessStatus: bundle.value.readiness.readinessStatus,
    });
  }
}
