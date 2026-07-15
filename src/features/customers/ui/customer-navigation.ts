import type { CustomerRole } from "@/features/customers/domain/types";
import {
  buildCustomerListQueryString,
  parseCustomerListSearchParams,
  type CustomerListUrlState,
} from "@/features/customers/ui/customer-list-search-params";

export function parseCustomerListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: CustomerRole,
): CustomerListUrlState {
  return parseCustomerListSearchParams(raw, { role }).urlState;
}

export function buildBackToCustomersHref(listState: CustomerListUrlState): string {
  return `/customers${buildCustomerListQueryString(listState)}`;
}

export function buildCustomerDetailHref(
  customerId: string,
  listState: CustomerListUrlState,
): string {
  const query = buildCustomerListQueryString(listState);
  return `/customers/${customerId}${query}`;
}

export function buildTaskDetailHrefFromCustomer(
  taskId: string,
  organizationId: string,
): string {
  const params = new URLSearchParams();
  params.set("org", organizationId);
  return `/tasks/${taskId}?${params.toString()}`;
}

export function buildCustomerCreateHref(listState: CustomerListUrlState): string {
  return `/customers/new${buildCustomerListQueryString(listState)}`;
}

export function buildCustomerEditHref(
  customerId: string,
  listState: CustomerListUrlState,
): string {
  return `/customers/${customerId}/edit${buildCustomerListQueryString(listState)}`;
}

export function buildCustomerStatusHref(
  customerId: string,
  listState: CustomerListUrlState,
): string {
  return `/customers/${customerId}/status${buildCustomerListQueryString(listState)}`;
}

export function buildCustomerArchiveHref(
  customerId: string,
  listState: CustomerListUrlState,
): string {
  return `/customers/${customerId}/archive${buildCustomerListQueryString(listState)}`;
}

export function buildCustomerRestoreHref(
  customerId: string,
  listState: CustomerListUrlState,
): string {
  return `/customers/${customerId}/restore${buildCustomerListQueryString(listState)}`;
}
