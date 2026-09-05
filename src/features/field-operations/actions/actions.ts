"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import {
  createSiteSchema,
  createWorkOrderSchema,
  evaluateWorkOrderRulesSchema,
  siteIdSchema,
  transitionWorkOrderSchema,
  updateSiteSchema,
  updateWorkOrderSchema,
} from "@/features/field-operations/validation/schemas";
import type { ProductModuleId } from "@/features/product-access/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type FieldActionResult =
  | { ok: true; id?: string; result?: { created: number; updated: number; expired: number } }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function validationFailure(error: import("zod").ZodError): FieldActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, message: "Check the highlighted fields.", fieldErrors };
}

async function authorizedClient(
  organizationId: string,
  moduleId: Extract<ProductModuleId, "sites" | "workOrders" | "dispatch">,
  adminOnly = false,
): Promise<
  | { ok: true; supabase: SupabaseClient<Database> }
  | { ok: false; result: FieldActionResult }
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

function rpcFailure(message?: string): FieldActionResult {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("technician")) return { ok: false, message: "Select an active technician from this organization." };
  if (normalized.includes("relationship")) return { ok: false, message: "The selected job and site do not belong together." };
  if (normalized.includes("scheduled date")) return { ok: false, message: "Set a scheduled date before this status change." };
  if (normalized.includes("transition")) return { ok: false, message: "That status change is not allowed." };
  return { ok: false, message: "The change could not be saved. Please try again." };
}

function refreshField(id?: string) {
  revalidatePath("/sites");
  revalidatePath("/work-orders");
  revalidatePath("/dispatch");
  revalidatePath("/projects");
  if (id) {
    revalidatePath(`/sites/${id}`);
    revalidatePath(`/work-orders/${id}`);
    revalidatePath(`/projects/${id}`);
  }
}

export async function createSiteAction(input: unknown): Promise<FieldActionResult> {
  const parsed = createSiteSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "sites");
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("create_site", {
    p_organization_id: parsed.data.organizationId,
    p_customer_id: parsed.data.customerId,
    p_project_id: parsed.data.projectId,
    p_name: parsed.data.name,
    p_address_line_1: parsed.data.addressLine1,
    p_address_line_2: parsed.data.addressLine2 ?? undefined,
    p_postal_code: parsed.data.postalCode,
    p_city: parsed.data.city,
    p_country: parsed.data.country,
    p_operational_note: parsed.data.operationalNote ?? undefined,
  });
  if (error || typeof data !== "string") return rpcFailure(error?.message);
  refreshField(data);
  return { ok: true, id: data };
}

export async function updateSiteAction(input: unknown): Promise<FieldActionResult> {
  const parsed = updateSiteSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "sites");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("update_site", {
    p_organization_id: parsed.data.organizationId,
    p_site_id: parsed.data.siteId,
    p_customer_id: parsed.data.customerId,
    p_project_id: parsed.data.projectId,
    p_name: parsed.data.name,
    p_address_line_1: parsed.data.addressLine1,
    p_address_line_2: parsed.data.addressLine2 ?? undefined,
    p_postal_code: parsed.data.postalCode,
    p_city: parsed.data.city,
    p_country: parsed.data.country,
    p_operational_note: parsed.data.operationalNote ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refreshField(parsed.data.siteId);
  return { ok: true, id: parsed.data.siteId };
}

async function setSiteArchived(input: unknown, restore: boolean): Promise<FieldActionResult> {
  const parsed = siteIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "sites", true);
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc(restore ? "restore_site" : "archive_site", {
    p_organization_id: parsed.data.organizationId,
    p_site_id: parsed.data.siteId,
  });
  if (error) return rpcFailure(error.message);
  refreshField(parsed.data.siteId);
  return { ok: true, id: parsed.data.siteId };
}

export async function archiveSiteAction(input: unknown) {
  return setSiteArchived(input, false);
}
export async function restoreSiteAction(input: unknown) {
  return setSiteArchived(input, true);
}

export async function createWorkOrderAction(input: unknown): Promise<FieldActionResult> {
  const parsed = createWorkOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "workOrders");
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("create_work_order", {
    p_organization_id: parsed.data.organizationId,
    p_project_id: parsed.data.projectId,
    p_site_id: parsed.data.siteId,
    p_title: parsed.data.title,
    p_instructions: parsed.data.instructions ?? undefined,
    p_technician_member_id: parsed.data.technicianMemberId ?? undefined,
    p_scheduled_for: parsed.data.scheduledFor ?? undefined,
  });
  if (error || typeof data !== "string") return rpcFailure(error?.message);
  refreshField(data);
  return { ok: true, id: data };
}

export async function updateWorkOrderAction(input: unknown): Promise<FieldActionResult> {
  const parsed = updateWorkOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "workOrders");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("update_work_order", {
    p_organization_id: parsed.data.organizationId,
    p_work_order_id: parsed.data.workOrderId,
    p_project_id: parsed.data.projectId,
    p_site_id: parsed.data.siteId,
    p_title: parsed.data.title,
    p_instructions: parsed.data.instructions ?? undefined,
    p_technician_member_id: parsed.data.technicianMemberId ?? undefined,
    p_scheduled_for: parsed.data.scheduledFor ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refreshField(parsed.data.workOrderId);
  return { ok: true, id: parsed.data.workOrderId };
}

export async function transitionWorkOrderStatusAction(input: unknown): Promise<FieldActionResult> {
  const parsed = transitionWorkOrderSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "workOrders");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("transition_work_order_status", {
    p_organization_id: parsed.data.organizationId,
    p_work_order_id: parsed.data.workOrderId,
    p_to_status: parsed.data.toStatus,
    p_reason: parsed.data.reason ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refreshField(parsed.data.workOrderId);
  return { ok: true, id: parsed.data.workOrderId };
}

export async function evaluateWorkOrderAttentionRulesAction(input: unknown): Promise<FieldActionResult> {
  const parsed = evaluateWorkOrderRulesSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "dispatch", true);
  if (!authorized.ok) return authorized.result;
  const { data, error } = await authorized.supabase.rpc("evaluate_work_order_attention_rules", {
    p_organization_id: parsed.data.organizationId,
    p_work_order_id: parsed.data.workOrderId ?? undefined,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return rpcFailure(error?.message);
  const result = data as Record<string, unknown>;
  refreshField(parsed.data.workOrderId ?? undefined);
  revalidatePath("/attention");
  return {
    ok: true,
    result: {
      created: Number(result.created ?? 0),
      updated: Number(result.updated ?? 0),
      expired: Number(result.expired ?? 0),
    },
  };
}
