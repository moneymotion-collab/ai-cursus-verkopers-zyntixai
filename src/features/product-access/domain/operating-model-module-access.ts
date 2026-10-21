import type { EffectiveCapability } from "@/features/context-resolver/domain/types";
import { SYSTEM_BASELINE_CAPABILITY_KEYS } from "@/features/context-resolver/domain/types";
import type { ContextRelevance } from "@/features/control-plane/domain/types";
import {
  OPERATING_MODEL_CONTEXT_PACK_KEYS,
  type OperatingModelId,
} from "@/features/onboarding/domain/operating-model";
import {
  buildModuleNavVisibility,
  buildResolvedProductModuleAccess,
} from "@/features/product-access/domain/module-access";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";

type CapabilitySpec = readonly [
  capabilityKey: string,
  relevance: Extract<ContextRelevance, "required" | "recommended">,
];

const CORE_CAPABILITIES: readonly CapabilitySpec[] =
  SYSTEM_BASELINE_CAPABILITY_KEYS.map(
    (capabilityKey) => [capabilityKey, "required"] as const,
  );

const OPERATING_MODEL_CAPABILITIES: Record<
  OperatingModelId,
  readonly CapabilitySpec[]
> = {
  course_seller: [
    ...CORE_CAPABILITIES,
    ["shared.crm.customers", "required"],
    ["knowledge.programs", "required"],
    ["knowledge.enrollments", "required"],
    ["knowledge.progress", "required"],
    ["shared.crm.leads", "recommended"],
  ],
  service: [
    ...CORE_CAPABILITIES,
    ["shared.crm.customers", "required"],
    ["shared.crm.leads", "required"],
    ["shared.projects", "required"],
  ],
  field_operations: [
    ...CORE_CAPABILITIES,
    ["shared.crm.customers", "required"],
    ["shared.crm.leads", "recommended"],
    ["shared.projects", "required"],
    ["field.locations", "required"],
    ["field.work-orders", "required"],
    ["field.dispatch", "required"],
  ],
  product_operations: [
    ...CORE_CAPABILITIES,
    ["shared.crm.customers", "required"],
    ["product.products", "required"],
    ["product.orders", "required"],
    ["product.inventory", "required"],
    ["product.fulfillment", "required"],
  ],
};

export const SERVICE_PRODUCT_TERMINOLOGY: ProductTerminology = {
  ...DEFAULT_PRODUCT_TERMINOLOGY,
  customer: { singular: "Client", plural: "Clients" },
};

export const FIELD_PRODUCT_TERMINOLOGY: ProductTerminology = {
  ...DEFAULT_PRODUCT_TERMINOLOGY,
  project: { singular: "Job", plural: "Jobs" },
};

function packKeyForModel(model: OperatingModelId): string {
  const keys = OPERATING_MODEL_CONTEXT_PACK_KEYS[model];
  return keys[keys.length - 1] ?? model;
}

function capabilityForSpec(
  model: OperatingModelId,
  spec: CapabilitySpec,
): EffectiveCapability {
  const [capabilityKey, relevance] = spec;
  const baseline = (SYSTEM_BASELINE_CAPABILITY_KEYS as readonly string[]).includes(
    capabilityKey,
  );
  return {
    capabilityKey,
    effectiveRelevance: relevance,
    provenance: {
      sourceKind: baseline ? "system_baseline" : "context_mapping",
      sourceContextPackKey: baseline ? null : packKeyForModel(model),
      sourceVersionNumber: baseline ? null : 1,
      establishedBy: "set",
    },
    lifecycleStatus: "active",
    readinessStatus: "context_ready",
    supportedScope: null,
  };
}

export function capabilitiesForOperatingModel(
  model: OperatingModelId,
): readonly EffectiveCapability[] {
  return OPERATING_MODEL_CAPABILITIES[model].map((spec) =>
    capabilityForSpec(model, spec),
  );
}

export function terminologyForOperatingModel(
  model: OperatingModelId,
): ProductTerminology {
  if (model === "service") {
    return SERVICE_PRODUCT_TERMINOLOGY;
  }
  if (model === "field_operations") {
    return FIELD_PRODUCT_TERMINOLOGY;
  }
  return DEFAULT_PRODUCT_TERMINOLOGY;
}

export function buildOperatingModelProductModuleAccess(
  model: OperatingModelId,
): Extract<ProductModuleAccessState, { resolution: "resolved" }> {
  return buildResolvedProductModuleAccess(
    capabilitiesForOperatingModel(model),
    terminologyForOperatingModel(model),
  );
}

export function operatingModelNavVisibility(model: OperatingModelId) {
  return buildModuleNavVisibility(capabilitiesForOperatingModel(model));
}
