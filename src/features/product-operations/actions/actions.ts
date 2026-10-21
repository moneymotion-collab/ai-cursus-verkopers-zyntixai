"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProductOperationsModuleId } from "@/features/product-operations/domain/types";
import {
  adjustInventorySchema,
  createOrderSchema,
  createProductSchema,
  evaluateProductRulesSchema,
  productIdSchema,
  transitionFulfillmentSchema,
  updateProductSchema,
} from "@/features/product-operations/validation/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProductOperationsActionResult =
  | { ok: true; id?: string; onHand?: number; result?: { created: number; updated: number; expired: number } }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function validationFailure(error: import("zod").ZodError): ProductOperationsActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, message: "Check the highlighted fields.", fieldErrors };
}

async function authorizedClient(
  organizationId: string,
  moduleId: ProductOperationsModuleId,
  adminOnly = false,
): Promise<
  | { ok: true; supabase: SupabaseClient<Database> }
  | { ok: false; result: ProductOperationsActionResult }
> {
  const supabase = await createSupabaseServerClient();
  const organization = await resolveOrganizationContext({ supabase, organizationId });
  if (!organization.ok) return { ok: false, result: { ok: false, message: organization.error.message } };
  const access = await loadProductModuleAccess(organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({ moduleId, access });
  if (!routeAccess.allowed) return { ok: false, result: { ok: false, message: routeAccess.message } };
  const role = organization.context.role;
  const allowed = adminOnly
    ? role === "owner" || role === "admin"
    : role === "owner" || role === "admin" || role === "staff";
  if (!allowed) return { ok: false, result: { ok: false, message: "You do not have permission for this action." } };
  return { ok: true, supabase };
}

function rpcFailure(message?: string): ProductOperationsActionResult {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("insufficient stock")) {
    return { ok: false, message: "Insufficient stock. No order or inventory change was created." };
  }
  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return { ok: false, message: "That SKU or order reference is already in use." };
  }
  if (normalized.includes("idempotency key payload mismatch")) {
    return { ok: false, message: "This request key was already used for different data. Refresh and try again." };
  }
  if (normalized.includes("transition")) return { ok: false, message: "That fulfillment status change is not allowed." };
  return { ok: false, message: "The change could not be saved. Please try again." };
}

function refreshProductOperations(id?: string) {
  for (const path of ["/products", "/orders", "/inventory", "/fulfillment", "/attention", "/home"]) {
    revalidatePath(path);
  }
  if (id) {
    revalidatePath(`/products/${id}`);
    revalidatePath(`/orders/${id}`);
  }
}

export async function createProductAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "products");
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("create_product", {
    p_organization_id: parsed.data.organizationId,
    p_name: parsed.data.name,
    p_sku: parsed.data.sku,
    p_description: parsed.data.description ?? undefined,
  });
  if (error || typeof data !== "string") return rpcFailure(error?.message);
  refreshProductOperations(data);
  return { ok: true, id: data };
}

export async function updateProductAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "products");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("update_product", {
    p_organization_id: parsed.data.organizationId,
    p_product_id: parsed.data.productId,
    p_name: parsed.data.name,
    p_sku: parsed.data.sku,
    p_description: parsed.data.description ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refreshProductOperations(parsed.data.productId);
  return { ok: true, id: parsed.data.productId };
}

async function setProductArchived(input: unknown, restore: boolean) {
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "products", true);
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc(restore ? "restore_product" : "archive_product", {
    p_organization_id: parsed.data.organizationId,
    p_product_id: parsed.data.productId,
  });
  if (error) return rpcFailure(error.message);
  refreshProductOperations(parsed.data.productId);
  return { ok: true as const, id: parsed.data.productId };
}
export async function archiveProductAction(input: unknown) {
  return setProductArchived(input, false);
}
export async function restoreProductAction(input: unknown) {
  return setProductArchived(input, true);
}

export async function adjustInventoryAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = adjustInventorySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "inventory");
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("adjust_product_inventory", {
    p_organization_id: parsed.data.organizationId,
    p_product_id: parsed.data.productId,
    p_quantity_delta: parsed.data.quantityDelta,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || typeof data !== "number") return rpcFailure(error?.message);
  refreshProductOperations(parsed.data.productId);
  return { ok: true, id: parsed.data.productId, onHand: data };
}

export async function createOrderAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "orders");
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("create_inventory_order", {
    p_organization_id: parsed.data.organizationId,
    p_customer_id: parsed.data.customerId,
    p_reference: parsed.data.reference,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || typeof data !== "string") return rpcFailure(error?.message);
  refreshProductOperations(data);
  return { ok: true, id: data };
}

export async function transitionFulfillmentAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = transitionFulfillmentSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "fulfillment");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("transition_order_fulfillment", {
    p_organization_id: parsed.data.organizationId,
    p_order_id: parsed.data.orderId,
    p_to_status: parsed.data.toStatus,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return rpcFailure(error.message);
  refreshProductOperations(parsed.data.orderId);
  return { ok: true, id: parsed.data.orderId };
}

export async function evaluateProductAttentionRulesAction(input: unknown): Promise<ProductOperationsActionResult> {
  const parsed = evaluateProductRulesSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "fulfillment", true);
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("evaluate_product_attention_rules", {
    p_organization_id: parsed.data.organizationId,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return rpcFailure(error?.message);
  const result = data as Record<string, unknown>;
  refreshProductOperations();
  return {
    ok: true,
    result: {
      created: Number(result.created ?? 0),
      updated: Number(result.updated ?? 0),
      expired: Number(result.expired ?? 0),
    },
  };
}
