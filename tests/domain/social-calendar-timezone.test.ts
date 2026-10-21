import { describe, expect, it } from "vitest";
import {
  convertLocalWallTimeToUtcIso,
  getZonedWeekUtcBounds,
  isValidIanaTimeZone,
  isoWeekStartDayKey,
  resolveSocialCalendarTimezone,
  zonedDayKey,
} from "@/features/social-media/domain/calendar-timezone";

describe("SMM-B1.11-B calendar timezone conversion", () => {
  it("uses a valid organization IANA timezone and does not invent a server zone", () => {
    expect(
      resolveSocialCalendarTimezone({
        organizationTimeZone: "Europe/Amsterdam",
      }),
    ).toEqual({
      configured: true,
      displayTimeZone: "Europe/Amsterdam",
      organizationTimeZone: "Europe/Amsterdam",
      source: "organization",
    });
    expect(
      resolveSocialCalendarTimezone({
        organizationTimeZone: null,
      }).configured,
    ).toBe(false);
    expect(
      resolveSocialCalendarTimezone({
        organizationTimeZone: null,
      }).displayTimeZone,
    ).toBe("UTC");
    expect(
      resolveSocialCalendarTimezone({
        organizationTimeZone: null,
        selectedTimeZone: "Europe/Amsterdam",
      }).source,
    ).toBe("selected");
  });

  it("rejects invalid IANA timezones", () => {
    expect(isValidIanaTimeZone("Not/A_Zone")).toBe(false);
    expect(isValidIanaTimeZone("")).toBe(false);
    expect(isValidIanaTimeZone("Europe/Amsterdam")).toBe(true);
    expect(
      convertLocalWallTimeToUtcIso("2026-07-15", "10:00", "Not/A_Zone"),
    ).toEqual({ ok: false, code: "invalid_timezone" });
    expect(
      convertLocalWallTimeToUtcIso("2026-07-15", "10:00", null),
    ).toEqual({ ok: false, code: "missing_timezone" });
  });

  it("converts Europe/Amsterdam summer and winter times to UTC deterministically", () => {
    const summer = convertLocalWallTimeToUtcIso(
      "2026-07-15",
      "10:00",
      "Europe/Amsterdam",
    );
    expect(summer).toEqual({ ok: true, iso: "2026-07-15T08:00:00.000Z" });
    const winter = convertLocalWallTimeToUtcIso(
      "2026-01-15",
      "10:00",
      "Europe/Amsterdam",
    );
    expect(winter).toEqual({ ok: true, iso: "2026-01-15T09:00:00.000Z" });
    const utc = convertLocalWallTimeToUtcIso("2026-07-15", "10:00", "UTC");
    expect(utc).toEqual({ ok: true, iso: "2026-07-15T10:00:00.000Z" });
  });

  it("fails clearly on the Europe/Amsterdam 2026 spring-forward gap", () => {
    expect(
      convertLocalWallTimeToUtcIso(
        "2026-03-29",
        "02:30",
        "Europe/Amsterdam",
      ),
    ).toEqual({ ok: false, code: "invalid_local_time" });
  });

  it("fails clearly on the Europe/Amsterdam 2026 fall-back ambiguous hour", () => {
    expect(
      convertLocalWallTimeToUtcIso(
        "2026-10-25",
        "02:30",
        "Europe/Amsterdam",
      ),
    ).toEqual({ ok: false, code: "ambiguous_local_time" });
  });

  it("places a UTC instant on the correct local Amsterdam day", () => {
    expect(
      zonedDayKey(new Date("2026-07-15T22:30:00.000Z"), "Europe/Amsterdam"),
    ).toBe("2026-07-16");
    expect(
      zonedDayKey(new Date("2026-07-15T22:30:00.000Z"), "UTC"),
    ).toBe("2026-07-15");
  });

  it("computes a Monday-start week UTC range in Europe/Amsterdam", () => {
    expect(isoWeekStartDayKey("2026-08-21")).toBe("2026-08-17");
    const bounds = getZonedWeekUtcBounds("2026-08-17", "Europe/Amsterdam");
    expect(bounds?.startIso).toBe("2026-08-16T22:00:00.000Z");
    expect(bounds?.endIso).toBe("2026-08-23T22:00:00.000Z");
    expect(bounds?.days).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });
});
