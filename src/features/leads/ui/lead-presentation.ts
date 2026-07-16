import type { LeadListItemReadModel } from "@/features/leads/domain/read-types";

const MISSING_LABEL = "Not provided";

export type LeadListPresentationRow = {
  id: string;
  displayName: string;
  detailHref: string;
  statusLabel: string;
  stageLabel: string;
  ownerLabel: string;
  emailLabel: string;
  sourceLabel: string;
  pursuitLabel: string;
  updatedAtLabel: string;
  archivedLabel: string | null;
  convertedLabel: string | null;
};

export function formatLeadDate(isoTimestamp: string, timeZone: string): string {
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

export function formatOptionalLeadDate(
  isoTimestamp: string | null,
  timeZone: string,
): string {
  if (!isoTimestamp) {
    return MISSING_LABEL;
  }
  return formatLeadDate(isoTimestamp, timeZone);
}

export function toLeadListPresentationRow(
  lead: LeadListItemReadModel,
  options: { detailHref: string; timeZone: string },
): LeadListPresentationRow {
  return {
    id: lead.id,
    displayName: lead.displayName,
    detailHref: options.detailHref,
    statusLabel: lead.statusLabel,
    stageLabel: lead.stageName,
    ownerLabel: lead.ownerLabel,
    emailLabel: lead.email?.trim() || MISSING_LABEL,
    sourceLabel: lead.sourceType?.trim() || MISSING_LABEL,
    pursuitLabel: lead.pursuitLabel?.trim() || MISSING_LABEL,
    updatedAtLabel: formatLeadDate(lead.updatedAt, options.timeZone),
    archivedLabel: lead.derived.isArchived ? "Archived" : null,
    convertedLabel: lead.derived.isConverted ? "Converted" : null,
  };
}

export function formatLeadContact(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : MISSING_LABEL;
}

export function formatLeadName(
  firstName: string | null,
  lastName: string | null,
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : MISSING_LABEL;
}
