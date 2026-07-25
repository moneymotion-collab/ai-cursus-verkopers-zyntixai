import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";
import type {
  EnrollmentDetailLoaderResult,
  EnrollmentListFilters,
  EnrollmentListLoaderResult,
  EnrollmentListSort,
  EnrollmentPagination,
} from "@/features/enrollments/domain/read-types";
import type {
  EnrollmentApplicationError,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";
import {
  getEnrollmentById,
  listEnrollments,
  listEnrollmentStatusHistory,
} from "@/features/enrollments/server/enrollment-read-queries";
import { enrollmentUnavailableError } from "@/features/enrollments/server/normalize-enrollment-error";

export type EnrollmentLoaderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: EnrollmentApplicationError };

export async function loadEnrollmentsListFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: EnrollmentRole;
  filters?: EnrollmentListFilters;
  pagination?: EnrollmentPagination;
  sort?: EnrollmentListSort;
}): Promise<EnrollmentLoaderResult<EnrollmentListLoaderResult>> {
  const capabilities = resolveEnrollmentPermissions(params.role);
  const listResult = await listEnrollments({
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
        field: params.sort?.field ?? "enrolled_at",
        direction: params.sort?.direction ?? "desc",
      },
      result: listResult.data,
    },
  };
}

export async function loadEnrollmentDetailFoundation(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: EnrollmentRole;
  enrollmentId: string;
}): Promise<EnrollmentLoaderResult<EnrollmentDetailLoaderResult>> {
  const enrollmentResult = await getEnrollmentById({
    supabase: params.supabase,
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
  });

  if (!enrollmentResult.ok) {
    return enrollmentResult;
  }

  const capabilities = resolveEnrollmentPermissions(params.role, {
    isArchived: enrollmentResult.data.derived.isArchived,
  });

  if (!capabilities.canViewEnrollment) {
    return { ok: false, error: enrollmentUnavailableError() };
  }

  const historyResult = await listEnrollmentStatusHistory({
    supabase: params.supabase,
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
  });

  let historyState: EnrollmentDetailLoaderResult["historyState"];
  let history: EnrollmentDetailLoaderResult["history"] = [];

  if (!capabilities.canViewEnrollmentHistory) {
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
      enrollment: enrollmentResult.data,
      history,
      historyState,
    },
  };
}
