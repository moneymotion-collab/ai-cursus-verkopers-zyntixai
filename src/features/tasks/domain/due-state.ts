import type { TaskDueState, TaskDerivedFlags } from "@/features/tasks/domain/read-types";
import type { TaskStatus } from "@/features/tasks/domain/types";

export const DEFAULT_ORGANIZATION_TIMEZONE = "UTC";

export function resolveEffectiveTimezone(timezone: string | null | undefined): string {
  const trimmed = timezone?.trim();
  if (!trimmed) {
    return DEFAULT_ORGANIZATION_TIMEZONE;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch {
    return DEFAULT_ORGANIZATION_TIMEZONE;
  }
}

type CalendarParts = {
  year: number;
  month: number;
  day: number;
};

function parseCalendarParts(date: Date, timeZone: string): CalendarParts | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function calendarKey(parts: CalendarParts): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function compareCalendarKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function getUtcBoundsForOrgCalendarDay(
  timeZone: string,
  reference: Date = new Date(),
): { start: Date; end: Date; dayKey: string } | null {
  const effectiveTimeZone = resolveEffectiveTimezone(timeZone);
  const todayParts = parseCalendarParts(reference, effectiveTimeZone);
  if (!todayParts) {
    return null;
  }

  const dayKey = calendarKey(todayParts);
  const windowStart = reference.getTime() - 36 * 60 * 60 * 1000;
  const windowEnd = reference.getTime() + 36 * 60 * 60 * 1000;

  let startMs: number | null = null;
  let endMs: number | null = null;

  for (let timestamp = windowStart; timestamp <= windowEnd; timestamp += 15 * 60 * 1000) {
    const parts = parseCalendarParts(new Date(timestamp), effectiveTimeZone);
    if (!parts || calendarKey(parts) !== dayKey) {
      continue;
    }

    startMs = startMs === null ? timestamp : Math.min(startMs, timestamp);
    endMs = endMs === null ? timestamp : Math.max(endMs, timestamp);
  }

  if (startMs === null || endMs === null) {
    return null;
  }

  return {
    start: new Date(startMs),
    end: new Date(endMs),
    dayKey,
  };
}

export function deriveTaskFlags(params: {
  status: TaskStatus;
  dueAt: string;
  archivedAt: string | null;
  timeZone: string;
  now?: Date;
}): TaskDerivedFlags {
  const now = params.now ?? new Date();
  const archived = params.archivedAt !== null;
  const terminal = params.status !== "open";

  if (terminal) {
    return {
      terminal: true,
      archived,
      overdue: false,
      dueToday: false,
      upcoming: false,
      dueState: "none",
    };
  }

  const dueDate = new Date(params.dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    return {
      terminal: false,
      archived,
      overdue: false,
      dueToday: false,
      upcoming: false,
      dueState: "none",
    };
  }

  const effectiveTimeZone = resolveEffectiveTimezone(params.timeZone);
  const todayParts = parseCalendarParts(now, effectiveTimeZone);
  const dueParts = parseCalendarParts(dueDate, effectiveTimeZone);

  if (!todayParts || !dueParts) {
    return {
      terminal: false,
      archived,
      overdue: false,
      dueToday: false,
      upcoming: false,
      dueState: "none",
    };
  }

  const todayKey = calendarKey(todayParts);
  const dueKey = calendarKey(dueParts);
  const overdue = dueDate.getTime() < now.getTime();
  const dueToday = compareCalendarKeys(dueKey, todayKey) === 0;
  const upcoming = compareCalendarKeys(dueKey, todayKey) > 0;

  let dueState: TaskDueState = "none";
  if (overdue) {
    dueState = "overdue";
  } else if (dueToday) {
    dueState = "due_today";
  } else if (upcoming) {
    dueState = "upcoming";
  }

  return {
    terminal: false,
    archived,
    overdue,
    dueToday,
    upcoming,
    dueState,
  };
}
