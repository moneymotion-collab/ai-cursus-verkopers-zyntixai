import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttentionPermissionSet,
  AttentionRole,
} from "@/features/attention/domain/types";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";

export type AttentionShellPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: AttentionRole;
  capabilities: AttentionPermissionSet;
  timeZone: string;
  isMultiOrganization: boolean;
};

export type AttentionShellPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string; retryable?: boolean }
  | AttentionShellPageSuccess;

/**
 * B1.7.5-A shell loader: organization/membership context only.
 * Does not fetch Attention list/detail rows (B1.7.5-B / D).
 * Does not parse product filter/sort/pagination search params (B1.7.5-C).
 */
export async function loadAttentionShellPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined> = {},
): Promise<AttentionShellPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveAttentionPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "no_organizations" };
  }

  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }

  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message, retryable: true };
  }

  const capabilities = resolveAttentionPermissions(orgResult.role);

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    organizationName: orgResult.organizationName,
    role: orgResult.role,
    capabilities,
    timeZone: orgResult.timezone,
    isMultiOrganization: orgResult.isMultiOrganization,
  };
}
