import type { ProgressFactListItemReadModel } from "@/features/progress/domain/read-types";
import { getProgressFactTypeLabel } from "@/features/progress/domain/fact-types";

export function formatProgressDate(isoTimestamp: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoTimestamp));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoTimestamp));
  }
}

export function formatOptionalProgressDate(
  isoTimestamp: string | null | undefined,
  timeZone: string,
): string | null {
  if (!isoTimestamp) {
    return null;
  }
  return formatProgressDate(isoTimestamp, timeZone);
}

export function resolveProgressFactTitle(fact: {
  title: string | null;
  factTypeLabel: string;
}): string {
  const trimmed = fact.title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fact.factTypeLabel;
}

export function resolveProgressCustomerLabel(
  displayName: string | null | undefined,
): string {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown customer";
}

export function resolveProgressProgramLabel(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown program";
}

export function resolveProgressEnrollmentStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return "Unknown status";
  }
  switch (status) {
    case "pending":
      return "Pending";
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export type ProgressListPresentationRow = {
  id: string;
  detailHref: string;
  titleLabel: string;
  factTypeLabel: string;
  customerLabel: string;
  programLabel: string;
  occurredAtLabel: string;
  recorderLabel: string;
  isVoided: boolean;
};

export function toProgressListPresentationRow(
  fact: ProgressFactListItemReadModel,
  options: {
    detailHref: string;
    timeZone: string;
    recorderLabel: string;
  },
): ProgressListPresentationRow {
  return {
    id: fact.id,
    detailHref: options.detailHref,
    titleLabel: resolveProgressFactTitle({
      title: fact.title,
      factTypeLabel: fact.factTypeLabel || getProgressFactTypeLabel(fact.factType),
    }),
    factTypeLabel: fact.factTypeLabel || getProgressFactTypeLabel(fact.factType),
    customerLabel: resolveProgressCustomerLabel(fact.customerDisplayName),
    programLabel: resolveProgressProgramLabel(fact.programName),
    occurredAtLabel: formatProgressDate(fact.occurredAt, options.timeZone),
    recorderLabel: options.recorderLabel,
    isVoided: fact.derived.isVoided,
  };
}
