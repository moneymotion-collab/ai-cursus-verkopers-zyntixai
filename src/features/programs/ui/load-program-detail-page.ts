import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProgramDetailReadModel,
  ProgramHistoryLoadState,
  ProgramStatusHistoryEntry,
} from "@/features/programs/domain/read-types";
import type { ProgramPermissionSet, ProgramRole } from "@/features/programs/domain/types";
import { loadProgramDetailFoundation } from "@/features/programs/server/load-program-foundations";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildBackToProgramsHref,
  parseProgramListReturnState,
} from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import {
  formatProgramDate,
  formatProgramDescription,
  formatProgramHistorySourceLabel,
  formatProgramHistoryTransition,
} from "@/features/programs/ui/program-presentation";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const PROGRAM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProgramHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  sourceLabel: string;
  reason: string | null;
  timestampLabel: string;
};

export type ProgramDetailViewModel = {
  program: ProgramDetailReadModel;
  permissions: ProgramPermissionSet;
  history: ProgramHistoryPresentationItem[];
  historyState: ProgramHistoryLoadState;
  descriptionLabel: string;
  organizationTimezone: string;
  backHref: string;
};

export type ProgramDetailPageResult =
  | {
      kind: "ready";
      data: ProgramDetailViewModel;
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: ProgramRole;
      moduleAccess: ProductModuleAccessState;
    }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState }
  | { kind: "auth_required" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "organization_unavailable" }
  | { kind: "org_context_missing"; message: string }
  | { kind: "program_unavailable"; backHref: string }
  | { kind: "query_error"; message: string };

function isValidProgramId(programId: string): boolean {
  return PROGRAM_ID_PATTERN.test(programId);
}

function mapHistory(
  entries: ProgramStatusHistoryEntry[],
  timeZone: string,
): ProgramHistoryPresentationItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    transitionLabel: formatProgramHistoryTransition(entry),
    fromStatusLabel: entry.fromStatusLabel,
    toStatusLabel: entry.toStatusLabel,
    sourceLabel: formatProgramHistorySourceLabel(entry.source),
    reason: entry.reason,
    timestampLabel: formatProgramDate(entry.changedAt, timeZone),
  }));
}

export async function loadProgramDetailPage(
  supabase: SupabaseClient<Database>,
  programId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramDetailPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveProgramPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }
  if (orgResult.kind === "organization_unavailable") {
    return { kind: "organization_unavailable" };
  }
  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }
  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }
  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message };
  }

  const routeAccess = evaluateProductModuleRouteAccess({
    moduleId: "programs",
    access: orgResult.moduleAccess,
  });
  if (!routeAccess.allowed) {
    return {
      kind: "forbidden",
      message: routeAccess.message,
      moduleAccess: orgResult.moduleAccess,
    };
  }

  const listState: ProgramListUrlState = {
    ...parseProgramListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };
  const backHref = buildBackToProgramsHref(listState);

  if (!isValidProgramId(programId)) {
    return { kind: "program_unavailable", backHref };
  }

  const detailResult = await loadProgramDetailFoundation({
    supabase,
    organizationId: orgResult.organizationId,
    role: orgResult.role,
    programId,
  });

  if (!detailResult.ok) {
    if (
      detailResult.error.code === "PROGRAM_UNAVAILABLE" ||
      detailResult.error.category === "not_found" ||
      detailResult.error.category === "permission"
    ) {
      return { kind: "program_unavailable", backHref };
    }
    return { kind: "query_error", message: detailResult.error.message };
  }

  const { program, capabilities, history, historyState } = detailResult.data;

  return {
    kind: "ready",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    role: orgResult.role,
    moduleAccess: orgResult.moduleAccess,
    data: {
      program,
      permissions: capabilities,
      history: mapHistory(history, orgResult.timezone),
      historyState,
      descriptionLabel: formatProgramDescription(program.description),
      organizationTimezone: orgResult.timezone,
      backHref,
    },
  };
}
