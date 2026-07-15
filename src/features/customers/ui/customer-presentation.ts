import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";

const MISSING_LABEL = "Not provided";

export type CustomerListPresentationRow = {
  id: string;
  displayName: string;
  detailHref: string;
  statusLabel: string;
  ownerLabel: string;
  emailLabel: string;
  startedAtLabel: string;
  updatedAtLabel: string;
  archivedLabel: string | null;
};

export function formatCustomerDate(isoTimestamp: string, timeZone: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return MISSING_LABEL;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function formatOptionalCustomerDate(
  isoTimestamp: string | null,
  timeZone: string,
): string {
  if (!isoTimestamp) {
    return MISSING_LABEL;
  }
  return formatCustomerDate(isoTimestamp, timeZone);
}

export function toCustomerListPresentationRow(
  customer: CustomerListItemReadModel,
  options: { detailHref: string; timeZone: string },
): CustomerListPresentationRow {
  return {
    id: customer.id,
    displayName: customer.displayName,
    detailHref: options.detailHref,
    statusLabel: customer.statusLabel,
    ownerLabel: customer.ownerLabel,
    emailLabel: customer.email?.trim() || MISSING_LABEL,
    startedAtLabel: formatCustomerDate(customer.startedAt, options.timeZone),
    updatedAtLabel: formatCustomerDate(customer.updatedAt, options.timeZone),
    archivedLabel: customer.derived.isArchived ? "Archived" : null,
  };
}

export function formatCustomerContact(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : MISSING_LABEL;
}

export function formatCustomerName(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : MISSING_LABEL;
}

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function customerPresentationContainsUuid(markup: string): boolean {
  return UUID_PATTERN.test(markup);
}
