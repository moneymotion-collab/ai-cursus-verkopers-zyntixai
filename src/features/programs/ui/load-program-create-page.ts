import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramRole } from "@/features/programs/domain/types";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  parseProgramListReturnState,
  type ProgramListUrlState,
} from "@/features/programs/ui/program-list-search-params";
import { canShowCreateProgramWorkflow } from "@/features/programs/ui/program-workflow-visibility";
import type { Database } from "@/types/database";

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

export type ProgramCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; listState: ProgramListUrlState }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: ProgramRole;
      timeZone: string;
      listState: ProgramListUrlState;
    };

export async function loadProgramCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramCreatePageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveProgramPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const listState: ProgramListUrlState = {
    ...parseProgramListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };

  if (!canShowCreateProgramWorkflow(orgResult.role)) {
    return { kind: "action_unavailable", listState };
  }

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timezone,
    listState,
  };
}
