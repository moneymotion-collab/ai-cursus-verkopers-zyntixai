import type { ProductTerminology } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState, ProductModuleId } from "@/features/product-access/domain/types";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";

export type FieldRole = "owner" | "admin" | "staff" | "viewer";
export const WORK_ORDER_STATUSES = [
  "planned",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export type FieldPageContext = {
  organizationId: string;
  organizationName: string;
  organizationOptions: OrganizationOption[];
  role: FieldRole;
  terminology: ProductTerminology;
  moduleAccess: ProductModuleAccessState;
  moduleId: Extract<ProductModuleId, "sites" | "workOrders" | "dispatch">;
};

export type SiteRecord = {
  id: string;
  organizationId: string;
  customerId: string;
  customerLabel: string;
  projectId: string;
  projectLabel: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
  operationalNote: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkOrderRecord = {
  id: string;
  organizationId: string;
  projectId: string;
  projectLabel: string;
  customerId: string;
  customerLabel: string;
  siteId: string;
  siteLabel: string;
  siteAddress: string;
  title: string;
  instructions: string | null;
  technicianMemberId: string | null;
  technicianLabel: string | null;
  scheduledFor: string | null;
  status: WorkOrderStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FieldOption = { value: string; label: string; projectId?: string };
export type SiteFormOptions = {
  projects: (FieldOption & { customerId: string })[];
};
export type WorkOrderFormOptions = {
  sites: FieldOption[];
  technicians: FieldOption[];
};

export function canOperateField(role: FieldRole): boolean {
  return role === "owner" || role === "admin" || role === "staff";
}

export function canAdministerField(role: FieldRole): boolean {
  return role === "owner" || role === "admin";
}

export function workOrderStatusLabel(status: WorkOrderStatus): string {
  if (status === "in_progress") return "In progress";
  return status[0].toUpperCase() + status.slice(1);
}

export function allowedWorkOrderTransitions(status: WorkOrderStatus): WorkOrderStatus[] {
  if (status === "planned") return ["scheduled", "cancelled"];
  if (status === "scheduled") return ["planned", "in_progress", "cancelled"];
  if (status === "in_progress") return ["scheduled", "completed", "cancelled"];
  if (status === "completed") return ["in_progress"];
  return ["planned"];
}
