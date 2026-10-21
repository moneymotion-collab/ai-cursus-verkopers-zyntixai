/**
 * INTERNAL server domain model for TAX/CAP/CTX catalog reads.
 * Persistence types live in database.generated.ts and must not leak to UI.
 * Context relevance is not authorization. CAP readiness is not entitlement.
 * Context readiness is not execution state.
 */

export type CatalogLifecycleStatus = "draft" | "active" | "superseded";

export type CatalogVisibility = "internal" | "listed";

export type CapabilityLifecycleStatus =
  | "draft"
  | "active"
  | "deprecated"
  | "superseded";

export type CapabilityOwnerClass = "core" | "shared" | "foundation" | "horizontal";

export type CapabilityReadinessStatus =
  | "planned"
  | "context_ready"
  | "foundation_ready"
  | "beta_supported"
  | "production_verified";

export type ContextPackKind =
  | "foundation"
  | "industry"
  | "niche"
  | "specialization"
  | "deep_specialization";

export type ContextPublicationStatus = "draft" | "published" | "superseded";

export type ContextCompleteness = "full" | "delta";

export type ContextChangeImpact = "low" | "medium" | "high";

export type ContextMappingOp = "set" | "remove";

export type ContextRelevance = "required" | "recommended" | "optional";

export type ContextReadinessStatus =
  | "planned"
  | "context_ready"
  | "beta_supported"
  | "production_verified";

export type CatalogSupportedScope = Readonly<Record<string, unknown>>;

export type CatalogListOptions = {
  /** When true, include catalog_visibility=internal. Default lists listed only. */
  includeInternal?: boolean;
};

export type TaxonomyNodeKind = ContextPackKind;

export type TaxonomyNodeRef = {
  kind: TaxonomyNodeKind;
  id: string;
  key: string;
  label: string;
  lifecycleStatus: CatalogLifecycleStatus;
  catalogVisibility: CatalogVisibility;
};

export type TaxonomyPath = {
  foundation: TaxonomyNodeRef;
  industry: TaxonomyNodeRef | null;
  niche: TaxonomyNodeRef | null;
  specialization: TaxonomyNodeRef | null;
  deepSpecialization: TaxonomyNodeRef | null;
};

export type TaxonomyRelease = {
  id: string;
  key: string;
  label: string;
  lifecycleStatus: CatalogLifecycleStatus;
};

export type TaxonomyAliasCandidate = {
  aliasLabel: string;
  locale: string;
  target: TaxonomyNodeRef;
};

export type CapabilityDefinition = {
  id: string;
  capabilityKey: string;
  label: string;
  description: string;
  ownerClass: CapabilityOwnerClass;
  ownerKey: string;
  foundationId: string | null;
  lifecycleStatus: CapabilityLifecycleStatus;
  catalogVisibility: CatalogVisibility;
  supersededByCapabilityId: string | null;
};

export type CapabilityDependencyEdge = {
  capabilityId: string;
  capabilityKey: string;
  dependsOnCapabilityId: string;
  dependsOnCapabilityKey: string;
};

export type CapabilityReadiness = {
  capabilityId: string;
  capabilityKey: string;
  readinessStatus: CapabilityReadinessStatus;
  supportedScope: CatalogSupportedScope;
  evidencePhase: string | null;
  verifiedAt: string | null;
};

export type ContextTaxonomyTarget = {
  kind: TaxonomyNodeKind;
  id: string;
};

export type ContextPackDefinition = {
  id: string;
  packKey: string;
  label: string;
  packKind: ContextPackKind;
  defaultLocale: string;
  lifecycleStatus: CatalogLifecycleStatus;
  target: ContextTaxonomyTarget;
};

export type ContextPackVersion = {
  id: string;
  packId: string;
  versionNumber: number;
  publicationStatus: ContextPublicationStatus;
  completeness: ContextCompleteness;
  parentVersionId: string | null;
  changeImpact: ContextChangeImpact;
  impactNote: string | null;
  definitionSummary: string;
  intendedOperator: string | null;
  primaryExchange: string | null;
};

export type ContextCapabilityMapping = {
  versionId: string;
  capabilityId: string;
  capabilityKey: string;
  mappingOp: ContextMappingOp;
  relevance: ContextRelevance | null;
};

export type ContextTerminology = {
  versionId: string;
  locale: string;
  termKey: string;
  singularLabel: string;
  pluralLabel: string;
  shortLabel: string | null;
  helpText: string | null;
};

export type ContextPackReadiness = {
  versionId: string;
  readinessStatus: ContextReadinessStatus;
  supportedScope: CatalogSupportedScope;
  evidencePhase: string | null;
  verifiedAt: string | null;
};

/**
 * Mechanical canonical components for one Context version.
 * Not a resolved Context. Parent mappings are not merged.
 */
export type ContextVersionBundle = {
  pack: ContextPackDefinition;
  version: ContextPackVersion;
  parentVersion: ContextPackVersion | null;
  mappings: readonly ContextCapabilityMapping[];
  terminology: readonly ContextTerminology[];
  readiness: ContextPackReadiness;
  capabilitiesReferenced: readonly CapabilityDefinition[];
};
