import { createControlPlaneMemoryClient } from "../control-plane/memory-query-client";

export const ORG_A = "org-a";
export const ORG_B = "org-b";
export const OPERATOR_USER_ID = "user-operator";
export const OWNER_USER_ID = "user-owner";

export const FOUNDATION_TAX_ID = "tax-foundation-knowledge";
export const NICHE_TAX_ID = "tax-niche-ocb";
export const DRAFT_TAX_ID = "tax-niche-draft";

export const KNOWLEDGE_PACK_ID = "pack-knowledge";
export const NICHE_PACK_ID = "pack-ocb";

export const KNOWLEDGE_VERSION_ID = "ver-knowledge-1";
export const NICHE_VERSION_ID = "ver-ocb-1";
export const NICHE_VERSION_2_ID = "ver-ocb-2";
export const NICHE_DRAFT_VERSION_ID = "ver-ocb-draft";
export const NICHE_PLANNED_VERSION_ID = "ver-ocb-planned";
export const SUPERSEDED_VERSION_ID = "ver-ocb-superseded";

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

function version(input: {
  id: string;
  packId: string;
  versionNumber: number;
  publicationStatus: string;
  parentVersionId?: string | null;
}) {
  return {
    id: input.id,
    pack_id: input.packId,
    version_number: input.versionNumber,
    publication_status: input.publicationStatus,
    completeness: "full",
    parent_version_id: input.parentVersionId ?? null,
    change_impact: "low",
    impact_note: null,
    definition_summary: input.id,
    intended_operator: "operator",
    primary_exchange: "exchange",
  };
}

function readiness(versionId: string, readinessStatus: string) {
  return {
    id: `ready-${versionId}`,
    version_id: versionId,
    readiness_status: readinessStatus,
    supported_scope: { journey: "internal-qa", runtime: "inert", resolver: false },
    evidence_phase: "ORG-CONTEXT-1C",
    verified_at: null,
  };
}

export function createOrgContextCatalogClient() {
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
    taxonomy_industries: [],
    taxonomy_niches: [
      {
        id: NICHE_TAX_ID,
        key: "online-course-business",
        label: "Online Course Business",
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
      {
        id: DRAFT_TAX_ID,
        key: "draft-niche",
        label: "Draft Niche",
        lifecycle_status: "draft",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_specializations: [],
    taxonomy_deep_specializations: [],
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
      version({
        id: KNOWLEDGE_VERSION_ID,
        packId: KNOWLEDGE_PACK_ID,
        versionNumber: 1,
        publicationStatus: "published",
      }),
      version({
        id: NICHE_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 1,
        publicationStatus: "published",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: NICHE_VERSION_2_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 3,
        publicationStatus: "published",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: NICHE_DRAFT_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 4,
        publicationStatus: "draft",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: NICHE_PLANNED_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 5,
        publicationStatus: "published",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: SUPERSEDED_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 2,
        publicationStatus: "superseded",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
    ],
    context_capability_mappings: [
      ...FOUNDATION_CAPS.map((key) => mapping(KNOWLEDGE_VERSION_ID, key, "required")),
      mapping(NICHE_VERSION_ID, "shared.crm.leads", "recommended"),
      ...NICHE_CAPS.slice(1).map((key) => mapping(NICHE_VERSION_ID, key, "optional")),
      mapping(NICHE_VERSION_2_ID, "shared.crm.leads", "recommended"),
      ...NICHE_CAPS.slice(1).map((key) => mapping(NICHE_VERSION_2_ID, key, "optional")),
      mapping(NICHE_DRAFT_VERSION_ID, "shared.crm.leads", "recommended"),
      mapping(NICHE_PLANNED_VERSION_ID, "shared.crm.leads", "recommended"),
      mapping(SUPERSEDED_VERSION_ID, "shared.crm.leads", "recommended"),
    ],
    context_terminology: [],
    context_pack_readiness: [
      readiness(KNOWLEDGE_VERSION_ID, "context_ready"),
      readiness(NICHE_VERSION_ID, "context_ready"),
      readiness(NICHE_VERSION_2_ID, "beta_supported"),
      readiness(NICHE_DRAFT_VERSION_ID, "context_ready"),
      readiness(NICHE_PLANNED_VERSION_ID, "planned"),
      readiness(SUPERSEDED_VERSION_ID, "context_ready"),
    ],
  });
}
