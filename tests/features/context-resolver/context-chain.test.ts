import { describe, expect, it } from "vitest";
import { buildPinnedContextChain } from "@/features/context-resolver/domain/context-chain";
import { CONTEXT_CHAIN_MAX_DEPTH } from "@/features/context-resolver/domain/types";
import {
  EDUCATION_NODE,
  KNOWLEDGE_PACK,
  KNOWLEDGE_V1,
  OCB_PACK,
  OCB_PATH,
  OCB_V1,
  PRODUCT_OPS_NODE,
  taxNode,
} from "./fixture";

const INDUSTRY_PACK = {
  id: "pack-edu",
  packKey: "industry.education-and-learning",
  packKind: "industry" as const,
  defaultLocale: "en",
  target: { kind: "industry" as const, id: EDUCATION_NODE.id },
  targetKey: EDUCATION_NODE.key,
};

const INDUSTRY_V1 = {
  id: "ver-edu-1",
  packId: INDUSTRY_PACK.id,
  versionNumber: 1,
  publicationStatus: "published" as const,
  parentVersionId: KNOWLEDGE_V1.id,
};

const SPEC_NODE = taxNode("specialization", "cohort-delivery");
const SPEC_PACK = {
  id: "pack-spec",
  packKey: "specialization.cohort-delivery",
  packKind: "specialization" as const,
  defaultLocale: "en",
  target: { kind: "specialization" as const, id: SPEC_NODE.id },
  targetKey: SPEC_NODE.key,
};
const SPEC_V1 = {
  id: "ver-spec-1",
  packId: SPEC_PACK.id,
  versionNumber: 1,
  publicationStatus: "published" as const,
  parentVersionId: OCB_V1.id,
};

describe("buildPinnedContextChain", () => {
  it("builds a root-only Foundation chain", () => {
    const result = buildPinnedContextChain({
      leafVersionId: KNOWLEDGE_V1.id,
      packs: [KNOWLEDGE_PACK],
      versions: [KNOWLEDGE_V1],
      taxonomyPath: OCB_PATH,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((entry) => entry.pack.packKey)).toEqual(["foundation.knowledge"]);
  });

  it("builds Foundation → Niche from explicit parent_version_id", () => {
    const extraLatest = {
      ...OCB_V1,
      id: "ver-ocb-99",
      versionNumber: 99,
      parentVersionId: KNOWLEDGE_V1.id,
    };
    const result = buildPinnedContextChain({
      leafVersionId: OCB_V1.id,
      packs: [KNOWLEDGE_PACK, OCB_PACK],
      versions: [OCB_V1, extraLatest, KNOWLEDGE_V1],
      taxonomyPath: OCB_PATH,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((entry) => `${entry.pack.packKey}@${entry.version.versionNumber}`)).toEqual(
      ["foundation.knowledge@1", "niche.online-course-business@1"],
    );
  });

  it("allows Foundation → Industry → Niche and Niche → Specialization", () => {
    const ocbViaIndustry = { ...OCB_V1, parentVersionId: INDUSTRY_V1.id };
    const three = buildPinnedContextChain({
      leafVersionId: ocbViaIndustry.id,
      packs: [KNOWLEDGE_PACK, INDUSTRY_PACK, OCB_PACK],
      versions: [KNOWLEDGE_V1, INDUSTRY_V1, ocbViaIndustry],
      taxonomyPath: OCB_PATH,
    });
    expect(three.ok).toBe(true);
    if (!three.ok) return;
    expect(three.value.map((entry) => entry.pack.packKind)).toEqual([
      "foundation",
      "industry",
      "niche",
    ]);

    const specPath = {
      ...OCB_PATH,
      specialization: SPEC_NODE,
    };
    const spec = buildPinnedContextChain({
      leafVersionId: SPEC_V1.id,
      packs: [KNOWLEDGE_PACK, OCB_PACK, SPEC_PACK],
      versions: [KNOWLEDGE_V1, OCB_V1, SPEC_V1],
      taxonomyPath: specPath,
    });
    expect(spec.ok).toBe(true);
    if (!spec.ok) return;
    expect(spec.value.map((entry) => entry.pack.packKind)).toEqual([
      "foundation",
      "niche",
      "specialization",
    ]);
  });

  it("allows skipping Industry when TAX ancestry is still valid", () => {
    const result = buildPinnedContextChain({
      leafVersionId: OCB_V1.id,
      packs: [KNOWLEDGE_PACK, OCB_PACK],
      versions: [KNOWLEDGE_V1, OCB_V1],
      taxonomyPath: OCB_PATH,
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("fails missing parent, self-parent, cycle, depth, duplicate pack, and kind regression", () => {
    expect(
      buildPinnedContextChain({
        leafVersionId: OCB_V1.id,
        packs: [OCB_PACK],
        versions: [OCB_V1],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "PARENT_CONTEXT_NOT_FOUND" } });

    const selfParent = { ...KNOWLEDGE_V1, parentVersionId: KNOWLEDGE_V1.id };
    expect(
      buildPinnedContextChain({
        leafVersionId: selfParent.id,
        packs: [KNOWLEDGE_PACK],
        versions: [selfParent],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "PARENT_CONTEXT_CYCLE" } });

    const a = { ...KNOWLEDGE_V1, id: "ver-a", parentVersionId: "ver-b" };
    const b = { ...KNOWLEDGE_V1, id: "ver-b", packId: OCB_PACK.id, parentVersionId: "ver-a" };
    expect(
      buildPinnedContextChain({
        leafVersionId: "ver-a",
        packs: [KNOWLEDGE_PACK, OCB_PACK],
        versions: [a, b],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "PARENT_CONTEXT_CYCLE" } });

    const versions = Array.from({ length: CONTEXT_CHAIN_MAX_DEPTH + 1 }, (_, index) => ({
      id: `ver-d${index}`,
      packId: `pack-d${index}`,
      versionNumber: 1,
      publicationStatus: "published" as const,
      parentVersionId: index === 0 ? null : `ver-d${index - 1}`,
    }));
    const packs = versions.map((version, index) => ({
      id: version.packId,
      packKey: `foundation.depth-${index}`,
      packKind: "foundation" as const,
      defaultLocale: "en",
      target: { kind: "foundation" as const, id: KNOWLEDGE_NODE_ID(index) },
      targetKey: "knowledge",
    }));
    expect(
      buildPinnedContextChain({
        leafVersionId: versions[versions.length - 1]?.id ?? "",
        packs,
        versions,
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    const twin = { ...OCB_V1, id: "ver-ocb-twin", packId: KNOWLEDGE_PACK.id, parentVersionId: KNOWLEDGE_V1.id };
    expect(
      buildPinnedContextChain({
        leafVersionId: twin.id,
        packs: [KNOWLEDGE_PACK],
        versions: [KNOWLEDGE_V1, twin],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    const industryRoot = { ...INDUSTRY_V1, parentVersionId: null };
    const foundationChild = {
      ...KNOWLEDGE_V1,
      id: "ver-inverted",
      parentVersionId: industryRoot.id,
    };
    expect(
      buildPinnedContextChain({
        leafVersionId: foundationChild.id,
        packs: [KNOWLEDGE_PACK, INDUSTRY_PACK],
        versions: [industryRoot, foundationChild],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("fails when parent TAX target is not an ancestor even if kind rank is valid", () => {
    const productOpsPack = {
      ...KNOWLEDGE_PACK,
      id: "pack-product-ops",
      packKey: "foundation.product-operations",
      target: { kind: "foundation" as const, id: PRODUCT_OPS_NODE.id },
      targetKey: PRODUCT_OPS_NODE.key,
    };
    const productOpsVersion = {
      ...KNOWLEDGE_V1,
      id: "ver-product-ops-1",
      packId: productOpsPack.id,
    };
    const child = { ...OCB_V1, parentVersionId: productOpsVersion.id };
    expect(
      buildPinnedContextChain({
        leafVersionId: child.id,
        packs: [productOpsPack, OCB_PACK],
        versions: [productOpsVersion, child],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("allows a superseded pinned leaf and rejects a draft leaf", () => {
    const superseded = { ...OCB_V1, publicationStatus: "superseded" as const };
    expect(
      buildPinnedContextChain({
        leafVersionId: superseded.id,
        packs: [KNOWLEDGE_PACK, OCB_PACK],
        versions: [KNOWLEDGE_V1, superseded],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: true });
    const draft = { ...OCB_V1, publicationStatus: "draft" as const };
    expect(
      buildPinnedContextChain({
        leafVersionId: draft.id,
        packs: [KNOWLEDGE_PACK, OCB_PACK],
        versions: [KNOWLEDGE_V1, draft],
        taxonomyPath: OCB_PATH,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });
});

function KNOWLEDGE_NODE_ID(index: number): string {
  return index === 0 ? "tax-knowledge" : `tax-knowledge-${index}`;
}
