import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  deriveTaskFlags,
  getUtcBoundsForOrgCalendarDay,
  resolveEffectiveTimezone,
} from "@/features/tasks/domain/due-state";

describe("resolveEffectiveTimezone", () => {
  it("falls back to UTC for missing timezone", () => {
    expect(resolveEffectiveTimezone(null)).toBe(DEFAULT_ORGANIZATION_TIMEZONE);
    expect(resolveEffectiveTimezone("")).toBe(DEFAULT_ORGANIZATION_TIMEZONE);
  });

  it("falls back to UTC for invalid timezone", () => {
    expect(resolveEffectiveTimezone("Not/AZone")).toBe(DEFAULT_ORGANIZATION_TIMEZONE);
  });

  it("accepts valid IANA timezone", () => {
    expect(resolveEffectiveTimezone("Europe/Amsterdam")).toBe("Europe/Amsterdam");
  });
});

describe("deriveTaskFlags", () => {
  const timeZone = "UTC";
  const now = new Date("2026-07-14T12:00:00.000Z");

  it("marks open past-due task as overdue", () => {
    const flags = deriveTaskFlags({
      status: "open",
      dueAt: "2026-07-13T12:00:00.000Z",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.overdue).toBe(true);
    expect(flags.dueToday).toBe(false);
    expect(flags.upcoming).toBe(false);
    expect(flags.dueState).toBe("overdue");
    expect(flags.terminal).toBe(false);
  });

  it("marks open task due today", () => {
    const flags = deriveTaskFlags({
      status: "open",
      dueAt: "2026-07-14T18:00:00.000Z",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.overdue).toBe(false);
    expect(flags.dueToday).toBe(true);
    expect(flags.upcoming).toBe(false);
    expect(flags.dueState).toBe("due_today");
  });

  it("marks open future task as upcoming", () => {
    const flags = deriveTaskFlags({
      status: "open",
      dueAt: "2026-07-15T08:00:00.000Z",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.upcoming).toBe(true);
    expect(flags.dueState).toBe("upcoming");
  });

  it("does not mark completed task as overdue or upcoming", () => {
    const flags = deriveTaskFlags({
      status: "completed",
      dueAt: "2026-01-01T00:00:00.000Z",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.terminal).toBe(true);
    expect(flags.overdue).toBe(false);
    expect(flags.upcoming).toBe(false);
    expect(flags.dueState).toBe("none");
  });

  it("does not mark cancelled task as upcoming", () => {
    const flags = deriveTaskFlags({
      status: "cancelled",
      dueAt: "2026-12-31T23:59:59.000Z",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.terminal).toBe(true);
    expect(flags.upcoming).toBe(false);
  });

  it("retains archived flag for archived open task", () => {
    const flags = deriveTaskFlags({
      status: "open",
      dueAt: "2026-07-15T08:00:00.000Z",
      archivedAt: "2026-07-10T10:00:00.000Z",
      timeZone,
      now,
    });

    expect(flags.archived).toBe(true);
    expect(flags.upcoming).toBe(true);
  });

  it("handles invalid timestamp safely", () => {
    const flags = deriveTaskFlags({
      status: "open",
      dueAt: "not-a-date",
      archivedAt: null,
      timeZone,
      now,
    });

    expect(flags.dueState).toBe("none");
    expect(flags.overdue).toBe(false);
  });

  it("classifies exact day-start boundary as due today", () => {
    const bounds = getUtcBoundsForOrgCalendarDay("UTC", now);
    expect(bounds).not.toBeNull();

    const flags = deriveTaskFlags({
      status: "open",
      dueAt: bounds!.start.toISOString(),
      archivedAt: null,
      timeZone: "UTC",
      now: bounds!.start,
    });

    expect(flags.dueToday).toBe(true);
    expect(flags.overdue).toBe(false);
  });

  it("classifies exact day-end boundary as due today", () => {
    const bounds = getUtcBoundsForOrgCalendarDay("UTC", now);
    expect(bounds).not.toBeNull();

    const flags = deriveTaskFlags({
      status: "open",
      dueAt: bounds!.end.toISOString(),
      archivedAt: null,
      timeZone: "UTC",
      now,
    });

    expect(flags.dueToday).toBe(true);
  });

  it("handles daylight-saving transition day in America/New_York", () => {
    const springForward = new Date("2026-03-08T12:00:00.000Z");
    const bounds = getUtcBoundsForOrgCalendarDay("America/New_York", springForward);
    expect(bounds).not.toBeNull();

    const dueToday = deriveTaskFlags({
      status: "open",
      dueAt: bounds!.start.toISOString(),
      archivedAt: null,
      timeZone: "America/New_York",
      now: springForward,
    });

    expect(dueToday.dueToday).toBe(true);
  });
});
