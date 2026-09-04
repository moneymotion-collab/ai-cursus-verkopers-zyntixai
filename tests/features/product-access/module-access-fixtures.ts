import { DEFAULT_PRODUCT_TERMINOLOGY, type ProductTerminology } from "@/features/product-access/domain/terminology";
import type { ModuleNavVisibility, ProductModuleAccessState } from "@/features/product-access/domain/types";

/** Course Seller / Knowledge OCB full nav for AppShell presentation tests. */
export const KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY: ModuleNavVisibility = {
  home: true,
  leads: true,
  customers: true,
  programs: true,
  enrollments: true,
  progress: true,
  attention: true,
  tasks: true,
  members: true,
};

/** Service foundation lawful shared baseline without Knowledge modules. */
export const SERVICE_MODULE_NAV_VISIBILITY: ModuleNavVisibility = {
  home: true,
  leads: true,
  customers: true,
  programs: false,
  enrollments: false,
  progress: false,
  attention: true,
  tasks: true,
  members: true,
};

/** Service foundation seeded terminology: Client(s) for the shared Customer concept. */
export const SERVICE_PRODUCT_TERMINOLOGY: ProductTerminology = {
  customer: { singular: "Client", plural: "Clients" },
};

export function mockKnowledgeProductModuleAccess(): Extract<
  ProductModuleAccessState,
  { resolution: "resolved" }
> {
  return {
    resolution: "resolved",
    navVisibility: KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
    relevantCapabilities: [],
    terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  };
}

export function mockServiceProductModuleAccess(): Extract<
  ProductModuleAccessState,
  { resolution: "resolved" }
> {
  return {
    resolution: "resolved",
    navVisibility: SERVICE_MODULE_NAV_VISIBILITY,
    relevantCapabilities: [],
    terminology: SERVICE_PRODUCT_TERMINOLOGY,
  };
}
