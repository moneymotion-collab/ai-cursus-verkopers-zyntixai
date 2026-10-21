import { describe, expect, it } from "vitest";
import { resolveEffectiveContext } from "@/features/context-resolver/domain/context-resolution";
import {
  CORE_KEYS,
  KNOWLEDGE_NODE,
  KNOWLEDGE_PACK,
  KNOWLEDGE_REQUIRED,
  KNOWLEDGE_V1,
  NICHE_MAPPINGS,
  OCB_NODE,
  OCB_V1,
  qaSemanticInput,
  shuffle,
  taxNode,
} from "./fixture";

describe("resolveEffectiveContext classification and pin", () => {
  it("accepts exact Activity Niche ↔ leaf Niche and exact Foundation ↔ Foundation", () => {
    const niche = resolveEffectiveContext(qaSemanticInput());
    expect(niche.ok).toBe(true);
    if (!niche.ok) return;
    expect(niche.value.businessActivity.classification).toEqual({
      kind: "niche",
      targetId: OCB_NODE.id,
      targetKey: OCB_NODE.key,
    });
    expect(niche.value.context.packKey).toBe("niche.online-course-business");

    const foundation = resolveEffectiveContext(
      qaSemanticInput({
        leafVersionId: KNOWLEDGE_V1.id,
        packs: [KNOWLEDGE_PACK],
        versions: [KNOWLEDGE_V1],
        mappings: qaSemanticInput().mappings.filter(
          (mapping) => mapping.versionId === KNOWLEDGE_V1.id,
        ),
        activity: {
          ...qaSemanticInput().activity,
          classification: {
            kind: "foundation",
            targetId: KNOWLEDGE_NODE.id,
            targetKey: KNOWLEDGE_NODE.key,
          },
        },
      }),
    );
    expect(foundation.ok).toBe(true);
    if (!foundation.ok) return;
    expect(foundation.value.context.packKey).toBe("foundation.knowledge");
  });

  it("rejects Niche X ↔ Niche Y and Niche ↔ ancestor Foundation with no ancestor fallback", () => {
    const otherNiche = taxNode("niche", "coaching-practice");
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          activity: {
            ...qaSemanticInput().activity,
            classification: {
              kind: "niche",
              targetId: otherNiche.id,
              targetKey: otherNiche.key,
            },
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_TAXONOMY_MISMATCH" } });

    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          leafVersionId: KNOWLEDGE_V1.id,
          packs: [KNOWLEDGE_PACK],
          versions: [KNOWLEDGE_V1],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_TAXONOMY_MISMATCH" } });
  });

  it("rejects unclassified, archived, and draft Activities", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          activity: { ...qaSemanticInput().activity, classification: null },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "ACTIVITY_UNCLASSIFIED" } });
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          activity: { ...qaSemanticInput().activity, status: "archived" },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          activity: { ...qaSemanticInput().activity, status: "draft" },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });
});

describe("resolveEffectiveContext readiness", () => {
  it("allows internal_qa for context_ready, beta_supported, and production_verified", () => {
    for (const readinessStatus of [
      "context_ready",
      "beta_supported",
      "production_verified",
    ] as const) {
      const result = resolveEffectiveContext(
        qaSemanticInput({
          contextReadiness: [
            { versionId: KNOWLEDGE_V1.id, readinessStatus: "planned" },
            { versionId: OCB_V1.id, readinessStatus },
          ],
        }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.context.readinessStatus).toBe(readinessStatus);
    }
  });

  it("rejects planned or missing leaf readiness and frozen beta/production policies", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          contextReadiness: [
            { versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" },
            { versionId: OCB_V1.id, readinessStatus: "planned" },
          ],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });

    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          contextReadiness: [{ versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" }],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });

    expect(
      resolveEffectiveContext(qaSemanticInput({ mode: "beta" })),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });

    const beta = resolveEffectiveContext(
      qaSemanticInput({
        mode: "beta",
        contextReadiness: [
          { versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" },
          { versionId: OCB_V1.id, readinessStatus: "beta_supported" },
        ],
      }),
    );
    expect(beta.ok).toBe(true);

    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          mode: "production",
          contextReadiness: [
            { versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" },
            { versionId: OCB_V1.id, readinessStatus: "beta_supported" },
          ],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });

    const production = resolveEffectiveContext(
      qaSemanticInput({
        mode: "production",
        contextReadiness: [
          { versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" },
          { versionId: OCB_V1.id, readinessStatus: "production_verified" },
        ],
      }),
    );
    expect(production.ok).toBe(true);
  });
});

describe("QA semantic fixture", () => {
  it("resolves Knowledge → Online Course Business with Core, inherited mappings, Social relevance, and terminology", () => {
    const result = resolveEffectiveContext(qaSemanticInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.organization.id).toBe("org-qa");
    expect(result.value.context.ancestry.map((entry) => entry.packKey)).toEqual([
      "foundation.knowledge",
      "niche.online-course-business",
    ]);
    expect(result.value.context.publicationStatus).toBe("published");
    expect(result.value.context.readinessStatus).toBe("context_ready");
    expect(result.value.resolution).toEqual({
      mode: "internal_qa",
      requestedLocale: "en",
      resolvedLocale: "en",
      fallbackUsed: false,
    });

    const byKey = Object.fromEntries(
      result.value.relevantCapabilities.map((item) => [item.capabilityKey, item]),
    );
    for (const key of CORE_KEYS) {
      expect(byKey[key]).toMatchObject({
        effectiveRelevance: "required",
        provenance: { sourceKind: "system_baseline", sourceContextPackKey: null },
      });
    }
    for (const key of KNOWLEDGE_REQUIRED) {
      expect(byKey[key]).toMatchObject({
        effectiveRelevance: "required",
        provenance: { sourceKind: "context_mapping", sourceContextPackKey: "foundation.knowledge" },
      });
    }
    for (const [key, relevance] of NICHE_MAPPINGS) {
      expect(byKey[key]).toMatchObject({
        effectiveRelevance: relevance,
        provenance: {
          sourceKind: "context_mapping",
          sourceContextPackKey: "niche.online-course-business",
        },
      });
    }
    expect(
      result.value.relevantCapabilities
        .filter((item) => item.capabilityKey.startsWith("horizontal.social."))
        .every((item) => item.effectiveRelevance === "optional"),
    ).toBe(true);
    expect(result.value).not.toHaveProperty("permissions");
    expect(result.value).not.toHaveProperty("entitlements");
    expect(result.value).not.toHaveProperty("enabledCapabilities");

    expect(result.value.terminology.map((term) => term.termKey)).toEqual([
      "customer",
      "enrollment",
      "program",
      "progress",
    ]);
    expect(
      result.value.relevantCapabilities.map((item) => item.capabilityKey),
    ).toEqual(
      [...result.value.relevantCapabilities.map((item) => item.capabilityKey)].sort((left, right) =>
        left.localeCompare(right),
      ),
    );

    // Observed from this canonical fixture; not a frozen architecture constant.
    expect(result.value.relevantCapabilities).toHaveLength(
      CORE_KEYS.length + KNOWLEDGE_REQUIRED.length + NICHE_MAPPINGS.length,
    );
  });

  it("fails closed when a child REMOVE leaves a remaining dependent", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          mappings: [
            ...qaSemanticInput().mappings.filter(
              (mapping) => mapping.capabilityKey !== "horizontal.social.content",
            ),
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
          ],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("is deterministic across shuffled catalog arrays and extra unused versions", () => {
    const extraLatest = {
      ...OCB_V1,
      id: "ver-ocb-99",
      versionNumber: 99,
      parentVersionId: KNOWLEDGE_V1.id,
    };
    const base = qaSemanticInput();
    const left = resolveEffectiveContext(
      qaSemanticInput({
        packs: shuffle(base.packs, 11),
        versions: shuffle([...base.versions, extraLatest], 12),
        mappings: shuffle(base.mappings, 13),
        terminology: shuffle(base.terminology, 14),
        capabilities: shuffle(base.capabilities, 15),
        dependencies: shuffle(base.dependencies, 16),
        capabilityReadiness: shuffle(base.capabilityReadiness, 17),
        contextReadiness: shuffle(base.contextReadiness, 18),
      }),
    );
    const right = resolveEffectiveContext(
      qaSemanticInput({
        packs: shuffle(base.packs, 91),
        versions: shuffle([...base.versions, extraLatest], 92),
        mappings: shuffle(base.mappings, 93),
        terminology: shuffle(base.terminology, 94),
        capabilities: shuffle(base.capabilities, 95),
        dependencies: shuffle(base.dependencies, 96),
        capabilityReadiness: shuffle(base.capabilityReadiness, 97),
        contextReadiness: shuffle(base.contextReadiness, 98),
      }),
    );
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect(left.value).toEqual(right.value);
    expect(left.value.context.versionNumber).toBe(1);
    expect(left.value.context.packKey).toBe("niche.online-course-business");
  });
});
