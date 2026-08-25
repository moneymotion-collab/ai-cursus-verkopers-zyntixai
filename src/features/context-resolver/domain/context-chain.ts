/**
 * Pinned Context parent-chain construction.
 * TAX validates ancestry of already-pinned parents. TAX does not select parents.
 */

import type { ContextPackKind, TaxonomyPath } from "@/features/control-plane/domain/types";
import {
  contextResolverFail,
  contextResolverOk,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import {
  CONTEXT_CHAIN_MAX_DEPTH,
  type ContextChainEntry,
  type ResolverContextPack,
  type ResolverContextVersion,
} from "@/features/context-resolver/domain/types";

const KIND_RANK: Readonly<Record<ContextPackKind, number>> = {
  foundation: 1,
  industry: 2,
  niche: 3,
  specialization: 4,
  deep_specialization: 5,
};

export function contextPackKindRank(kind: ContextPackKind): number {
  return KIND_RANK[kind];
}

export function taxonomyPathNodeId(
  path: TaxonomyPath,
  kind: ContextPackKind,
): string | null {
  if (kind === "foundation") {
    return path.foundation.id;
  }
  if (kind === "industry") {
    return path.industry?.id ?? null;
  }
  if (kind === "niche") {
    return path.niche?.id ?? null;
  }
  if (kind === "specialization") {
    return path.specialization?.id ?? null;
  }
  return path.deepSpecialization?.id ?? null;
}

function indexById<T extends { id: string }>(
  rows: readonly T[],
  label: string,
): ContextResolverResult<Map<string, T>> {
  const index = new Map<string, T>();
  for (const row of rows) {
    if (index.has(row.id)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        `Duplicate ${label} identity`,
        { id: row.id },
      );
    }
    index.set(row.id, row);
  }
  return contextResolverOk(index);
}

function assertParentTaxonomyAncestry(input: {
  parent: ResolverContextPack;
  child: ResolverContextPack;
  taxonomyPath: TaxonomyPath;
}): ContextResolverResult<true> {
  if (contextPackKindRank(input.parent.packKind) >= contextPackKindRank(input.child.packKind)) {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Parent Context pack_kind must be less specific than child pack_kind",
      {
        parentPackKey: input.parent.packKey,
        childPackKey: input.child.packKey,
        parentKind: input.parent.packKind,
        childKind: input.child.packKind,
      },
    );
  }
  const ancestorId = taxonomyPathNodeId(input.taxonomyPath, input.parent.packKind);
  if (!ancestorId || ancestorId !== input.parent.target.id) {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Parent Context TAX target is not a canonical ancestor of the child Context",
      {
        parentPackKey: input.parent.packKey,
        childPackKey: input.child.packKey,
        parentTargetId: input.parent.target.id,
      },
    );
  }
  return contextResolverOk(true);
}

export function buildPinnedContextChain(input: {
  leafVersionId: string;
  packs: readonly ResolverContextPack[];
  versions: readonly ResolverContextVersion[];
  taxonomyPath: TaxonomyPath;
}): ContextResolverResult<readonly ContextChainEntry[]> {
  const packs = indexById(input.packs, "Context pack");
  if (!packs.ok) {
    return packs;
  }
  const versions = indexById(input.versions, "Context version");
  if (!versions.ok) {
    return versions;
  }

  const leaf = versions.value.get(input.leafVersionId);
  if (!leaf) {
    return contextResolverFail(
      "CONTEXT_VERSION_NOT_FOUND",
      "Pinned Context version was not supplied",
      { leafVersionId: input.leafVersionId },
    );
  }
  if (leaf.publicationStatus === "draft") {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Draft Context versions cannot be resolved",
      { leafVersionId: leaf.id },
    );
  }
  if (leaf.publicationStatus !== "published" && leaf.publicationStatus !== "superseded") {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      "Pinned Context version has an unsupported publication status",
      { leafVersionId: leaf.id, publicationStatus: leaf.publicationStatus },
    );
  }

  const leafToRoot: ResolverContextVersion[] = [];
  const seenVersionIds = new Set<string>();
  let current: ResolverContextVersion | undefined = leaf;

  while (current) {
    if (seenVersionIds.has(current.id)) {
      return contextResolverFail(
        "PARENT_CONTEXT_CYCLE",
        "Pinned Context parent chain contains a cycle",
        { versionId: current.id },
      );
    }
    if (current.parentVersionId === current.id) {
      return contextResolverFail(
        "PARENT_CONTEXT_CYCLE",
        "Context version cannot parent itself",
        { versionId: current.id },
      );
    }
    seenVersionIds.add(current.id);
    leafToRoot.push(current);
    if (leafToRoot.length > CONTEXT_CHAIN_MAX_DEPTH) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Pinned Context parent chain exceeds maximum depth",
        { maxDepth: CONTEXT_CHAIN_MAX_DEPTH },
      );
    }
    if (!current.parentVersionId) {
      break;
    }
    const parent = versions.value.get(current.parentVersionId);
    if (!parent) {
      return contextResolverFail(
        "PARENT_CONTEXT_NOT_FOUND",
        "Pinned parent_version_id was not supplied",
        { parentVersionId: current.parentVersionId, childVersionId: current.id },
      );
    }
    current = parent;
  }

  const rootToLeafVersions = [...leafToRoot].reverse();
  const chain: ContextChainEntry[] = [];
  const seenPackIds = new Set<string>();

  for (const version of rootToLeafVersions) {
    if (
      version.publicationStatus !== "published" &&
      version.publicationStatus !== "superseded"
    ) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context chain versions must be published or superseded",
        { versionId: version.id, publicationStatus: version.publicationStatus },
      );
    }
    const pack = packs.value.get(version.packId);
    if (!pack) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Context version pack was not supplied",
        { versionId: version.id, packId: version.packId },
      );
    }
    if (seenPackIds.has(pack.id)) {
      return contextResolverFail(
        "CATALOG_INTEGRITY_ERROR",
        "Pinned Context parent chain repeats a Context Pack",
        { packKey: pack.packKey },
      );
    }
    seenPackIds.add(pack.id);
    const previous = chain[chain.length - 1];
    if (previous) {
      const ancestry = assertParentTaxonomyAncestry({
        parent: previous.pack,
        child: pack,
        taxonomyPath: input.taxonomyPath,
      });
      if (!ancestry.ok) {
        return ancestry;
      }
    }
    chain.push({ pack, version });
  }

  return contextResolverOk(chain);
}
