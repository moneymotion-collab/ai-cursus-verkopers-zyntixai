import {
  operatingModelFromPackKey,
  operatingModelOption,
  type OperatingModelId,
} from "@/features/onboarding/domain/operating-model";
import { PRODUCT_MODULE_BY_ID } from "@/features/product-access/domain/module-registry";
import type {
  ProductModuleAccessState,
  ProductModuleId,
} from "@/features/product-access/domain/types";

type WorkspaceModuleSpecification = {
  id: ProductModuleId;
  label?: string;
};

type WorkspacePresentationSpecification = {
  modules: readonly WorkspaceModuleSpecification[];
  workflow: readonly string[];
};

export type WorkspaceModulePresentation = {
  id: ProductModuleId;
  label: string;
};

export type WorkspacePresentation = {
  operatingModel: OperatingModelId;
  operatingModelLabel: string;
  modules: readonly WorkspaceModulePresentation[];
  workflow: readonly string[];
};

const WORKSPACE_PRESENTATION_BY_MODEL: Readonly<
  Record<OperatingModelId, WorkspacePresentationSpecification>
> = {
  course_seller: {
    modules: [
      { id: "home" },
      { id: "customers" },
      { id: "programs" },
      { id: "enrollments" },
      { id: "progress" },
      { id: "tasks" },
      { id: "attention" },
    ],
    workflow: [
      "Customer",
      "Program",
      "Enrollment",
      "Progress",
      "Attention",
      "Complete",
    ],
  },
  service: {
    modules: [
      { id: "home" },
      { id: "leads" },
      { id: "customers", label: "Clients" },
      { id: "projects" },
      { id: "tasks" },
      { id: "attention" },
    ],
    workflow: [
      "Lead",
      "Client",
      "Project",
      "Tasks / assignment",
      "Delivery status",
      "Attention",
      "Completion",
    ],
  },
  field_operations: {
    modules: [
      { id: "home" },
      { id: "customers" },
      { id: "projects", label: "Jobs" },
      { id: "sites" },
      { id: "workOrders", label: "Work Orders" },
      { id: "dispatch" },
      { id: "tasks" },
      { id: "attention" },
    ],
    workflow: [
      "Customer",
      "Job",
      "Site",
      "Work Order",
      "Technician / lightweight Dispatch",
      "Execution",
      "Completion",
      "Attention",
    ],
  },
  product_operations: {
    modules: [
      { id: "home" },
      { id: "customers" },
      { id: "products" },
      { id: "orders" },
      { id: "inventory" },
      { id: "fulfillment" },
      { id: "attention" },
    ],
    workflow: [
      "Product",
      "Order",
      "Inventory impact",
      "Fulfillment",
      "Completion",
      "Attention",
    ],
  },
};

export function resolveWorkspacePresentation(
  packKey: string,
  moduleAccess: ProductModuleAccessState,
): WorkspacePresentation | null {
  const operatingModel = operatingModelFromPackKey(packKey);
  if (!operatingModel || moduleAccess.resolution !== "resolved") {
    return null;
  }

  const specification = WORKSPACE_PRESENTATION_BY_MODEL[operatingModel];
  if (
    specification.modules.some(
      (module) => moduleAccess.navVisibility[module.id] !== true,
    )
  ) {
    return null;
  }

  return {
    operatingModel,
    operatingModelLabel: operatingModelOption(operatingModel).title,
    modules: specification.modules.map((module) => ({
      id: module.id,
      label: module.label ?? PRODUCT_MODULE_BY_ID[module.id].label,
    })),
    workflow: specification.workflow,
  };
}
