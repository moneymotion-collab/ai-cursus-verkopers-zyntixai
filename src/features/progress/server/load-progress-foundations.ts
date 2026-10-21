import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isProgressEnrollmentStatus } from "@/features/progress/domain/fact-types";
import { resolveProgressPermissions } from "@/features/progress/domain/permissions";
import type {
  ProgressDetailLoaderResult,
  ProgressListFilters,
  ProgressListLoaderResult,
  ProgressListSort,
  ProgressPagination,
} from "@/features/progress/domain/read-types";
import type {
  ProgressApplicationError,
  ProgressRole,
} from "@/features/progress/domain/types";
import {
  getProgressFactById,
  listProgressFacts,
} from "@/features/progress/server/progress-read-queries";
import { progressFactUnavailableError } from "@/features/progress/server/normalize-progress-error";

export type ProgressLoaderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProgressApplicationError };

export async function loadProgressListFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgressRole;
  filters?: ProgressListFilters;
  pagination?: ProgressPagination;
  sort?: ProgressListSort;
}): Promise<ProgressLoaderResult<ProgressListLoaderResult>> {
  const capabilities = resolveProgressPermissions(params.role);
  const listResult = await listProgressFacts({
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
        includeVoided: params.filters?.includeVoided === true,
        ...params.filters,
      },
      sort: {
        field: params.sort?.field ?? "occurred_at",
        direction: params.sort?.direction ?? "desc",
      },
      result: listResult.data,
    },
  };
}

export async function loadProgressDetailFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgressRole;
  progressFactId: string;
}): Promise<ProgressLoaderResult<ProgressDetailLoaderResult>> {
  const factResult = await getProgressFactById({
    supabase: params.supabase,
    organizationId: params.organizationId,
    progressFactId: params.progressFactId,
  });

  if (!factResult.ok) {
    return factResult;
  }

  const enrollmentStatus = isProgressEnrollmentStatus(
    factResult.data.enrollment?.status ?? "",
  )
    ? factResult.data.enrollment!.status
    : null;

  const capabilities = resolveProgressPermissions(params.role, {
    isVoided: factResult.data.derived.isVoided,
    enrollmentStatus: enrollmentStatus as
      | import("@/features/progress/domain/types").ProgressEnrollmentStatus
      | null,
    enrollmentArchivedAt: factResult.data.enrollment?.archivedAt ?? null,
  });

  if (!capabilities.canViewFact && !capabilities.canViewVoidedFacts) {
    return { ok: false, error: progressFactUnavailableError() };
  }

  if (factResult.data.derived.isVoided && !capabilities.canViewVoidedFacts) {
    return { ok: false, error: progressFactUnavailableError() };
  }

  return {
    ok: true,
    data: {
      organizationId: params.organizationId,
      role: params.role,
      capabilities,
      fact: factResult.data,
    },
  };
}
