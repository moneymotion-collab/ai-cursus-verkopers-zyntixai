/**
 * Pure Effective Context domain types.
 * Persistence rows and generated Database types are not this contract.
 * relevantCapabilities are Context relevance, not entitlement or authorization.
 */

import type {
  CapabilityLifecycleStatus,
  CapabilityReadinessStatus,
  CatalogSupportedScope,
  ContextMappingOp,
  ContextPackKind,
  ContextPublicationStatus,
  ContextReadinessStatus,
  ContextRelevance,
  ContextTaxonomyTarget,
  TaxonomyPath,
} from "@/features/control-plane/domain/types";
import type {
  BusinessActivityStatus,
  TaxonomyClassificationRef,
} from "@/features/org-context/domain/types";

export const CONTEXT_RESOLUTION_MODE_INTERNAL_QA = "internal_qa" as const;

export type ContextResolutionMode = "internal_qa" | "beta" | "production";

export const SYSTEM_BASELINE_CAPABILITY_KEYS = [
  "core.member-administration",
  "core.tasks",
  "core.attention",
] as const;

export type SystemBaselineCapabilityKey =
  (typeof SYSTEM_BASELINE_CAPABILITY_KEYS)[number];

export const CONTEXT_CHAIN_MAX_DEPTH = 8;

export type ResolverBusinessActivity = {
  id: string;
  activityKey: string;
  displayName: string;
  status: BusinessActivityStatus;
  isPrimary: boolean;
  classification: TaxonomyClassificationRef | null;
};

export type ResolverContextPack = {
  id: string;
  packKey: string;
  packKind: ContextPackKind;
  defaultLocale: string;
  target: ContextTaxonomyTarget;
  targetKey: string;
};

export type ResolverContextVersion = {
  id: string;
  packId: string;
  versionNumber: number;
  publicationStatus: ContextPublicationStatus;
  parentVersionId: string | null;
};

export type ResolverContextMapping = {
  versionId: string;
  capabilityKey: string;
  mappingOp: ContextMappingOp;
  relevance: ContextRelevance | null;
};

export type ResolverTerminologyRow = {
  versionId: string;
  locale: string;
  termKey: string;
  singularLabel: string;
  pluralLabel: string;
  shortLabel: string | null;
  helpText: string | null;
};

export type ResolverCapabilityDefinition = {
  capabilityKey: string;
  lifecycleStatus: CapabilityLifecycleStatus;
};

export type ResolverCapabilityReadiness = {
  capabilityKey: string;
  readinessStatus: CapabilityReadinessStatus;
  supportedScope?: CatalogSupportedScope;
};

export type ResolverCapabilityDependency = {
  capabilityKey: string;
  dependsOnCapabilityKey: string;
};

export type ResolverContextReadiness = {
  versionId: string;
  readinessStatus: ContextReadinessStatus;
};

export type ContextChainEntry = {
  pack: ResolverContextPack;
  version: ResolverContextVersion;
};

export type EffectiveCapabilityProvenance = {
  sourceKind: "system_baseline" | "context_mapping";
  sourceContextPackKey: string | null;
  sourceVersionNumber: number | null;
  establishedBy: "set";
  overriddenFromPackKey?: string;
};

export type EffectiveCapability = {
  capabilityKey: string;
  effectiveRelevance: ContextRelevance;
  provenance: EffectiveCapabilityProvenance;
  lifecycleStatus: CapabilityLifecycleStatus;
  readinessStatus: CapabilityReadinessStatus;
};

export type EffectiveTerminologyProvenance = {
  requestedLocale: string | null;
  resolvedLocale: string;
  fallbackUsed: boolean;
  sourceContextPackKey: string;
  sourceVersionNumber: number;
};

export type EffectiveTerminology = {
  termKey: string;
  singularLabel: string;
  pluralLabel: string;
  shortLabel: string | null;
  helpText: string | null;
  provenance: EffectiveTerminologyProvenance;
};

export type EffectiveContextAncestryEntry = {
  packKey: string;
  versionNumber: number;
  packKind: ContextPackKind;
  taxonomyTargetKey: string;
};

export type ContextResolutionInput = {
  organization: { id: string };
  activity: ResolverBusinessActivity;
  leafVersionId: string;
  packs: readonly ResolverContextPack[];
  versions: readonly ResolverContextVersion[];
  mappings: readonly ResolverContextMapping[];
  terminology: readonly ResolverTerminologyRow[];
  contextReadiness: readonly ResolverContextReadiness[];
  taxonomyPath: TaxonomyPath;
  capabilities: readonly ResolverCapabilityDefinition[];
  dependencies: readonly ResolverCapabilityDependency[];
  capabilityReadiness: readonly ResolverCapabilityReadiness[];
  requestedLocale: string | null;
  mode: ContextResolutionMode;
};

export type EffectiveContext = {
  organization: { id: string };
  businessActivity: {
    id: string;
    activityKey: string;
    displayName: string;
    status: BusinessActivityStatus;
    isPrimary: boolean;
    classification: TaxonomyClassificationRef;
  };
  taxonomy: {
    canonicalPath: TaxonomyPath;
  };
  context: {
    packKey: string;
    versionNumber: number;
    publicationStatus: ContextPublicationStatus;
    readinessStatus: ContextReadinessStatus;
    ancestry: readonly EffectiveContextAncestryEntry[];
    resolutionMode: ContextResolutionMode;
  };
  relevantCapabilities: readonly EffectiveCapability[];
  terminology: readonly EffectiveTerminology[];
  resolution: {
    mode: ContextResolutionMode;
    requestedLocale: string | null;
    resolvedLocale: string;
    fallbackUsed: boolean;
  };
};
