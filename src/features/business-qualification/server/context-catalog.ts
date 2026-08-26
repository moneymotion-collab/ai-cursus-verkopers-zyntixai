import "server-only";

import type { ContextRepository } from "@/features/control-plane/server/context.repository";
import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type { ContextReadinessStatus, TaxonomyTargetKind } from "@/features/business-qualification/domain/types";
import type { CatalogPackRef, CatalogVersionRef } from "@/features/business-qualification/domain/support";
import { isBqaUuid } from "@/features/business-qualification/domain/classification";

export type BqaContextCatalog = {
  findExactPack(
    kind: TaxonomyTargetKind,
    targetId: string,
  ): Promise<BqaResult<CatalogPackRef | null>>;
  listVersions(packId: string): Promise<BqaResult<CatalogVersionRef[]>>;
  getReadiness(versionId: string): Promise<BqaResult<ContextReadinessStatus>>;
  getVersion(versionId: string): Promise<BqaResult<CatalogVersionRef>>;
};

function mapControlPlaneError(code: string, message: string): BqaResult<never> {
  if (code === "DATABASE_READ_ERROR") {
    return bqaFail("DATABASE_READ_ERROR", message);
  }
  return bqaFail("CATALOG_INTEGRITY_ERROR", message);
}

export function createBqaContextCatalog(context: ContextRepository): BqaContextCatalog {
  return {
    async findExactPack(kind, targetId) {
      if (!isBqaUuid(targetId)) {
        return bqaFail("CATALOG_INTEGRITY_ERROR", "TAX target id is invalid");
      }
      const pack = await context.findPackForExactTaxonomyTarget({ kind, id: targetId });
      if (!pack.ok) {
        if (pack.error.code === "NOT_FOUND") {
          return bqaOk(null);
        }
        return mapControlPlaneError(pack.error.code, pack.error.message);
      }
      if (pack.value.target.id !== targetId || pack.value.packKind !== kind) {
        return bqaFail(
          "CATALOG_INTEGRITY_ERROR",
          "Context pack taxonomy target does not match the confirmed TAX target",
        );
      }
      return bqaOk({
        id: pack.value.id,
        packKey: pack.value.packKey,
        targetId: pack.value.target.id,
      });
    },
    async listVersions(packId) {
      const versions = await context.listVersionsForPackId(packId);
      if (!versions.ok) {
        return mapControlPlaneError(versions.error.code, versions.error.message);
      }
      return bqaOk(
        versions.value.map((version) => ({
          id: version.id,
          packId: version.packId,
          versionNumber: version.versionNumber,
          publicationStatus: version.publicationStatus,
        })),
      );
    },
    async getReadiness(versionId) {
      const readiness = await context.getPackReadiness(versionId);
      if (!readiness.ok) {
        if (readiness.error.code === "NOT_FOUND") {
          return bqaFail(
            "CATALOG_INTEGRITY_ERROR",
            "Context pack readiness is missing for the observed version",
          );
        }
        return mapControlPlaneError(readiness.error.code, readiness.error.message);
      }
      return bqaOk(readiness.value.readinessStatus);
    },
    async getVersion(versionId) {
      const version = await context.getVersionById(versionId);
      if (!version.ok) {
        if (version.error.code === "NOT_FOUND") {
          return bqaFail("CATALOG_INTEGRITY_ERROR", "Pinned Context version was not found");
        }
        return mapControlPlaneError(version.error.code, version.error.message);
      }
      return bqaOk({
        id: version.value.id,
        packId: version.value.packId,
        versionNumber: version.value.versionNumber,
        publicationStatus: version.value.publicationStatus,
      });
    },
  };
}
