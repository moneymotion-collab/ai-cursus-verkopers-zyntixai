import type { TaxonomyNodeRef, TaxonomyPath } from "@/features/control-plane/domain/types";
import type {
  ContextResolutionInput,
  ResolverCapabilityDefinition,
  ResolverCapabilityDependency,
  ResolverCapabilityReadiness,
  ResolverContextMapping,
  ResolverContextPack,
  ResolverContextReadiness,
  ResolverContextVersion,
  ResolverTerminologyRow,
} from "@/features/context-resolver/domain/types";

export const CORE_KEYS = [
  "core.member-administration",
  "core.tasks",
  "core.attention",
] as const;

export const KNOWLEDGE_REQUIRED = [
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
] as const;

export const NICHE_MAPPINGS = [
  ["shared.crm.leads", "recommended"],
  ["horizontal.social.connection", "optional"],
  ["horizontal.social.content", "optional"],
  ["horizontal.social.approval", "optional"],
  ["horizontal.social.scheduling", "optional"],
  ["horizontal.social.publishing", "optional"],
] as const;

export const CAP_EDGES: readonly ResolverCapabilityDependency[] = [
  { capabilityKey: "knowledge.enrollments", dependsOnCapabilityKey: "knowledge.programs" },
  { capabilityKey: "knowledge.enrollments", dependsOnCapabilityKey: "shared.crm.customers" },
  { capabilityKey: "knowledge.progress", dependsOnCapabilityKey: "knowledge.enrollments" },
  { capabilityKey: "horizontal.social.approval", dependsOnCapabilityKey: "horizontal.social.content" },
  { capabilityKey: "horizontal.social.scheduling", dependsOnCapabilityKey: "horizontal.social.content" },
  { capabilityKey: "horizontal.social.publishing", dependsOnCapabilityKey: "horizontal.social.connection" },
  { capabilityKey: "horizontal.social.publishing", dependsOnCapabilityKey: "horizontal.social.content" },
];

const ALL_CAP_KEYS = [
  ...CORE_KEYS,
  ...KNOWLEDGE_REQUIRED,
  ...NICHE_MAPPINGS.map(([key]) => key),
];

export function taxNode(
  kind: TaxonomyNodeRef["kind"],
  key: string,
  id = `tax-${key}`,
): TaxonomyNodeRef {
  return {
    kind,
    id,
    key,
    label: key,
    lifecycleStatus: "active",
    catalogVisibility: "listed",
  };
}

export const KNOWLEDGE_NODE = taxNode("foundation", "knowledge");
export const EDUCATION_NODE = taxNode("industry", "education-and-learning");
export const OCB_NODE = taxNode("niche", "online-course-business");
export const PRODUCT_OPS_NODE = taxNode("foundation", "product-operations", "tax-product-operations");

export const OCB_PATH: TaxonomyPath = {
  foundation: KNOWLEDGE_NODE,
  industry: EDUCATION_NODE,
  niche: OCB_NODE,
  specialization: null,
  deepSpecialization: null,
};

export function capabilityDefs(
  keys: readonly string[] = ALL_CAP_KEYS,
  lifecycle: ResolverCapabilityDefinition["lifecycleStatus"] = "active",
): ResolverCapabilityDefinition[] {
  return keys.map((capabilityKey) => ({ capabilityKey, lifecycleStatus: lifecycle }));
}

export function capabilityReadiness(
  keys: readonly string[] = ALL_CAP_KEYS,
): ResolverCapabilityReadiness[] {
  return keys.map((capabilityKey) => ({
    capabilityKey,
    readinessStatus: "context_ready",
  }));
}

export const KNOWLEDGE_PACK: ResolverContextPack = {
  id: "pack-knowledge",
  packKey: "foundation.knowledge",
  packKind: "foundation",
  defaultLocale: "en",
  target: { kind: "foundation", id: KNOWLEDGE_NODE.id },
  targetKey: KNOWLEDGE_NODE.key,
};

export const OCB_PACK: ResolverContextPack = {
  id: "pack-ocb",
  packKey: "niche.online-course-business",
  packKind: "niche",
  defaultLocale: "en",
  target: { kind: "niche", id: OCB_NODE.id },
  targetKey: OCB_NODE.key,
};

export const KNOWLEDGE_V1: ResolverContextVersion = {
  id: "ver-knowledge-1",
  packId: KNOWLEDGE_PACK.id,
  versionNumber: 1,
  publicationStatus: "published",
  parentVersionId: null,
};

export const OCB_V1: ResolverContextVersion = {
  id: "ver-ocb-1",
  packId: OCB_PACK.id,
  versionNumber: 1,
  publicationStatus: "published",
  parentVersionId: KNOWLEDGE_V1.id,
};

export function knowledgeMappings(): ResolverContextMapping[] {
  return KNOWLEDGE_REQUIRED.map((capabilityKey) => ({
    versionId: KNOWLEDGE_V1.id,
    capabilityKey,
    mappingOp: "set" as const,
    relevance: "required" as const,
  }));
}

export function nicheMappings(): ResolverContextMapping[] {
  return NICHE_MAPPINGS.map(([capabilityKey, relevance]) => ({
    versionId: OCB_V1.id,
    capabilityKey,
    mappingOp: "set" as const,
    relevance,
  }));
}

export function knowledgeTerms(locale = "en"): ResolverTerminologyRow[] {
  return [
    ["customer", "Customer", "Customers"],
    ["program", "Program", "Programs"],
    ["enrollment", "Enrollment", "Enrollments"],
    ["progress", "Progress", "Progress"],
  ].map(([termKey, singularLabel, pluralLabel]) => ({
    versionId: KNOWLEDGE_V1.id,
    locale,
    termKey,
    singularLabel,
    pluralLabel,
    shortLabel: null,
    helpText: null,
  }));
}

export function qaSemanticInput(
  overrides: Partial<ContextResolutionInput> = {},
): ContextResolutionInput {
  return {
    organization: { id: "org-qa" },
    activity: {
      id: "activity-qa",
      activityKey: "qa_online_course_business",
      displayName: "Online Course Business QA",
      status: "active",
      isPrimary: true,
      classification: { kind: "niche", targetId: OCB_NODE.id, targetKey: OCB_NODE.key },
    },
    leafVersionId: OCB_V1.id,
    packs: [KNOWLEDGE_PACK, OCB_PACK],
    versions: [KNOWLEDGE_V1, OCB_V1],
    mappings: [...knowledgeMappings(), ...nicheMappings()],
    terminology: knowledgeTerms(),
    contextReadiness: [
      { versionId: KNOWLEDGE_V1.id, readinessStatus: "context_ready" },
      { versionId: OCB_V1.id, readinessStatus: "context_ready" },
    ] satisfies ResolverContextReadiness[],
    taxonomyPath: OCB_PATH,
    capabilities: capabilityDefs(),
    dependencies: CAP_EDGES,
    capabilityReadiness: capabilityReadiness(),
    requestedLocale: "en",
    mode: "internal_qa",
    ...overrides,
  };
}

export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const current = copy[i];
    const swap = copy[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    copy[i] = swap;
    copy[j] = current;
  }
  return copy;
}
