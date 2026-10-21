/**
 * SMM-B1.11-B — Social Calendar view-model contracts.
 * Source of truth remains social_publications.intended_execute_at.
 * Schedule slots are never treated as the execution clock.
 */

import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { canScheduleSocialPublication } from "./permissions";
import {
  resolveSocialPublicationScheduleEligibility,
  type SocialScheduleEligibility,
} from "./scheduling";
import type { SocialPublicationStatus } from "./publishing";
import {
  addSocialCalendarDays,
  formatSocialCalendarInstant,
  getZonedWeekUtcBounds,
  isSocialCalendarDayKey,
  isoWeekStartDayKey,
  zonedDayKey,
} from "./calendar-timezone";

export const SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED = false as const;

export type SocialCalendarStatusKind =
  | "scheduled_future"
  | "scheduled_due"
  | "claimed"
  | "processing"
  | "succeeded"
  | "failed_retryable"
  | "failed_terminal"
  | "manual_intervention"
  | "schedule_missed"
  | "unknown_external_outcome"
  | "cancelled"
  | "ready_to_schedule";

export type SocialCalendarItemView = {
  publicationId: string;
  provider: string;
  providerLabel: string;
  executionMode: string;
  intendedExecuteAt: string;
  localDayKey: string;
  localTimeLabel: string;
  localDateLabel: string;
  timeZone: string;
  status: string;
  calendarStatus: SocialCalendarStatusKind;
  statusLabel: string;
  contentFormat: string | null;
  contentFormatLabel: string;
  contentSummary: string;
  hasMedia: boolean;
  connectionDisplayName: string | null;
  accountLabel: string;
  lastFailureClass: string | null;
  canSchedule: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  canRecoverMissed: boolean;
};

export type SocialCalendarEligiblePublication = {
  publicationId: string;
  providerLabel: string;
  contentFormatLabel: string;
  contentSummary: string;
  accountLabel: string;
  status: string;
  canSchedule: boolean;
};

export type SocialCalendarHrefState = {
  weekStartDay: string;
  selectedDay: string;
  timeZoneParam: string | null;
};

export function resolveSocialCalendarStatusKind(input: {
  status: SocialPublicationStatus | string;
  executionMode: string;
  intendedExecuteAt: string;
  now: Date;
  lastFailureClass?: string | null;
}): SocialCalendarStatusKind {
  if (input.status === "claimed") return "claimed";
  if (input.status === "processing") return "processing";
  if (input.status === "succeeded") return "succeeded";
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "failed_retryable") return "failed_retryable";
  if (input.status === "failed_terminal") return "failed_terminal";
  if (input.status === "manual_intervention" && input.lastFailureClass === "schedule_missed") {
    return "schedule_missed";
  }
  if (input.status === "manual_intervention") return "manual_intervention";
  if (input.status === "unknown_external_outcome") {
    return "unknown_external_outcome";
  }
  if (input.executionMode !== "scheduled") {
    return "ready_to_schedule";
  }
  const dueAt = Date.parse(input.intendedExecuteAt);
  if (Number.isFinite(dueAt) && dueAt <= input.now.getTime()) {
    return "scheduled_due";
  }
  return "scheduled_future";
}

export function socialCalendarStatusLabel(
  kind: SocialCalendarStatusKind,
): string {
  switch (kind) {
    case "scheduled_future":
      return "Scheduled";
    case "scheduled_due":
      return "Due";
    case "claimed":
      return "Claimed";
    case "processing":
      return "Processing";
    case "succeeded":
      return "Published";
    case "failed_retryable":
      return "Failed (retryable)";
    case "failed_terminal":
      return "Failed";
    case "manual_intervention":
      return "Needs attention";
    case "schedule_missed":
      return "Missed";
    case "unknown_external_outcome":
      return "Unknown outcome";
    case "cancelled":
      return "Cancelled";
    case "ready_to_schedule":
      return "Ready to schedule";
  }
}

export function providerDisplayLabel(provider: string): string {
  if (provider === "instagram") return "Instagram";
  return provider;
}

export function contentFormatDisplayLabel(
  contentFormat: string | null | undefined,
): string {
  if (!contentFormat) return "Content";
  if (contentFormat === "image") return "Image";
  if (contentFormat === "carousel") return "Carousel";
  if (contentFormat === "short_video") return "Short video";
  if (contentFormat === "story") return "Story";
  return contentFormat.replace(/_/g, " ");
}

export function summarizeCalendarContent(input: {
  title: string | null | undefined;
  caption: string | null | undefined;
  contentFormat: string | null | undefined;
}): string {
  const title = input.title?.trim();
  if (title) {
    return title.length > 80 ? `${title.slice(0, 77)}…` : title;
  }
  const caption = input.caption?.trim();
  if (caption) {
    return caption.length > 120 ? `${caption.slice(0, 117)}…` : caption;
  }
  return `Untitled ${contentFormatDisplayLabel(input.contentFormat).toLowerCase()}`;
}

export function resolveCalendarMutationFlags(input: {
  role: OrganizationRole | string | null | undefined;
  membershipStatus?: string | null;
  eligibility: SocialScheduleEligibility;
}): { canSchedule: boolean; canReschedule: boolean; canCancel: boolean } {
  const actorMay = canScheduleSocialPublication(
    input.role,
    input.membershipStatus ?? "active",
  );
  return {
    canSchedule: actorMay && input.eligibility.schedule,
    canReschedule: actorMay && input.eligibility.reschedule,
    canCancel: actorMay && input.eligibility.cancelScheduled,
  };
}

export function publicationIsScheduledCalendarItem(input: {
  executionMode: string;
  intendedExecuteAt: string;
  visibleStartIso: string;
  visibleEndIso: string;
}): boolean {
  if (input.executionMode !== "scheduled") {
    return false;
  }
  return (
    input.intendedExecuteAt >= input.visibleStartIso &&
    input.intendedExecuteAt < input.visibleEndIso
  );
}

export function groupCalendarItemsByDay(
  items: SocialCalendarItemView[],
  days: readonly string[],
): Record<string, SocialCalendarItemView[]> {
  const grouped: Record<string, SocialCalendarItemView[]> = {};
  for (const day of days) {
    grouped[day] = [];
  }
  for (const item of items) {
    const bucket = grouped[item.localDayKey];
    if (bucket) {
      bucket.push(item);
    }
  }
  for (const day of days) {
    grouped[day].sort((left, right) =>
      left.intendedExecuteAt.localeCompare(right.intendedExecuteAt),
    );
  }
  return grouped;
}

export function resolveSocialCalendarHrefState(input: {
  weekParam: string | undefined;
  dayParam: string | undefined;
  timeZone: string;
  now: Date;
}): SocialCalendarHrefState {
  const todayKey =
    zonedDayKey(input.now, input.timeZone) ??
    input.now.toISOString().slice(0, 10);
  const requestedWeek = input.weekParam?.trim();
  const weekStartDay = isSocialCalendarDayKey(requestedWeek)
    ? isoWeekStartDayKey(requestedWeek)
    : isoWeekStartDayKey(todayKey);
  const requestedDay = input.dayParam?.trim();
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addSocialCalendarDays(weekStartDay, index),
  );
  const selectedDay =
    requestedDay && weekDays.includes(requestedDay)
      ? requestedDay
      : weekDays.includes(todayKey)
        ? todayKey
        : weekStartDay;
  return {
    weekStartDay,
    selectedDay,
    timeZoneParam: null,
  };
}

export function calendarWeekBoundsOrNull(
  weekStartDay: string,
  timeZone: string,
) {
  return getZonedWeekUtcBounds(isoWeekStartDayKey(weekStartDay), timeZone);
}

export function projectPublicationToCalendarItem(input: {
  publicationId: string;
  provider: string;
  executionMode: string;
  intendedExecuteAt: string;
  status: string;
  contentFormat: string | null;
  title: string | null;
  caption: string | null;
  hasMedia: boolean;
  connectionDisplayName: string | null;
  timeZone: string;
  now: Date;
  role: OrganizationRole | string | null | undefined;
  lastFailureClass?: string | null;
}): SocialCalendarItemView | null {
  if (input.executionMode !== "scheduled") {
    return null;
  }
  const formatted = formatSocialCalendarInstant(
    input.intendedExecuteAt,
    input.timeZone,
  );
  if (!formatted) {
    return null;
  }
  const eligibility = resolveSocialPublicationScheduleEligibility({
    status: input.status,
    executionMode: input.executionMode,
  });
  const flags = resolveCalendarMutationFlags({
    role: input.role,
    eligibility,
  });
  const calendarStatus = resolveSocialCalendarStatusKind({
    status: input.status,
    executionMode: input.executionMode,
    intendedExecuteAt: input.intendedExecuteAt,
    now: input.now,
    lastFailureClass: input.lastFailureClass,
  });
  const canRecoverMissed =
    canScheduleSocialPublication(input.role, "active") &&
    input.status === "manual_intervention" &&
    input.lastFailureClass === "schedule_missed";
  const accountLabel =
    input.connectionDisplayName?.trim() ||
    `${providerDisplayLabel(input.provider)} account`;
  return {
    publicationId: input.publicationId,
    provider: input.provider,
    providerLabel: providerDisplayLabel(input.provider),
    executionMode: input.executionMode,
    intendedExecuteAt: input.intendedExecuteAt,
    localDayKey: formatted.dayKey,
    localTimeLabel: formatted.timeLabel,
    localDateLabel: formatted.dateLabel,
    timeZone: formatted.zoneLabel,
    status: input.status,
    calendarStatus,
    statusLabel: socialCalendarStatusLabel(calendarStatus),
    contentFormat: input.contentFormat,
    contentFormatLabel: contentFormatDisplayLabel(input.contentFormat),
    contentSummary: summarizeCalendarContent({
      title: input.title,
      caption: input.caption,
      contentFormat: input.contentFormat,
    }),
    hasMedia: input.hasMedia,
    connectionDisplayName: input.connectionDisplayName,
    accountLabel,
    lastFailureClass: input.lastFailureClass ?? null,
    canSchedule: flags.canSchedule,
    canReschedule: flags.canReschedule,
    canCancel: flags.canCancel,
    canRecoverMissed,
  };
}

export function userSafeSocialScheduleActionMessage(
  code: string | undefined,
): string {
  switch (code) {
    case "forbidden":
      return "Only Owner or Admin may change this schedule.";
    case "unauthorized":
      return "Sign in is required.";
    case "invalid_time":
      return "Schedule must be in the future.";
    case "invalid_request":
      return "Choose a valid date, time, and timezone.";
    case "not_found":
      return "That publication was not found in this organization.";
    case "conflict":
      return "This publication can no longer be changed because its status changed.";
    case "not_scheduled":
      return "This publication is not scheduled.";
    case "workflow_not_ready":
      return "This content is not ready to schedule yet.";
    case "connection_ineligible":
      return "The connected account is not eligible for scheduling.";
    case "feature_disabled":
      return "Social scheduling is unavailable in this environment.";
    default:
      return "Unable to update the schedule. Try again.";
  }
}

export function userSafeLocalTimeConversionMessage(
  code: LocalWallTimeConversionFailureCode,
): string {
  switch (code) {
    case "missing_timezone":
      return "Select a timezone before scheduling.";
    case "invalid_timezone":
      return "Choose a valid timezone such as Europe/Amsterdam.";
    case "invalid_date":
      return "Enter a valid date and time.";
    case "invalid_local_time":
      return "That local time does not exist on this date (DST). Choose another time.";
    case "ambiguous_local_time":
      return "That local time is ambiguous on this date (DST). Choose another time.";
  }
}

type LocalWallTimeConversionFailureCode =
  | "missing_timezone"
  | "invalid_timezone"
  | "invalid_date"
  | "invalid_local_time"
  | "ambiguous_local_time";

export function summarizeScheduledOverview(input: {
  publications: Array<{
    executionMode: string;
    status: string;
    intendedExecuteAt: string;
  }>;
  visibleStartIso: string;
  visibleEndIso: string;
  nowIso: string;
}): {
  scheduledThisWeek: number;
  nextScheduledAt: string | null;
} {
  const scheduled = input.publications.filter(
    (publication) =>
      publication.executionMode === "scheduled" &&
      publication.status !== "cancelled" &&
      publication.status !== "succeeded",
  );
  const scheduledThisWeek = scheduled.filter((publication) =>
    publicationIsScheduledCalendarItem({
      executionMode: publication.executionMode,
      intendedExecuteAt: publication.intendedExecuteAt,
      visibleStartIso: input.visibleStartIso,
      visibleEndIso: input.visibleEndIso,
    }),
  ).length;
  const upcoming = scheduled
    .filter((publication) => publication.intendedExecuteAt > input.nowIso)
    .sort((left, right) =>
      left.intendedExecuteAt.localeCompare(right.intendedExecuteAt),
    );
  return {
    scheduledThisWeek,
    nextScheduledAt: upcoming[0]?.intendedExecuteAt ?? null,
  };
}
