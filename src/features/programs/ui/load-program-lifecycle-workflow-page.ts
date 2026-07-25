import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import type { ProgramRole, ProgramStatus } from "@/features/programs/domain/types";
import { getAllowedProgramStatusTransitions } from "@/features/programs/domain/status";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildProgramDetailHref,
  parseProgramListReturnState,
} from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import {
  canShowArchiveProgramWorkflow,
  canShowRestoreProgramWorkflow,
  canShowStatusProgramWorkflow,
} from "@/features/programs/ui/program-workflow-visibility";
import type { Database } from "@/types/database";

const PROGRAM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LifecycleOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type LifecycleOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: ProgramRole;
  timeZone: string;
  listState: ProgramListUrlState;
};

export type ProgramLifecycleWorkflowPageResult =
  | LifecycleOrgFailure
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

const ACTION_UNAVAILABLE_MESSAGES = {
  status: "This program status cannot be changed in its current state.",
  archive: "This program cannot be archived in its current state.",
  restore: "This program cannot be restored in its current state.",
} as const;

type LifecycleAction = keyof typeof ACTION_UNAVAILABLE_MESSAGES;

async function resolveLifecycleOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LifecycleOrgFailure | LifecycleOrgReady> {
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

async function loadProgramLifecycleWorkflowPage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  action: LifecycleAction,
  canShow: (program: ProgramDetailReadModel, role: ProgramRole) => boolean,
): Promise<ProgramLifecycleWorkflowPageResult> {
  if (!PROGRAM_ID_PATTERN.test(programId)) {
    return { kind: "invalid_program" };
  }

  const org = await resolveLifecycleOrganization(supabase, rawSearchParams);
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
  const permissions = resolveProgramPermissions(org.role, {
    isArchived: program.derived.isArchived,
  });

  if (!permissions.canViewProgram) {
    return { kind: "program_unavailable", listState: org.listState };
  }

  if (!canShow(program, org.role)) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES[action],
      backHref,
    };
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

export type ProgramStatusPageResult = ProgramLifecycleWorkflowPageResult & {
  allowedTargets?: ProgramStatus[];
};

export async function loadProgramStatusPage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramStatusPageResult> {
  const result = await loadProgramLifecycleWorkflowPage(
    supabase,
    programId,
    rawSearchParams,
    "status",
    canShowStatusProgramWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const allowedTargets = getAllowedProgramStatusTransitions(result.program.status);

  if (allowedTargets.length === 0) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES.status,
      backHref: result.backHref,
    };
  }

  return {
    ...result,
    allowedTargets,
  };
}

export function loadProgramArchivePage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramLifecycleWorkflowPageResult> {
  return loadProgramLifecycleWorkflowPage(
    supabase,
    programId,
    rawSearchParams,
    "archive",
    canShowArchiveProgramWorkflow,
  );
}

export function loadProgramRestorePage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramLifecycleWorkflowPageResult> {
  return loadProgramLifecycleWorkflowPage(
    supabase,
    programId,
    rawSearchParams,
    "restore",
    canShowRestoreProgramWorkflow,
  );
}
