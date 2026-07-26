import { ENROLLMENTS_ROUTE } from "@/features/enrollments/domain/enrollments-navigation";
import {
  buildEnrollmentListQueryString,
  type EnrollmentListUrlState,
} from "@/features/enrollments/ui/enrollment-list-search-params";

/**
 * List/create/detail href builders that preserve list UrlState (filters, sort,
 * pagination). Prefer these over the plain domain navigation helpers within the
 * UI so filter/sort/pagination context survives navigation round-trips.
 */
export function buildEnrollmentsListHref(listState?: EnrollmentListUrlState): string {
  if (!listState) {
    return ENROLLMENTS_ROUTE;
  }
  return `${ENROLLMENTS_ROUTE}${buildEnrollmentListQueryString(listState)}`;
}

export function buildEnrollmentCreateHref(listState?: EnrollmentListUrlState): string {
  const base = `${ENROLLMENTS_ROUTE}/new`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString({
    org: listState.org,
    archived: false,
    sort: listState.sort,
    direction: listState.direction,
    page: 1,
    pageSize: listState.pageSize,
  })}`;
}

export function buildEnrollmentDetailHref(
  enrollmentId: string,
  listState?: EnrollmentListUrlState,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString(listState)}`;
}

export function buildBackToEnrollmentsHref(listState?: EnrollmentListUrlState): string {
  return buildEnrollmentsListHref(listState);
}

export function buildEnrollmentEditHref(
  enrollmentId: string,
  listState?: EnrollmentListUrlState,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}/edit`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString(listState)}`;
}

export function buildEnrollmentStatusHref(
  enrollmentId: string,
  listState?: EnrollmentListUrlState,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}/status`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString(listState)}`;
}

export function buildEnrollmentArchiveHref(
  enrollmentId: string,
  listState?: EnrollmentListUrlState,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}/archive`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString(listState)}`;
}

export function buildEnrollmentRestoreHref(
  enrollmentId: string,
  listState?: EnrollmentListUrlState,
): string {
  const base = `${ENROLLMENTS_ROUTE}/${encodeURIComponent(enrollmentId)}/restore`;
  if (!listState) {
    return base;
  }
  return `${base}${buildEnrollmentListQueryString(listState)}`;
}

export {
  parseEnrollmentListReturnState,
  buildEnrollmentListQueryString,
} from "@/features/enrollments/ui/enrollment-list-search-params";
