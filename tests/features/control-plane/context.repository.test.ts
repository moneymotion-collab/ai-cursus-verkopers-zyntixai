import { describe, expect, it } from "vitest";
import { ContextRepository } from "@/features/control-plane/server/context.repository";
import { createControlPlaneMemoryClient } from "./memory-query-client";

const FOUNDATION_TAX_ID = "tax-foundation-knowledge";
const NICHE_TAX_ID = "tax-niche-ocb";
const KNOWLEDGE_PACK_ID = "pack-knowledge";
const NICHE_PACK_ID = "pack-ocb";
const KNOWLEDGE_VERSION_ID = "ver-knowledge-1";
const NICHE_VERSION_ID = "ver-ocb-1";
const SUPERSEDED_VERSION_ID = "ver-ocb-superseded";

const FOUNDATION_CAPS = [
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
];
const NICHE_CAPS = [
  "shared.crm.leads",
  "horizontal.social.connection",
  "horizontal.social.content",
  "horizontal.social.approval",
  "horizontal.social.scheduling",
  "horizontal.social.publishing",
];

function cap(key: string) {
  return {
    id: `cap-${key}`,
    capability_key: key,
    label: key,
    description: key,
    owner_class: "core",
    owner_key: "platform",
    foundation_id: null,
    lifecycle_status: "active",
    catalog_visibility: "listed",
    superseded_by_capability_id: null,
  };
}

function mapping(versionId: string, key: string, relevance: string) {
  return {
    version_id: versionId,
    capability_id: `cap-${key}`,
    mapping_op: "set",
    relevance,
  };
}

function catalog() {
  return createControlPlaneMemoryClient({
    taxonomy_foundations: [
      {
        id: FOUNDATION_TAX_ID,
        key: "knowledge",
        label: "Knowledge",
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_niches: [
      {
        id: NICHE_TAX_ID,
        key: "online-course-business",
        label: "Online Course Business",
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    capabilities: [...FOUNDATION_CAPS, ...NICHE_CAPS].map(cap),
    context_packs: [
      {
        id: KNOWLEDGE_PACK_ID,
        pack_key: "foundation.knowledge",
        label: "Knowledge",
        pack_kind: "foundation",
        default_locale: "en",
        lifecycle_status: "active",
        foundation_id: FOUNDATION_TAX_ID,
        industry_id: null,
        niche_id: null,
        specialization_id: null,
        deep_specialization_id: null,
      },
      {
        id: NICHE_PACK_ID,
        pack_key: "niche.online-course-business",
        label: "Online Course Business",
        pack_kind: "niche",
        default_locale: "en",
        lifecycle_status: "active",
        foundation_id: null,
        industry_id: null,
        niche_id: NICHE_TAX_ID,
        specialization_id: null,
        deep_specialization_id: null,
      },
    ],
    context_pack_versions: [
      {
        id: KNOWLEDGE_VERSION_ID,
        pack_id: KNOWLEDGE_PACK_ID,
        version_number: 1,
        publication_status: "published",
        completeness: "full",
        parent_version_id: null,
        change_impact: "low",
        impact_note: null,
        definition_summary: "Knowledge Foundation v1",
        intended_operator: "operator",
        primary_exchange: "exchange",
      },
      {
        id: NICHE_VERSION_ID,
        pack_id: NICHE_PACK_ID,
        version_number: 1,
        publication_status: "published",
        completeness: "full",
        parent_version_id: KNOWLEDGE_VERSION_ID,
        change_impact: "medium",
        impact_note: null,
        definition_summary: "Online Course Business Niche v1",
        intended_operator: "operator",
        primary_exchange: "exchange",
      },
      {
        id: SUPERSEDED_VERSION_ID,
        pack_id: NICHE_PACK_ID,
        version_number: 2,
        publication_status: "superseded",
        completeness: "full",
        parent_version_id: KNOWLEDGE_VERSION_ID,
        change_impact: "low",
        impact_note: null,
        definition_summary: "Superseded snapshot",
        intended_operator: null,
        primary_exchange: null,
      },
    ],
    context_capability_mappings: [
      ...FOUNDATION_CAPS.map((key) => mapping(KNOWLEDGE_VERSION_ID, key, "required")),
      mapping(NICHE_VERSION_ID, "shared.crm.leads", "recommended"),
      ...NICHE_CAPS.slice(1).map((key) => mapping(NICHE_VERSION_ID, key, "optional")),
    ],
    context_terminology: [
      {
        version_id: KNOWLEDGE_VERSION_ID,
        locale: "en",
        term_key: "customer",
        singular_label: "Customer",
        plural_label: "Customers",
        short_label: null,
        help_text: null,
      },
      {
        version_id: KNOWLEDGE_VERSION_ID,
        locale: "en",
        term_key: "program",
        singular_label: "Program",
        plural_label: "Programs",
        short_label: null,
        help_text: null,
      },
      {
        version_id: KNOWLEDGE_VERSION_ID,
        locale: "en",
        term_key: "enrollment",
        singular_label: "Enrollment",
        plural_label: "Enrollments",
        short_label: null,
        help_text: null,
      },
      {
        version_id: KNOWLEDGE_VERSION_ID,
        locale: "en",
        term_key: "progress",
        singular_label: "Progress",
        plural_label: "Progress",
        short_label: null,
        help_text: null,
      },
    ],
    context_pack_readiness: [
      {
        id: "ready-k",
        version_id: KNOWLEDGE_VERSION_ID,
        readiness_status: "context_ready",
        supported_scope: {
          journey: "closed-beta-course-sellers",
          runtime: "inert",
          resolver: false,
        },
        evidence_phase: "CTX-1B",
        verified_at: null,
      },
      {
        id: "ready-n",
        version_id: NICHE_VERSION_ID,
        readiness_status: "context_ready",
        supported_scope: {
          journey: "closed-beta-course-sellers",
          runtime: "inert",
          resolver: false,
        },
        evidence_phase: "CTX-1B",
        verified_at: null,
      },
    ],
  });
}

describe("ContextRepository", () => {
  const repo = new ContextRepository(catalog());

  it("finds foundation.knowledge and niche.online-course-business packs by key", async () => {
    const knowledge = await repo.findPackByKey("foundation.knowledge");
    const niche = await repo.findPackByKey("niche.online-course-business");
    expect(knowledge).toMatchObject({
      ok: true,
      value: { packKey: "foundation.knowledge", packKind: "foundation" },
    });
    expect(niche).toMatchObject({
      ok: true,
      value: { packKey: "niche.online-course-business", packKind: "niche" },
    });
  });

  it("looks up packs by exact typed taxonomy target", async () => {
    const knowledge = await repo.findPackForTaxonomyTarget({
      kind: "foundation",
      key: "knowledge",
    });
    const niche = await repo.findPackForTaxonomyTarget({
      kind: "niche",
      key: "online-course-business",
    });
    expect(knowledge).toMatchObject({
      ok: true,
      value: { packKey: "foundation.knowledge" },
    });
    expect(niche).toMatchObject({
      ok: true,
      value: { packKey: "niche.online-course-business" },
    });
  });

  it("returns NOT_FOUND for a missing taxonomy target pack without fallback", async () => {
    const missing = await repo.findPackForTaxonomyTarget({
      kind: "industry",
      key: "education-and-learning",
    });
    expect(missing).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("loads versions by explicit id and by pack + number", async () => {
    const byId = await repo.getVersionById(NICHE_VERSION_ID);
    const byNumber = await repo.getVersionByPackAndNumber(
      "niche.online-course-business",
      1,
    );
    expect(byId).toMatchObject({
      ok: true,
      value: { id: NICHE_VERSION_ID, versionNumber: 1 },
    });
    expect(byNumber).toMatchObject({
      ok: true,
      value: { id: NICHE_VERSION_ID },
    });
  });

  it("lists published versions and still loads an explicit superseded version", async () => {
    const published = await repo.listPublishedVersionsForPack(
      "niche.online-course-business",
    );
    const superseded = await repo.getVersionById(SUPERSEDED_VERSION_ID);
    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.value.map((version) => version.id)).toEqual([NICHE_VERSION_ID]);
    }
    expect(superseded).toMatchObject({
      ok: true,
      value: { publicationStatus: "superseded" },
    });
  });

  it("returns null parent for Foundation v1 and the exact parent version for Niche v1", async () => {
    const knowledge = await repo.getVersionById(KNOWLEDGE_VERSION_ID);
    expect(knowledge.ok).toBe(true);
    if (!knowledge.ok) {
      return;
    }
    const knowledgeParent = await repo.getParentVersion(knowledge.value);
    const niche = await repo.getVersionById(NICHE_VERSION_ID);
    expect(niche.ok).toBe(true);
    if (!niche.ok) {
      return;
    }
    const nicheParent = await repo.getParentVersion(niche.value);
    expect(knowledgeParent).toMatchObject({ ok: true, value: null });
    expect(nicheParent).toMatchObject({
      ok: true,
      value: { id: KNOWLEDGE_VERSION_ID },
    });
  });

  it("fails closed when parent_version_id cannot be loaded", async () => {
    const broken = new ContextRepository(
      createControlPlaneMemoryClient({
        context_pack_versions: [
          {
            id: "orphan",
            pack_id: NICHE_PACK_ID,
            version_number: 1,
            publication_status: "published",
            completeness: "full",
            parent_version_id: "missing-parent",
            change_impact: "low",
            definition_summary: "broken",
          },
        ],
      }),
    );
    const result = await broken.getParentVersion({
      parentVersionId: "missing-parent",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_INTEGRITY_ERROR" },
    });
  });

  it("returns stored mappings and terminology without merge or locale fallback", async () => {
    const mappings = await repo.getMappings(NICHE_VERSION_ID);
    const terms = await repo.getTerminology(NICHE_VERSION_ID);
    const foundationTerms = await repo.getTerminology(KNOWLEDGE_VERSION_ID);
    expect(mappings.ok && terms.ok && foundationTerms.ok).toBe(true);
    if (!mappings.ok || !terms.ok || !foundationTerms.ok) {
      return;
    }
    expect(mappings.value).toHaveLength(6);
    expect(terms.value).toHaveLength(0);
    expect(foundationTerms.value).toHaveLength(4);
  });

  it("maps pack readiness as context_ready with null verified_at", async () => {
    const readiness = await repo.getPackReadiness(NICHE_VERSION_ID);
    expect(readiness).toMatchObject({
      ok: true,
      value: {
        readinessStatus: "context_ready",
        verifiedAt: null,
        supportedScope: {
          journey: "closed-beta-course-sellers",
          runtime: "inert",
          resolver: false,
        },
      },
    });
  });

  it("loads a mechanical Niche bundle without inheriting Foundation mappings", async () => {
    const bundle = await repo.loadContextVersionBundle(NICHE_VERSION_ID);
    expect(bundle.ok).toBe(true);
    if (!bundle.ok) {
      return;
    }
    expect(bundle.value.pack.packKey).toBe("niche.online-course-business");
    expect(bundle.value.version.versionNumber).toBe(1);
    expect(bundle.value.parentVersion?.id).toBe(KNOWLEDGE_VERSION_ID);
    expect(bundle.value.mappings).toHaveLength(6);
    expect(bundle.value.terminology).toHaveLength(0);
    expect(bundle.value.readiness.readinessStatus).toBe("context_ready");
    expect(bundle.value.capabilitiesReferenced).toHaveLength(6);
    expect(
      bundle.value.capabilitiesReferenced.map((item) => item.capabilityKey).sort(),
    ).toEqual([...NICHE_CAPS].sort());
    expect(bundle.value.mappings.some((row) => row.capabilityKey === "knowledge.programs")).toBe(
      false,
    );
  });

  it("batches mappings and terminology for exact version ids", async () => {
    const mappings = await repo.getMappingsForVersions([
      NICHE_VERSION_ID,
      KNOWLEDGE_VERSION_ID,
    ]);
    const terms = await repo.getTerminologyForVersions([KNOWLEDGE_VERSION_ID]);
    const packs = await repo.getPacksByIds([KNOWLEDGE_PACK_ID, NICHE_PACK_ID]);
    const readiness = await repo.getPackReadinessForVersions([
      NICHE_VERSION_ID,
      "missing-version",
    ]);
    expect(mappings.ok && terms.ok && packs.ok && readiness.ok).toBe(true);
    if (!mappings.ok || !terms.ok || !packs.ok || !readiness.ok) return;
    expect(mappings.value.some((row) => row.versionId === KNOWLEDGE_VERSION_ID)).toBe(true);
    expect(mappings.value.some((row) => row.versionId === NICHE_VERSION_ID)).toBe(true);
    expect(terms.value).toHaveLength(4);
    expect(packs.value.map((pack) => pack.packKey).sort()).toEqual([
      "foundation.knowledge",
      "niche.online-course-business",
    ]);
    expect(readiness.value.map((row) => row.versionId)).toEqual([NICHE_VERSION_ID]);
  });
});
