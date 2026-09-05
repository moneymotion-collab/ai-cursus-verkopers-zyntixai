import { DEFAULT_PRODUCT_TERMINOLOGY, type ProductTerminology } from "@/features/product-access/domain/terminology";
import type { ModuleNavVisibility, ProductModuleAccessState } from "@/features/product-access/domain/types";

/** Course Seller / Knowledge OCB full nav for AppShell presentation tests. */
export const KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY: ModuleNavVisibility = {
  home: true,
  leads: true,
  customers: true,
  projects: false,
  sites: false,
  workOrders: false,
  dispatch: false,
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
  projects: true,
  sites: false,
  workOrders: false,
  dispatch: false,
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
  project: { singular: "Project", plural: "Projects" },
  site: { singular: "Site", plural: "Sites" },
  workOrder: { singular: "Work order", plural: "Work orders" },
  technician: { singular: "Technician", plural: "Technicians" },
};

/** Field foundation lawful shared baseline, including shared Projects. */
export const FIELD_MODULE_NAV_VISIBILITY: ModuleNavVisibility = {
  ...SERVICE_MODULE_NAV_VISIBILITY,
  sites: true,
  workOrders: true,
  dispatch: true,
};

/** Field foundation seeded terminology uses Job(s) for the shared Project concept. */
export const FIELD_PRODUCT_TERMINOLOGY: ProductTerminology = {
  customer: { singular: "Customer", plural: "Customers" },
  project: { singular: "Job", plural: "Jobs" },
  site: { singular: "Site", plural: "Sites" },
  workOrder: { singular: "Work order", plural: "Work orders" },
  technician: { singular: "Technician", plural: "Technicians" },
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
