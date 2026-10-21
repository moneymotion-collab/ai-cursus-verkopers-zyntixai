import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";
import type {
  ProgramDetailLoaderResult,
  ProgramListFilters,
  ProgramListLoaderResult,
  ProgramListSort,
  ProgramPagination,
} from "@/features/programs/domain/read-types";
import type {
  ProgramApplicationError,
  ProgramRole,
} from "@/features/programs/domain/types";
import {
  getProgramById,
  listPrograms,
  listProgramStatusHistory,
} from "@/features/programs/server/program-read-queries";
import { programUnavailableError } from "@/features/programs/server/normalize-program-error";

export type ProgramLoaderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProgramApplicationError };

export async function loadProgramsListFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgramRole;
  filters?: ProgramListFilters;
  pagination?: ProgramPagination;
  sort?: ProgramListSort;
}): Promise<ProgramLoaderResult<ProgramListLoaderResult>> {
  const capabilities = resolveProgramPermissions(params.role);
  const listResult = await listPrograms({
    supabase: params.supabase,
    organizationId: params.organizationId,
    filters: params.filters,
    pagination: params.pagination,
    sort: params.sort,
  });

  if (!listResult.ok) {
    return listResult;
  }

  return {
    ok: true,
    data: {
      organizationId: params.organizationId,
      role: params.role,
      capabilities,
      filters: {
        includeArchived: params.filters?.includeArchived === true,
        ...params.filters,
      },
      sort: {
        field: params.sort?.field ?? "updated_at",
        direction: params.sort?.direction ?? "desc",
      },
      result: listResult.data,
    },
  };
}

export async function loadProgramDetailFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgramRole;
  programId: string;
}): Promise<ProgramLoaderResult<ProgramDetailLoaderResult>> {
  const programResult = await getProgramById({
    supabase: params.supabase,
    organizationId: params.organizationId,
    programId: params.programId,
  });

  if (!programResult.ok) {
    return programResult;
  }

  const capabilities = resolveProgramPermissions(params.role, {
    isArchived: programResult.data.derived.isArchived,
  });

  if (!capabilities.canViewProgram) {
    return { ok: false, error: programUnavailableError() };
  }

  const historyResult = await listProgramStatusHistory({
    supabase: params.supabase,
    organizationId: params.organizationId,
    programId: params.programId,
  });

  let historyState: ProgramDetailLoaderResult["historyState"];
  let history: ProgramDetailLoaderResult["history"] = [];

  if (!capabilities.canViewProgramHistory) {
    historyState = { kind: "hidden" };
  } else if (!historyResult.ok) {
    historyState = {
      kind: "error",
      message: historyResult.error.message,
    };
  } else if (historyResult.data.length === 0) {
    historyState = { kind: "empty" };
  } else {
    historyState = { kind: "ready" };
    history = historyResult.data;
  }

  return {
    ok: true,
    data: {
      organizationId: params.organizationId,
      role: params.role,
      capabilities,
      program: programResult.data,
      history,
      historyState,
    },
  };
}
