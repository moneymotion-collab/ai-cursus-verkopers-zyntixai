import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import type { ProgramRole } from "@/features/programs/domain/types";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildProgramDetailHref,
  parseProgramListReturnState,
} from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import { canShowEditProgramWorkflow } from "@/features/programs/ui/program-workflow-visibility";
import type { Database } from "@/types/database";

const PROGRAM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type WorkflowOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: ProgramRole;
  timeZone: string;
  listState: ProgramListUrlState;
};

async function resolveWorkflowOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<WorkflowOrgFailure | WorkflowOrgReady> {
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

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timezone,
    listState,
  };
}

export type ProgramEditPageResult =
  | WorkflowOrgFailure
  | { kind: "invalid_program" }
  | { kind: "program_unavailable"; listState: ProgramListUrlState }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      program: ProgramDetailReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: ProgramRole;
      timeZone: string;
      listState: ProgramListUrlState;
      backHref: string;
    };

export async function loadProgramEditPage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramEditPageResult> {
  if (!PROGRAM_ID_PATTERN.test(programId)) {
    return { kind: "invalid_program" };
  }

  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const programResult = await getProgramById({
    supabase,
    organizationId: org.organizationId,
    programId,
  });

  const backHref = buildProgramDetailHref(programId, org.listState);

  if (!programResult.ok) {
    return { kind: "program_unavailable", listState: org.listState };
  }

  const program = programResult.data;

  if (!canShowEditProgramWorkflow(program, org.role)) {
    const permissions = resolveProgramPermissions(org.role, {
      isArchived: program.derived.isArchived,
    });
    const message = program.derived.isArchived
      ? "Archived programs cannot be edited."
      : !permissions.canUpdateProgram
        ? "You do not have permission to edit this program."
        : "This program cannot be edited in its current state.";
    return { kind: "action_unavailable", message, backHref };
  }

  return {
    kind: "ready",
    program,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
  };
}
