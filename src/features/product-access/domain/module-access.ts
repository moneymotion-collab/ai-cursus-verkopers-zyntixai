import type { ContextRelevance } from "@/features/control-plane/domain/types";
import type { EffectiveCapability } from "@/features/context-resolver/domain/types";
import {
  IMPLEMENTED_PRODUCT_MODULE_IDS,
  PRODUCT_MODULE_BY_ID,
} from "@/features/product-access/domain/module-registry";
import { DEFAULT_PRODUCT_TERMINOLOGY, type ProductTerminology } from "@/features/product-access/domain/terminology";
import type {
  ModuleNavVisibility,
  ProductModuleAccessState,
  ProductModuleId,
} from "@/features/product-access/domain/types";

const RELEVANCE_RANK: Record<ContextRelevance, number> = {
  required: 3,
  recommended: 2,
  optional: 1,
};

export const FAIL_CLOSED_MODULE_NAV_VISIBILITY: ModuleNavVisibility = {
  home: true,
  leads: false,
  customers: false,
  programs: false,
  enrollments: false,
  progress: false,
  attention: false,
  tasks: false,
  members: false,
};

export function capabilityMeetsMinimumRelevance(
  capability: EffectiveCapability,
  minRelevance: Extract<ContextRelevance, "required" | "recommended">,
): boolean {
  return RELEVANCE_RANK[capability.effectiveRelevance] >= RELEVANCE_RANK[minRelevance];
}

export function hasEffectiveCapabilityRelevance(input: {
  relevantCapabilities: readonly EffectiveCapability[];
  capabilityKey: string;
  minRelevance: Extract<ContextRelevance, "required" | "recommended">;
}): boolean {
  const capability = input.relevantCapabilities.find(
    (row) => row.capabilityKey === input.capabilityKey,
  );
  if (!capability) {
    return false;
  }
  return capabilityMeetsMinimumRelevance(capability, input.minRelevance);
}

export function canAccessModule(input: {
  moduleId: ProductModuleId;
  access: ProductModuleAccessState;
}): boolean {
  return input.access.navVisibility[input.moduleId] === true;
}

export function buildModuleNavVisibility(
  relevantCapabilities: readonly EffectiveCapability[],
): ModuleNavVisibility {
  const visibility = { ...FAIL_CLOSED_MODULE_NAV_VISIBILITY };

  for (const moduleId of IMPLEMENTED_PRODUCT_MODULE_IDS) {
    const definition = PRODUCT_MODULE_BY_ID[moduleId];
    if (!definition.implemented) {
      visibility[moduleId] = false;
      continue;
    }
    if (!definition.capabilityRequirement) {
      visibility[moduleId] = true;
      continue;
    }
    visibility[moduleId] = hasEffectiveCapabilityRelevance({
      relevantCapabilities,
      capabilityKey: definition.capabilityRequirement.capabilityKey,
      minRelevance: definition.capabilityRequirement.minRelevance,
    });
  }

  return visibility;
}

export function buildResolvedProductModuleAccess(
  relevantCapabilities: readonly EffectiveCapability[],
  terminology: ProductTerminology = DEFAULT_PRODUCT_TERMINOLOGY,
): Extract<ProductModuleAccessState, { resolution: "resolved" }> {
  return {
    resolution: "resolved",
    navVisibility: buildModuleNavVisibility(relevantCapabilities),
    relevantCapabilities,
    terminology,
  };
}

export function buildUnresolvedProductModuleAccess(): Extract<
  ProductModuleAccessState,
  { resolution: "unresolved" }
> {
  return {
    resolution: "unresolved",
    navVisibility: FAIL_CLOSED_MODULE_NAV_VISIBILITY,
    relevantCapabilities: null,
    terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  };
}
