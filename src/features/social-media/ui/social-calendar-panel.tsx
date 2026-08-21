"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  addSocialCalendarDays,
  convertLocalWallTimeToUtcIso,
  isoWeekStartDayKey,
  zonedDayKey,
} from "@/features/social-media/domain/calendar-timezone";
import {
  SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED,
  groupCalendarItemsByDay,
  userSafeLocalTimeConversionMessage,
  userSafeSocialScheduleActionMessage,
  type SocialCalendarEligiblePublication,
  type SocialCalendarItemView,
} from "@/features/social-media/domain/calendar";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
import {
  cancelScheduledSocialPublicationAction,
  rescheduleSocialPublicationAction,
  scheduleSocialPublicationAction,
} from "@/features/social-media/actions/schedule-social-publication-actions";
import styles from "./social-calendar-panel.module.css";

type FormMode = "idle" | "schedule" | "reschedule";

type SocialCalendarPanelProps = {
  organizationId: string;
  timeZone: string;
  timezoneConfigured: boolean;
  timezoneOptions: string[];
  weekStartDay: string;
  selectedDay: string;
  items: SocialCalendarItemView[];
  eligibleToSchedule: SocialCalendarEligiblePublication[];
  canMutateSchedule: boolean;
  loadError: string | null;
  explicitPublicationId: string | null;
  readOnly: boolean;
};

function weekdayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function weekRangeLabel(weekStartDay: string): string {
  const weekEnd = addSocialCalendarDays(weekStartDay, 6);
  return `${weekStartDay} – ${weekEnd}`;
}

export function SocialCalendarPanel({
  organizationId,
  timeZone,
  timezoneConfigured,
  timezoneOptions,
  weekStartDay,
  selectedDay,
  items,
  eligibleToSchedule,
  canMutateSchedule,
  loadError,
  explicitPublicationId,
  readOnly,
}: SocialCalendarPanelProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<FormMode>(() =>
    explicitPublicationId && canMutateSchedule ? "schedule" : "idle",
  );
  const [targetPublicationId, setTargetPublicationId] = useState(
    explicitPublicationId ?? "",
  );
  const [dateValue, setDateValue] = useState(selectedDay);
  const [timeValue, setTimeValue] = useState("09:00");
  const [selectedTimeZone, setSelectedTimeZone] = useState(timeZone);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
    field?: "date" | "time" | "timezone" | "publication";
  } | null>(null);
  const [cancelArmedId, setCancelArmedId] = useState<string | null>(null);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addSocialCalendarDays(weekStartDay, index),
      ),
    [weekStartDay],
  );
  const grouped = useMemo(
    () => groupCalendarItemsByDay(items, days),
    [items, days],
  );
  const todayKey = zonedDayKey(new Date(), timeZone);
  const selectedItems = grouped[selectedDay] ?? [];
  const effectiveZone = timezoneConfigured ? timeZone : selectedTimeZone;
  const mutationsAllowed = canMutateSchedule && !readOnly;
  const tzQuery = timezoneConfigured ? undefined : effectiveZone;

  function calendarHref(next: { week?: string; day?: string; tz?: string }) {
    return buildSocialWorkspaceHref({
      organizationId,
      section: "calendar",
      week: next.week ?? weekStartDay,
      day: next.day ?? selectedDay,
      timeZone: next.tz ?? tzQuery,
    });
  }

  const previousWeek = addSocialCalendarDays(weekStartDay, -7);
  const nextWeek = addSocialCalendarDays(weekStartDay, 7);
  const todayWeek = todayKey ? isoWeekStartDayKey(todayKey) : weekStartDay;

  function runMutation(label: string, work: () => Promise<void>) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setFeedback(null);
    startTransition(async () => {
      try {
        await work();
      } catch {
        setFeedback({
          kind: "error",
          message: `${label} failed. Try again.`,
        });
      } finally {
        pendingRef.current = false;
      }
    });
  }

  function convertFormInstant():
    | { ok: true; iso: string }
    | { ok: false; message: string; field: "date" | "time" | "timezone" } {
    if (!effectiveZone) {
      return {
        ok: false,
        message: userSafeLocalTimeConversionMessage("missing_timezone"),
        field: "timezone",
      };
    }
    const converted = convertLocalWallTimeToUtcIso(
      dateValue,
      timeValue,
      effectiveZone,
    );
    if (!converted.ok) {
      return {
        ok: false,
        message: userSafeLocalTimeConversionMessage(converted.code),
        field:
          converted.code === "missing_timezone" ||
          converted.code === "invalid_timezone"
            ? "timezone"
            : converted.code === "invalid_date"
              ? "date"
              : "time",
      };
    }
    return { ok: true, iso: converted.iso };
  }

  function onSchedule(kind: "schedule" | "reschedule") {
    if (!mutationsAllowed) return;
    const publicationId = targetPublicationId.trim();
    if (!publicationId) {
      setFeedback({
        kind: "error",
        message: "Choose a publication to schedule.",
        field: "publication",
      });
      return;
    }
    const instant = convertFormInstant();
    if (!instant.ok) {
      setFeedback({
        kind: "error",
        message: instant.message,
        field: instant.field,
      });
      return;
    }
    runMutation(kind === "schedule" ? "Schedule" : "Reschedule", async () => {
      const result =
        kind === "schedule"
          ? await scheduleSocialPublicationAction({
              organizationId,
              publicationId,
              intendedExecuteAt: instant.iso,
            })
          : await rescheduleSocialPublicationAction({
              organizationId,
              publicationId,
              intendedExecuteAt: instant.iso,
            });
      if (!result.ok) {
        setFeedback({
          kind: "error",
          message: userSafeSocialScheduleActionMessage(result.code),
        });
        return;
      }
      setFeedback({
        kind: "success",
        message:
          kind === "schedule"
            ? "Scheduled. The same publication now appears on the calendar."
            : "Rescheduled. The previous time was replaced; no duplicate was created.",
      });
      setMode("idle");
      router.refresh();
    });
  }

  function onCancel(publicationId: string) {
    if (!mutationsAllowed) return;
    runMutation("Cancel schedule", async () => {
      const result = await cancelScheduledSocialPublicationAction({
        organizationId,
        publicationId,
      });
      if (!result.ok) {
        setFeedback({
          kind: "error",
          message: userSafeSocialScheduleActionMessage(result.code),
        });
        return;
      }
      setFeedback({
        kind: "success",
        message: "Schedule cancelled. The publication remains in history.",
      });
      setCancelArmedId(null);
      setMode("idle");
      router.refresh();
    });
  }

  function openSchedule(publicationId: string, nextMode: FormMode) {
    const existing = items.find((item) => item.publicationId === publicationId);
    setTargetPublicationId(publicationId);
    setDateValue(existing?.localDayKey ?? selectedDay);
    if (existing?.localTimeLabel) {
      setTimeValue(existing.localTimeLabel);
    }
    setMode(nextMode);
    setFeedback(null);
  }

  const scheduleTarget =
    eligibleToSchedule.find((row) => row.publicationId === targetPublicationId) ??
    items.find((row) => row.publicationId === targetPublicationId) ??
    null;

  return (
    <section className={styles.calendar} aria-labelledby="social-calendar-title">
      <h2 id="social-calendar-title">Calendar</h2>
      <p className={styles.copy}>
        Schedule approved publications for an exact date and time. Times are
        shown in {effectiveZone}.
      </p>
      {!SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED ? (
        <p className={styles.notice} role="note">
          Automatic execution is not enabled in this rollout yet. Scheduling
          stores the intended time; ZyntixAI will not post automatically until
          that capability is turned on.
        </p>
      ) : null}

      {!timezoneConfigured ? (
        <p className={styles.notice} role="status">
          Select a timezone before scheduling. The organization timezone is not
          configured, so times will not use the server timezone.
        </p>
      ) : (
        <p className={styles.meta}>Organization timezone: {timeZone}</p>
      )}

      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}{" "}
          <a href={calendarHref({})}>Retry</a>
        </p>
      ) : null}

      {feedback ? (
        <p
          className={feedback.kind === "error" ? styles.error : styles.success}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.toolbar}>
        <a className={styles.navButton} href={calendarHref({ week: previousWeek, day: previousWeek })}>
          Previous week
        </a>
        <p className={styles.weekLabel}>{weekRangeLabel(weekStartDay)}</p>
        <a className={styles.navButton} href={calendarHref({ week: nextWeek, day: nextWeek })}>
          Next week
        </a>
        {todayKey ? (
          <a
            className={styles.navButton}
            href={calendarHref({ week: todayWeek, day: todayKey })}
          >
            Today
          </a>
        ) : null}
        <label className={styles.label} htmlFor="calendar-timezone">
          Timezone
        </label>
        <select
          id="calendar-timezone"
          className={styles.select}
          value={effectiveZone}
          disabled={timezoneConfigured || pending}
          aria-invalid={feedback?.field === "timezone"}
          aria-describedby="calendar-timezone-help"
          onChange={(event) => {
            const next = event.target.value;
            setSelectedTimeZone(next);
            router.push(calendarHref({ tz: next }));
          }}
        >
          {timezoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p id="calendar-timezone-help" className={styles.srOnly}>
          Scheduling uses this IANA timezone. It does not change organization access.
        </p>
      </div>

      <div className={styles.mobileDayNav} aria-label="Select day">
        {days.map((day) => (
          <a
            key={`mobile-${day}`}
            className={styles.navButton}
            href={calendarHref({ day })}
            aria-current={day === selectedDay ? "date" : undefined}
          >
            {weekdayLabel(day)}
            {day === todayKey ? " · today" : ""}
          </a>
        ))}
      </div>

      <div className={styles.weekGrid} role="grid" aria-label="Scheduled week">
        {days.map((day) => {
          const dayItems = grouped[day] ?? [];
          return (
            <div
              key={day}
              className={`${styles.dayColumn} ${
                day === todayKey ? styles.dayColumnToday : ""
              } ${day === selectedDay ? styles.dayColumnSelected : ""}`}
              role="gridcell"
            >
              <a
                className={styles.dayButton}
                href={calendarHref({ day })}
                aria-current={day === selectedDay ? "date" : undefined}
              >
                {weekdayLabel(day)}
                {day === todayKey ? " · today" : ""}
              </a>
              {dayItems.length === 0 ? (
                <p className={styles.meta}>None</p>
              ) : (
                dayItems.map((item) => (
                  <p key={item.publicationId} className={styles.dayItem}>
                    <strong>{item.localTimeLabel}</strong>
                    {` ${item.contentSummary} · ${item.statusLabel}`}
                  </p>
                ))
              )}
            </div>
          );
        })}
      </div>

      <section className={styles.detail} aria-labelledby="calendar-day-detail-title">
        <h2 id="calendar-day-detail-title">
          {selectedDay} in {effectiveZone}
        </h2>
        {selectedItems.length === 0 ? (
          <p className={styles.empty}>
            No scheduled publications on this day. Approved content can be
            scheduled below.
          </p>
        ) : (
          <ul className={styles.detailList}>
            {selectedItems.map((item) => (
              <li key={item.publicationId} className={styles.card}>
                <h3>{item.contentSummary}</h3>
                <p>
                  {item.localTimeLabel} {item.timeZone} · {item.providerLabel} ·{" "}
                  {item.contentFormatLabel} · {item.accountLabel}
                </p>
                <p className={styles.meta}>
                  {item.statusLabel}
                  {item.calendarStatus === "scheduled_future"
                    ? ` · Scheduled for ${item.localTimeLabel}`
                    : ""}
                  {item.calendarStatus === "scheduled_due"
                    ? " · Intended time has passed; automatic execution is not enabled yet"
                    : ""}
                  {item.hasMedia ? " · Media attached" : ""}
                </p>
                {mutationsAllowed && (item.canReschedule || item.canCancel) ? (
                  <div className={styles.actions}>
                    {item.canReschedule ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={pending}
                        onClick={() =>
                          openSchedule(item.publicationId, "reschedule")
                        }
                      >
                        Reschedule
                      </button>
                    ) : null}
                    {item.canCancel ? (
                      cancelArmedId === item.publicationId ? (
                        <>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            disabled={pending}
                            onClick={() => onCancel(item.publicationId)}
                          >
                            Confirm cancel
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={pending}
                            onClick={() => setCancelArmedId(null)}
                          >
                            Keep scheduled
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={pending}
                          onClick={() => setCancelArmedId(item.publicationId)}
                        >
                          Cancel schedule
                        </button>
                      )
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {items.length === 0 && !loadError ? (
        <p className={styles.empty} role="status">
          No scheduled content this week. Approved publications can be scheduled
          for an exact future date and time.
        </p>
      ) : null}

      {mutationsAllowed ? (
        <section className={styles.formCard} aria-labelledby="calendar-schedule-form-title">
          <h2 id="calendar-schedule-form-title">
            {mode === "reschedule" ? "Reschedule publication" : "Schedule publication"}
          </h2>
          {eligibleToSchedule.length === 0 && mode !== "reschedule" ? (
            <p className={styles.empty}>
              No eligible publication is ready to schedule. Prepare approved
              image content first.
            </p>
          ) : (
            <form
              className={styles.formGrid}
              onSubmit={(event) => {
                event.preventDefault();
                onSchedule(mode === "reschedule" ? "reschedule" : "schedule");
              }}
              noValidate
            >
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label className={styles.label} htmlFor="calendar-publication">
                  Publication
                </label>
                <select
                  id="calendar-publication"
                  className={styles.select}
                  value={targetPublicationId}
                  disabled={pending || mode === "reschedule"}
                  aria-invalid={feedback?.field === "publication"}
                  onChange={(event) => setTargetPublicationId(event.target.value)}
                >
                  <option value="">Select a publication</option>
                  {(mode === "reschedule"
                    ? items.filter((item) => item.canReschedule)
                    : eligibleToSchedule
                  ).map((row) => (
                    <option key={row.publicationId} value={row.publicationId}>
                      {row.contentSummary} · {row.accountLabel}
                    </option>
                  ))}
                </select>
              </div>
              {scheduleTarget ? (
                <p className={`${styles.meta} ${styles.fieldWide}`}>
                  {scheduleTarget.providerLabel} ·{" "}
                  {"contentFormatLabel" in scheduleTarget
                    ? scheduleTarget.contentFormatLabel
                    : ""}{" "}
                  · {scheduleTarget.accountLabel}
                </p>
              ) : null}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="calendar-date">
                  Date
                </label>
                <input
                  id="calendar-date"
                  className={styles.dateInput}
                  type="date"
                  value={dateValue}
                  disabled={pending}
                  aria-invalid={feedback?.field === "date"}
                  aria-describedby="calendar-datetime-help"
                  onChange={(event) => setDateValue(event.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="calendar-time">
                  Time
                </label>
                <input
                  id="calendar-time"
                  className={styles.timeInput}
                  type="time"
                  value={timeValue}
                  disabled={pending}
                  aria-invalid={feedback?.field === "time"}
                  aria-describedby="calendar-datetime-help"
                  onChange={(event) => setTimeValue(event.target.value)}
                  required
                />
              </div>
              <p id="calendar-datetime-help" className={`${styles.meta} ${styles.fieldWide}`}>
                Local time in {effectiveZone}. The server stores an unambiguous UTC
                timestamp. Schedule must be in the future.
              </p>
              <div className={`${styles.actions} ${styles.fieldWide}`}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={pending || (!timezoneConfigured && !selectedTimeZone)}
                >
                  {pending
                    ? "Saving…"
                    : mode === "reschedule"
                      ? "Confirm reschedule"
                      : "Schedule"}
                </button>
                {mode !== "idle" ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={pending}
                    onClick={() => {
                      setMode("idle");
                      setTargetPublicationId("");
                    }}
                  >
                    Close
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </section>
      ) : (
        <p className={styles.notice} role="status">
          Scheduling can be viewed here. Only Owner or Admin may schedule,
          reschedule, or cancel.
        </p>
      )}
    </section>
  );
}
