/**
 * SMM-B1.11-B — explicit IANA timezone conversion for Social Calendar.
 * Execution instants are UTC. Display and form entry use a named zone.
 * Never falls back to the Vercel/server local timezone.
 */

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export const SOCIAL_CALENDAR_TIMEZONE_OPTIONS = [
  "UTC",
  "Europe/Amsterdam",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export type SocialCalendarTimezoneOption =
  (typeof SOCIAL_CALENDAR_TIMEZONE_OPTIONS)[number];

export type SocialCalendarTimezoneResolution = {
  configured: boolean;
  displayTimeZone: string;
  organizationTimeZone: string | null;
  source: "organization" | "selected" | "unconfigured";
};

export type LocalWallTimeConversionResult =
  | { ok: true; iso: string }
  | {
      ok: false;
      code:
        | "missing_timezone"
        | "invalid_timezone"
        | "invalid_date"
        | "invalid_local_time"
        | "ambiguous_local_time";
    };

export function isValidIanaTimeZone(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveSocialCalendarTimezone(input: {
  organizationTimeZone: string | null | undefined;
  selectedTimeZone?: string | null | undefined;
}): SocialCalendarTimezoneResolution {
  const organization = input.organizationTimeZone?.trim() || null;
  if (organization && isValidIanaTimeZone(organization)) {
    return {
      configured: true,
      displayTimeZone: organization,
      organizationTimeZone: organization,
      source: "organization",
    };
  }

  const selected = input.selectedTimeZone?.trim() || null;
  if (selected && isValidIanaTimeZone(selected)) {
    return {
      configured: true,
      displayTimeZone: selected,
      organizationTimeZone: organization && isValidIanaTimeZone(organization)
        ? organization
        : null,
      source: "selected",
    };
  }

  return {
    configured: false,
    displayTimeZone: "UTC",
    organizationTimeZone: null,
    source: "unconfigured",
  };
}

export function isSocialCalendarDayKey(
  value: string | null | undefined,
): value is string {
  if (!value || !DAY_KEY_RE.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addSocialCalendarDays(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return formatUtcDayKey(next);
}

export function isoWeekStartDayKey(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = utc.getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - mondayOffset);
  return formatUtcDayKey(utc);
}

export function zonedDayKey(instant: Date, timeZone: string): string | null {
  if (!isValidIanaTimeZone(timeZone) || Number.isNaN(instant.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

export function zonedTimeHm(instant: Date, timeZone: string): string | null {
  if (!isValidIanaTimeZone(timeZone) || Number.isNaN(instant.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  if (!hour || !minute) {
    return null;
  }
  return `${hour}:${minute}`;
}

function formatUtcDayKey(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchingZonedInstants(
  date: string,
  time: string,
  timeZone: string,
): Date[] {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const anchor = Date.UTC(year, month - 1, day, hour, minute);
  const matches: Date[] = [];
  const seen = new Set<number>();

  for (
    let offsetMinutes = -14 * 60;
    offsetMinutes <= 14 * 60;
    offsetMinutes += 15
  ) {
    const candidate = new Date(anchor + offsetMinutes * 60 * 1000);
    const dayKey = zonedDayKey(candidate, timeZone);
    const timeHm = zonedTimeHm(candidate, timeZone);
    if (dayKey === date && timeHm === time && !seen.has(candidate.getTime())) {
      seen.add(candidate.getTime());
      matches.push(candidate);
    }
  }

  return matches;
}

/**
 * Convert a local civil date + time in an IANA zone to a unique UTC instant.
 * DST gaps fail as invalid_local_time. DST overlaps fail as ambiguous_local_time.
 * Does not silently pick an offset.
 */
export function convertLocalWallTimeToUtcIso(
  date: string,
  time: string,
  timeZone: string | null | undefined,
): LocalWallTimeConversionResult {
  const zone = timeZone?.trim() ?? "";
  if (!zone) {
    return { ok: false, code: "missing_timezone" };
  }
  if (!isValidIanaTimeZone(zone)) {
    return { ok: false, code: "invalid_timezone" };
  }
  if (!isSocialCalendarDayKey(date) || !TIME_RE.test(time)) {
    return { ok: false, code: "invalid_date" };
  }
  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) {
    return { ok: false, code: "invalid_date" };
  }

  const matches = matchingZonedInstants(date, time, zone);
  if (matches.length === 0) {
    return { ok: false, code: "invalid_local_time" };
  }
  if (matches.length > 1) {
    return { ok: false, code: "ambiguous_local_time" };
  }
  return { ok: true, iso: matches[0].toISOString() };
}

export function getZonedWeekUtcBounds(
  weekStartDayKey: string,
  timeZone: string,
): { startIso: string; endIso: string; days: string[] } | null {
  if (!isSocialCalendarDayKey(weekStartDayKey) || !isValidIanaTimeZone(timeZone)) {
    return null;
  }
  const start = convertLocalWallTimeToUtcIso(weekStartDayKey, "00:00", timeZone);
  const nextWeek = addSocialCalendarDays(weekStartDayKey, 7);
  const end = convertLocalWallTimeToUtcIso(nextWeek, "00:00", timeZone);
  if (!start.ok || !end.ok) {
    return null;
  }
  const days = Array.from({ length: 7 }, (_, index) =>
    addSocialCalendarDays(weekStartDayKey, index),
  );
  return { startIso: start.iso, endIso: end.iso, days };
}

export function formatSocialCalendarInstant(
  iso: string,
  timeZone: string,
): {
  dayKey: string;
  timeLabel: string;
  dateLabel: string;
  zoneLabel: string;
} | null {
  if (!isValidIanaTimeZone(timeZone)) {
    return null;
  }
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }
  const dayKey = zonedDayKey(instant, timeZone);
  const timeLabel = zonedTimeHm(instant, timeZone);
  if (!dayKey || !timeLabel) {
    return null;
  }
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(instant);
  return {
    dayKey,
    timeLabel,
    dateLabel,
    zoneLabel: timeZone,
  };
}

export function socialCalendarTimezoneOptions(
  preferred?: string | null,
): string[] {
  const options: string[] = [...SOCIAL_CALENDAR_TIMEZONE_OPTIONS];
  const extra = preferred?.trim();
  if (extra && isValidIanaTimeZone(extra) && !options.includes(extra)) {
    options.unshift(extra);
  }
  return options;
}
