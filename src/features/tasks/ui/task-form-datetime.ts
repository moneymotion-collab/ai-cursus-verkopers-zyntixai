import { resolveEffectiveTimezone } from "@/features/tasks/domain/due-state";

export function splitDueAtForForm(
  iso: string,
  timeZone: string,
): { date: string; time: string } | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }

  const effectiveTz = resolveEffectiveTimezone(timeZone);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: effectiveTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: effectiveTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return { date, time: `${hour}:${minute}` };
}

export function combineDueAtFromForm(
  date: string,
  time: string,
  timeZone: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const effectiveTz = resolveEffectiveTimezone(timeZone);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  const anchor = Date.UTC(year, month - 1, day, hour, minute);
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
    const candidate = new Date(anchor + offsetMinutes * 60 * 1000);
    const parts = splitDueAtForForm(candidate.toISOString(), effectiveTz);
    if (parts && parts.date === date && parts.time === time) {
      return candidate.toISOString();
    }
  }

  return null;
}
