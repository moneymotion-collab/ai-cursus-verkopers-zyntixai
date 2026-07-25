import type {
  EnrollmentListItemReadModel,
  EnrollmentStatusHistoryEntry,
} from "@/features/enrollments/domain/read-types";

export const MISSING_LABEL = "Not provided";

export type EnrollmentListPresentationRow = {
  id: string;
  customerLabel: string;
  programLabel: string;
  statusLabel: string;
  ownerLabel: string;
  enrolledAtLabel: string;
  detailHref: string;
  archivedLabel: string | null;
};

export function formatEnrollmentDate(isoTimestamp: string, timeZone: string): string {
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

export function formatOptionalEnrollmentDate(
  isoTimestamp: string | null,
  timeZone: string,
): string {
  if (!isoTimestamp) {
    return MISSING_LABEL;
  }
  return formatEnrollmentDate(isoTimestamp, timeZone);
}

const ENROLLMENT_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  lead_conversion: "Lead conversion",
  import: "Import",
  integration: "Integration",
  system: "System",
};

export function formatEnrollmentSourceLabel(source: string): string {
  return ENROLLMENT_SOURCE_LABELS[source] ?? "System";
}

export function formatEnrollmentHistoryTransition(
  entry: EnrollmentStatusHistoryEntry,
): string {
  if (entry.fromStatusLabel) {
    return `${entry.fromStatusLabel} → ${entry.toStatusLabel}`;
  }
  return `Set to ${entry.toStatusLabel}`;
}

export function toEnrollmentListPresentationRow(
  enrollment: EnrollmentListItemReadModel,
  options: { detailHref: string; timeZone: string; ownerLabel: string },
): EnrollmentListPresentationRow {
  return {
    id: enrollment.id,
    customerLabel: enrollment.customerDisplayName ?? MISSING_LABEL,
    programLabel: enrollment.programName ?? MISSING_LABEL,
    statusLabel: enrollment.statusLabel,
    ownerLabel: options.ownerLabel,
    enrolledAtLabel: formatEnrollmentDate(enrollment.enrolledAt, options.timeZone),
    detailHref: options.detailHref,
    archivedLabel: enrollment.derived.isArchived ? "Archived" : null,
  };
}
