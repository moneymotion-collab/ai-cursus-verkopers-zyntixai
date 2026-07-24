import type {
  ProgramListItemReadModel,
  ProgramStatusHistoryEntry,
} from "@/features/programs/domain/read-types";

const MISSING_LABEL = "Not provided";

export type ProgramListPresentationRow = {
  id: string;
  name: string;
  detailHref: string;
  statusLabel: string;
  deliveryModeLabel: string;
  openEnrollmentCountLabel: string;
  updatedAtLabel: string;
  archivedLabel: string | null;
};

export function formatProgramDate(isoTimestamp: string, timeZone: string): string {
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

export function formatOptionalProgramDate(
  isoTimestamp: string | null,
  timeZone: string,
): string {
  if (!isoTimestamp) {
    return MISSING_LABEL;
  }
  return formatProgramDate(isoTimestamp, timeZone);
}

export function toProgramListPresentationRow(
  program: ProgramListItemReadModel,
  options: { detailHref: string; timeZone: string },
): ProgramListPresentationRow {
  return {
    id: program.id,
    name: program.name,
    detailHref: options.detailHref,
    statusLabel: program.statusLabel,
    deliveryModeLabel: program.deliveryModeLabel,
    openEnrollmentCountLabel: String(program.openEnrollmentCount),
    updatedAtLabel: formatProgramDate(program.updatedAt, options.timeZone),
    archivedLabel: program.derived.isArchived ? "Archived" : null,
  };
}

const PROGRAM_HISTORY_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  system: "System",
  rpc: "System",
};

export function formatProgramHistorySourceLabel(source: string): string {
  return PROGRAM_HISTORY_SOURCE_LABELS[source] ?? "System";
}

export function formatProgramHistoryTransition(
  entry: ProgramStatusHistoryEntry,
): string {
  if (entry.fromStatusLabel) {
    return `${entry.fromStatusLabel} → ${entry.toStatusLabel}`;
  }
  return `Set to ${entry.toStatusLabel}`;
}

export function formatProgramDescription(description: string | null): string {
  const trimmed = description?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : MISSING_LABEL;
}
