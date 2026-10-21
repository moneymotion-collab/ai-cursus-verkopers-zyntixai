import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressRole } from "@/features/progress/domain/types";
import { buildProgressDetailHref } from "@/features/progress/domain/progress-navigation";
import {
  loadProgressDetailPage,
  type ProgressDetailViewModel,
} from "@/features/progress/ui/load-progress-detail-page";
import { canShowVoidProgressWorkflow } from "@/features/progress/ui/progress-workflow-visibility";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState };

export type ProgressVoidPageResult =
  | WorkflowOrgFailure
  | { kind: "progress_unavailable"; backHref: string }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: ProgressRole;
      data: ProgressDetailViewModel;
      backHref: string;
      moduleAccess: ProductModuleAccessState;
    };

const ACTION_UNAVAILABLE_MESSAGE =
  "This progress record cannot be voided in its current state.";

/**
 * Reuses the B1.6.2 detail loader for org resolution, fact loading, and
 * permission-aware visibility, then gates access to the void workflow.
 */
export async function loadProgressVoidPage(
  supabase: SupabaseClient<Database>,
  factId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgressVoidPageResult> {
  const result = await loadProgressDetailPage(supabase, factId, rawSearchParams);

  if (result.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (result.kind === "organization_unavailable") {
    return { kind: "organization_unavailable" };
  }

  if (result.kind === "organization_required") {
    return { kind: "organization_required", organizations: result.organizations };
  }

  if (result.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: result.message };
  }

  if (result.kind === "query_error") {
    return { kind: "query_error", message: result.message };
  }

  if (result.kind === "forbidden") {
    return result;
  }

  if (result.kind === "progress_unavailable") {
    return { kind: "progress_unavailable", backHref: result.backHref };
  }

  const backHref = buildProgressDetailHref(factId, result.selectedOrganizationId);

  if (!canShowVoidProgressWorkflow(result.capabilities)) {
    return { kind: "action_unavailable", message: ACTION_UNAVAILABLE_MESSAGE, backHref };
  }

  return {
    kind: "ready",
    organizationId: result.selectedOrganizationId,
    organizationOptions: result.organizationOptions,
    role: result.role,
    data: result.data,
    backHref,
    moduleAccess: result.moduleAccess,
  };
}
