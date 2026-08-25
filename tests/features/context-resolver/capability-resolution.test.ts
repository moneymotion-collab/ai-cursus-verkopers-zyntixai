import { describe, expect, it } from "vitest";
import {
  assertCapabilityDependencyCoherence,
  mergeContextCapabilityMappings,
  relevanceRank,
} from "@/features/context-resolver/domain/capability-resolution";
import type { ContextChainEntry, EffectiveCapability } from "@/features/context-resolver/domain/types";
import {
  CAP_EDGES,
  capabilityDefs,
  capabilityReadiness,
  CORE_KEYS,
  KNOWLEDGE_PACK,
  KNOWLEDGE_V1,
  knowledgeMappings,
  nicheMappings,
  OCB_PACK,
  OCB_V1,
  shuffle,
} from "./fixture";

const CHAIN: readonly ContextChainEntry[] = [
  { pack: KNOWLEDGE_PACK, version: KNOWLEDGE_V1 },
  { pack: OCB_PACK, version: OCB_V1 },
];

function merge(mappings = [...knowledgeMappings(), ...nicheMappings()]) {
  return mergeContextCapabilityMappings({
    chain: CHAIN,
    mappings,
    capabilities: capabilityDefs(),
    capabilityReadiness: capabilityReadiness(),
  });
}

describe("capability mapping merge", () => {
  it("ranks required above recommended above optional without lexical comparison", () => {
    expect(relevanceRank("required")).toBe(3);
    expect(relevanceRank("recommended")).toBe(2);
    expect(relevanceRank("optional")).toBe(1);
    expect(relevanceRank("required")).toBeGreaterThan(relevanceRank("optional"));
  });

  it("seeds Core baseline as required system_baseline and rejects pack SET/REMOVE of Core", () => {
    const result = merge();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const key of CORE_KEYS) {
      const capability = result.value.find((item) => item.capabilityKey === key);
      expect(capability).toMatchObject({
        effectiveRelevance: "required",
        provenance: { sourceKind: "system_baseline", establishedBy: "set" },
      });
    }
    expect(result.value.some((item) => item.capabilityKey === "core.invented")).toBe(false);

    expect(
      merge([
        ...knowledgeMappings(),
        {
          versionId: OCB_V1.id,
          capabilityKey: "core.tasks",
          mappingOp: "set",
          relevance: "required",
        },
      ]),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
    expect(
      merge([
        ...knowledgeMappings(),
        {
          versionId: OCB_V1.id,
          capabilityKey: "core.tasks",
          mappingOp: "remove",
          relevance: null,
        },
      ]),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("fails when a Core CAP definition is missing", () => {
    expect(
      mergeContextCapabilityMappings({
        chain: CHAIN,
        mappings: knowledgeMappings(),
        capabilities: capabilityDefs().filter((item) => item.capabilityKey !== "core.tasks"),
        capabilityReadiness: capabilityReadiness(),
      }),
    ).toMatchObject({ ok: false, error: { code: "CAPABILITY_NOT_FOUND" } });
  });

  it("adds, replaces same/stronger, and fails weaker SET", () => {
    const added = merge(knowledgeMappings());
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.find((item) => item.capabilityKey === "knowledge.progress")).toMatchObject({
      effectiveRelevance: "required",
      provenance: { sourceContextPackKey: "foundation.knowledge" },
    });

    const same = merge([
      ...knowledgeMappings(),
      {
        versionId: OCB_V1.id,
        capabilityKey: "knowledge.progress",
        mappingOp: "set",
        relevance: "required",
      },
    ]);
    expect(same.ok).toBe(true);
    if (!same.ok) return;
    expect(same.value.find((item) => item.capabilityKey === "knowledge.progress")).toMatchObject({
      effectiveRelevance: "required",
      provenance: {
        sourceContextPackKey: "niche.online-course-business",
        overriddenFromPackKey: "foundation.knowledge",
      },
    });

    const stronger = merge([
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "shared.crm.leads",
        mappingOp: "set",
        relevance: "optional",
      },
      {
        versionId: OCB_V1.id,
        capabilityKey: "shared.crm.leads",
        mappingOp: "set",
        relevance: "recommended",
      },
    ]);
    expect(stronger.ok).toBe(true);
    if (!stronger.ok) return;
    expect(stronger.value.find((item) => item.capabilityKey === "shared.crm.leads")).toMatchObject({
      effectiveRelevance: "recommended",
      provenance: {
        sourceContextPackKey: "niche.online-course-business",
        overriddenFromPackKey: "foundation.knowledge",
      },
    });

    expect(
      merge([
        ...knowledgeMappings(),
        {
          versionId: OCB_V1.id,
          capabilityKey: "knowledge.progress",
          mappingOp: "set",
          relevance: "optional",
        },
      ]),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("removes optional and recommended, rejects required REMOVE, and no-ops absent REMOVE", () => {
    const optionalRemove = merge([
      ...knowledgeMappings(),
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "horizontal.social.publishing",
        mappingOp: "set",
        relevance: "optional",
      },
      {
        versionId: OCB_V1.id,
        capabilityKey: "horizontal.social.publishing",
        mappingOp: "remove",
        relevance: null,
      },
    ]);
    expect(optionalRemove.ok).toBe(true);
    if (!optionalRemove.ok) return;
    expect(
      optionalRemove.value.some((item) => item.capabilityKey === "horizontal.social.publishing"),
    ).toBe(false);

    const recommended = merge([
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "shared.crm.leads",
        mappingOp: "set",
        relevance: "recommended",
      },
      {
        versionId: OCB_V1.id,
        capabilityKey: "shared.crm.leads",
        mappingOp: "remove",
        relevance: null,
      },
    ]);
    expect(recommended.ok).toBe(true);
    if (!recommended.ok) return;
    expect(recommended.value.some((item) => item.capabilityKey === "shared.crm.leads")).toBe(false);

    expect(
      merge([
        ...knowledgeMappings(),
        {
          versionId: OCB_V1.id,
          capabilityKey: "knowledge.progress",
          mappingOp: "remove",
          relevance: null,
        },
      ]),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    const absent = merge([
      ...knowledgeMappings(),
      {
        versionId: OCB_V1.id,
        capabilityKey: "shared.crm.leads",
        mappingOp: "remove",
        relevance: null,
      },
    ]);
    expect(absent).toMatchObject({ ok: true });
  });

  it("fails duplicate mappings and ignores input order", () => {
    expect(
      merge([
        ...knowledgeMappings(),
        knowledgeMappings()[0]!,
      ]),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    const left = merge(shuffle([...knowledgeMappings(), ...nicheMappings()], 7));
    const right = merge(shuffle([...knowledgeMappings(), ...nicheMappings()], 99));
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect(left.value).toEqual(right.value);
  });

  it("includes deprecated and superseded capabilities, rejects draft, and does not follow a successor", () => {
    const deprecated = mergeContextCapabilityMappings({
      chain: CHAIN,
      mappings: knowledgeMappings(),
      capabilities: capabilityDefs().map((item) =>
        item.capabilityKey === "knowledge.progress"
          ? { ...item, lifecycleStatus: "deprecated" }
          : item,
      ),
      capabilityReadiness: capabilityReadiness(),
    });
    expect(deprecated.ok).toBe(true);
    if (!deprecated.ok) return;
    expect(deprecated.value.find((item) => item.capabilityKey === "knowledge.progress")).toMatchObject({
      lifecycleStatus: "deprecated",
    });
    expect(deprecated.value.some((item) => item.capabilityKey === "knowledge.progress.v2")).toBe(
      false,
    );

    const superseded = mergeContextCapabilityMappings({
      chain: CHAIN,
      mappings: knowledgeMappings(),
      capabilities: capabilityDefs().map((item) =>
        item.capabilityKey === "knowledge.programs"
          ? { ...item, lifecycleStatus: "superseded" }
          : item,
      ),
      capabilityReadiness: capabilityReadiness(),
    });
    expect(superseded.ok).toBe(true);
    if (!superseded.ok) return;
    expect(superseded.value.find((item) => item.capabilityKey === "knowledge.programs")).toMatchObject({
      lifecycleStatus: "superseded",
    });

    expect(
      mergeContextCapabilityMappings({
        chain: CHAIN,
        mappings: knowledgeMappings(),
        capabilities: capabilityDefs().map((item) =>
          item.capabilityKey === "shared.crm.customers"
            ? { ...item, lifecycleStatus: "draft" }
            : item,
        ),
        capabilityReadiness: capabilityReadiness(),
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });
});

describe("capability dependency coherence", () => {
  function effective(
    entries: Array<[string, EffectiveCapability["effectiveRelevance"]]>,
  ): EffectiveCapability[] {
    return entries.map(([capabilityKey, effectiveRelevance]) => ({
      capabilityKey,
      effectiveRelevance,
      provenance: {
        sourceKind: "context_mapping",
        sourceContextPackKey: "foundation.knowledge",
        sourceVersionNumber: 1,
        establishedBy: "set",
      },
      lifecycleStatus: "active",
      readinessStatus: "context_ready",
    }));
  }

  it("passes when direct and transitive deps are present", () => {
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["knowledge.progress", "required"],
          ["knowledge.enrollments", "required"],
          ["knowledge.programs", "required"],
          ["shared.crm.customers", "required"],
        ]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: true });
  });

  it("fails missing direct or transitive deps without inserting them", () => {
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([["knowledge.enrollments", "required"]]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["knowledge.progress", "required"],
          ["knowledge.enrollments", "required"],
        ]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("requires required deps for required capabilities and only presence for optional/recommended", () => {
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["knowledge.progress", "required"],
          ["knowledge.enrollments", "recommended"],
          ["knowledge.programs", "required"],
          ["shared.crm.customers", "required"],
        ]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });

    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["horizontal.social.publishing", "optional"],
          ["horizontal.social.connection", "optional"],
          ["horizontal.social.content", "optional"],
        ]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: true });

    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["horizontal.social.publishing", "recommended"],
          ["horizontal.social.connection", "optional"],
          ["horizontal.social.content", "optional"],
        ]),
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: true });
  });

  it("fails REMOVE-vs-requires when a dependent remains", () => {
    const merged = merge([
      ...knowledgeMappings(),
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "horizontal.social.publishing",
        mappingOp: "set",
        relevance: "optional",
      },
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "horizontal.social.connection",
        mappingOp: "set",
        relevance: "optional",
      },
      {
        versionId: KNOWLEDGE_V1.id,
        capabilityKey: "horizontal.social.content",
        mappingOp: "set",
        relevance: "optional",
      },
      {
        versionId: OCB_V1.id,
        capabilityKey: "horizontal.social.content",
        mappingOp: "remove",
        relevance: null,
      },
    ]);
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: merged.value,
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
    expect(merged.value.some((item) => item.capabilityKey === "horizontal.social.content")).toBe(
      false,
    );
    expect(merged.value.some((item) => item.capabilityKey === "horizontal.social.publishing")).toBe(
      true,
    );
  });

  it("fails a dependency cycle", () => {
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: effective([
          ["alpha.one", "optional"],
          ["alpha.two", "optional"],
        ]),
        dependencies: [
          { capabilityKey: "alpha.one", dependsOnCapabilityKey: "alpha.two" },
          { capabilityKey: "alpha.two", dependsOnCapabilityKey: "alpha.one" },
        ],
      }),
    ).toMatchObject({ ok: false, error: { code: "CAPABILITY_DEPENDENCY_CYCLE" } });
  });
});
