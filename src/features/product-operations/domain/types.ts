import type { ProductTerminology } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState, ProductModuleId } from "@/features/product-access/domain/types";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";

export type ProductOperationsRole = "owner" | "admin" | "staff" | "viewer";
export const FULFILLMENT_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type ProductOperationsModuleId = Extract<
  ProductModuleId,
  "products" | "orders" | "inventory" | "fulfillment"
>;

export type ProductOperationsPageContext = {
  organizationId: string;
  organizationName: string;
  organizationOptions: OrganizationOption[];
  role: ProductOperationsRole;
  terminology: ProductTerminology;
  moduleAccess: ProductModuleAccessState;
  moduleId: ProductOperationsModuleId;
};

export type ProductRecord = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  onHand: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemRecord = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  customerId: string;
  customerLabel: string;
  reference: string;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItemRecord[];
  totalQuantity: number;
  statusChangedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type ProductOption = { value: string; label: string; onHand: number };
export type CustomerOption = { value: string; label: string };

export function canOperateProducts(role: ProductOperationsRole): boolean {
  return role === "owner" || role === "admin" || role === "staff";
}
export function canAdministerProducts(role: ProductOperationsRole): boolean {
  return role === "owner" || role === "admin";
}
export function fulfillmentStatusLabel(status: FulfillmentStatus): string {
  return status === "in_progress" ? "In progress" : status[0].toUpperCase() + status.slice(1);
}
export function allowedFulfillmentTransitions(status: FulfillmentStatus): FulfillmentStatus[] {
  if (status === "pending") return ["in_progress", "completed", "cancelled"];
  if (status === "in_progress") return ["completed", "cancelled"];
  return [];
}
