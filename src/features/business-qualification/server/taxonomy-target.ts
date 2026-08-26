import "server-only";

import type { TaxonomyNodeKind } from "@/features/control-plane/domain/types";
import { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";
import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type { TaxonomyTargetKind } from "@/features/business-qualification/domain/types";
import { isBqaUuid, TAXONOMY_TARGET_KINDS } from "@/features/business-qualification/domain/classification";

export type ResolvedBqaTaxonomyTarget = {
  kind: TaxonomyTargetKind;
  id: string;
  key: string;
  releaseId: string;
};

export type BqaTaxonomyResolver = {
  resolveActiveRelease(): Promise<BqaResult<{ releaseId: string }>>;
  resolveActiveTarget(input: {
    taxonomyTargetId: string;
    claimedKind?: string | null;
  }): Promise<BqaResult<ResolvedBqaTaxonomyTarget>>;
};

export function createBqaTaxonomyResolver(
  taxonomy: TaxonomyRepository,
): BqaTaxonomyResolver {
  return {
    async resolveActiveRelease() {
      const release = await taxonomy.findActiveRelease();
      if (!release.ok) {
        if (release.error.code === "DATABASE_READ_ERROR") {
          return bqaFail("DATABASE_READ_ERROR", release.error.message);
        }
        return bqaFail("CATALOG_INTEGRITY_ERROR", release.error.message);
      }
      return bqaOk({ releaseId: release.value.id });
    },
    async resolveActiveTarget(input) {
      if (!isBqaUuid(input.taxonomyTargetId)) {
        return bqaFail(
          "CLASSIFICATION_TARGET_NOT_FOUND",
          "TAX target was not found",
        );
      }
      const kindsToTry: TaxonomyNodeKind[] = input.claimedKind &&
        TAXONOMY_TARGET_KINDS.includes(input.claimedKind as TaxonomyTargetKind)
        ? [
            input.claimedKind as TaxonomyNodeKind,
            ...TAXONOMY_TARGET_KINDS.filter((kind) => kind !== input.claimedKind),
          ]
        : [...TAXONOMY_TARGET_KINDS];

      let resolved: {
        kind: TaxonomyTargetKind;
        id: string;
        key: string;
        lifecycleStatus: string;
      } | null = null;
      for (const kind of kindsToTry) {
        const node = await taxonomy.getNodeById(kind, input.taxonomyTargetId);
        if (!node.ok) {
          if (node.error.code === "CATALOG_INTEGRITY_ERROR") {
            return bqaFail("CATALOG_INTEGRITY_ERROR", node.error.message);
          }
          if (node.error.code === "DATABASE_READ_ERROR") {
            return bqaFail("DATABASE_READ_ERROR", node.error.message);
          }
          continue;
        }
        if (resolved && resolved.kind !== node.value.kind) {
          return bqaFail(
            "CATALOG_INTEGRITY_ERROR",
            "TAX target resolved to multiple kinds",
          );
        }
        resolved = {
          kind: node.value.kind,
          id: node.value.id,
          key: node.value.key,
          lifecycleStatus: node.value.lifecycleStatus,
        };
      }
      if (!resolved) {
        return bqaFail("CLASSIFICATION_TARGET_NOT_FOUND", "TAX target was not found");
      }
      if (resolved.lifecycleStatus !== "active") {
        return bqaFail(
          "CLASSIFICATION_TARGET_INVALID",
          "TAX target is not an active catalog node",
        );
      }
      const release = await taxonomy.findActiveRelease();
      if (!release.ok) {
        if (release.error.code === "DATABASE_READ_ERROR") {
          return bqaFail("DATABASE_READ_ERROR", release.error.message);
        }
        return bqaFail("CATALOG_INTEGRITY_ERROR", release.error.message);
      }
      return bqaOk({
        kind: resolved.kind,
        id: resolved.id,
        key: resolved.key,
        releaseId: release.value.id,
      });
    },
  };
}
