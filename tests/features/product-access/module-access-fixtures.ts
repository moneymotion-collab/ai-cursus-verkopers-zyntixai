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

export function mockKnowledgeProductModuleAccess(): Extract<
  ProductModuleAccessState,
  { resolution: "resolved" }
> {
  return {
    resolution: "resolved",
    navVisibility: KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
    relevantCapabilities: [],
  };
}
