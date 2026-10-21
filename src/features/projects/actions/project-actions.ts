"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProjectRole } from "@/features/projects/domain/types";
import {
  createProjectSchema,
  projectIdActionSchema,
  transitionProjectSchema,
  updateProjectSchema,
} from "@/features/projects/validation/project-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProjectActionResult =
  | { ok: true; projectId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function validationFailure(error: import("zod").ZodError): ProjectActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, message: "Check the highlighted fields.", fieldErrors };
}

function canMutate(role: string, operation: "edit" | "archive"): boolean {
  if (operation === "archive") return role === "owner" || role === "admin";
  return role === "owner" || role === "admin" || role === "staff";
}

async function authorizedClient(
  organizationId: string,
  operation: "edit" | "archive",
): Promise<
  | { ok: true; supabase: SupabaseClient<Database>; role: ProjectRole }
  | { ok: false; result: ProjectActionResult }
> {
  const typed = await createSupabaseServerClient();
  const organization = await resolveOrganizationContext({ supabase: typed, organizationId });
  if (!organization.ok) {
    return { ok: false, result: { ok: false, message: organization.error.message } };
  }
  const access = await loadProductModuleAccess(organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({ moduleId: "projects", access });
  if (!routeAccess.allowed) {
    return { ok: false, result: { ok: false, message: routeAccess.message } };
  }
  if (!canMutate(organization.context.role, operation)) {
    return {
      ok: false,
      result: { ok: false, message: "You do not have permission for this action." },
    };
  }
  return {
    ok: true,
    supabase: typed,
    role: organization.context.role as ProjectRole,
  };
}

function rpcFailure(message?: string): ProjectActionResult {
  const lower = message?.toLowerCase() ?? "";
  if (lower.includes("planned end")) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { plannedEnd: "Planned end must be on or after planned start." },
    };
  }
  if (lower.includes("customer")) return { ok: false, message: "Select an active customer." };
  if (lower.includes("transition")) return { ok: false, message: "That status change is not allowed." };
  if (lower.includes("archived")) return { ok: false, message: "This project is archived." };
  return { ok: false, message: "The project could not be saved. Please try again." };
}

function refresh(projectId: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function createProjectAction(input: unknown): Promise<ProjectActionResult> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "edit");
  if (!authorized.ok) return authorized.result;

  const { data, error } = await authorized.supabase.rpc("create_project", {
    p_organization_id: parsed.data.organizationId,
    p_customer_id: parsed.data.customerId,
    p_name: parsed.data.name,
    p_summary: parsed.data.summary ?? undefined,
    p_owner_member_id: parsed.data.ownerMemberId ?? undefined,
    p_planned_start: parsed.data.plannedStart ?? undefined,
    p_planned_end: parsed.data.plannedEnd ?? undefined,
  });
  if (error || typeof data !== "string") return rpcFailure(error?.message);
  refresh(data);
  return { ok: true, projectId: data };
}

export async function updateProjectAction(input: unknown): Promise<ProjectActionResult> {
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "edit");
  if (!authorized.ok) return authorized.result;

  const { error } = await authorized.supabase.rpc("update_project", {
    p_organization_id: parsed.data.organizationId,
    p_project_id: parsed.data.projectId,
    p_customer_id: parsed.data.customerId,
    p_name: parsed.data.name,
    p_summary: parsed.data.summary ?? undefined,
    p_owner_member_id: parsed.data.ownerMemberId ?? undefined,
    p_planned_start: parsed.data.plannedStart ?? undefined,
    p_planned_end: parsed.data.plannedEnd ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refresh(parsed.data.projectId);
  return { ok: true, projectId: parsed.data.projectId };
}

export async function transitionProjectStatusAction(input: unknown): Promise<ProjectActionResult> {
  const parsed = transitionProjectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "edit");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc("transition_project_status", {
    p_organization_id: parsed.data.organizationId,
    p_project_id: parsed.data.projectId,
    p_to_status: parsed.data.toStatus,
    p_reason: parsed.data.reason ?? undefined,
  });
  if (error) return rpcFailure(error.message);
  refresh(parsed.data.projectId);
  return { ok: true, projectId: parsed.data.projectId };
}

async function setArchived(
  input: unknown,
  operation: "archive" | "restore",
): Promise<ProjectActionResult> {
  const parsed = projectIdActionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const authorized = await authorizedClient(parsed.data.organizationId, "archive");
  if (!authorized.ok) return authorized.result;
  const { error } = await authorized.supabase.rpc(
    operation === "archive" ? "archive_project" : "restore_project",
    {
      p_organization_id: parsed.data.organizationId,
      p_project_id: parsed.data.projectId,
    },
  );
  if (error) return rpcFailure(error.message);
  refresh(parsed.data.projectId);
  return { ok: true, projectId: parsed.data.projectId };
}

export async function archiveProjectAction(input: unknown) {
  return setArchived(input, "archive");
}

export async function restoreProjectAction(input: unknown) {
  return setArchived(input, "restore");
}
