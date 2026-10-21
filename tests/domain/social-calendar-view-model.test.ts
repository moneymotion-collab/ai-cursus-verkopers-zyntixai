import { describe, expect, it } from "vitest";
import {
  groupCalendarItemsByDay,
  publicationIsScheduledCalendarItem,
  projectPublicationToCalendarItem,
  resolveCalendarMutationFlags,
  resolveSocialCalendarHrefState,
  resolveSocialCalendarStatusKind,
  socialCalendarStatusLabel,
  summarizeScheduledOverview,
  userSafeSocialScheduleActionMessage,
} from "@/features/social-media/domain/calendar";
import { resolveSocialPublicationScheduleEligibility } from "@/features/social-media/domain/scheduling";
import { canScheduleSocialPublication } from "@/features/social-media/domain/permissions";

const NOW = new Date("2026-08-21T12:00:00.000Z");
const WEEK_START = "2026-08-16T22:00:00.000Z";
const WEEK_END = "2026-08-23T22:00:00.000Z";

describe("SMM-B1.11-B calendar view model", () => {
  it("includes publications inside the visible UTC week and excludes those outside", () => {
    expect(
      publicationIsScheduledCalendarItem({
        executionMode: "scheduled",
        intendedExecuteAt: "2026-08-21T09:00:00.000Z",
        visibleStartIso: WEEK_START,
        visibleEndIso: WEEK_END,
      }),
    ).toBe(true);
    expect(
      publicationIsScheduledCalendarItem({
        executionMode: "scheduled",
        intendedExecuteAt: "2026-08-16T21:59:59.000Z",
        visibleStartIso: WEEK_START,
        visibleEndIso: WEEK_END,
      }),
    ).toBe(false);
    expect(
      publicationIsScheduledCalendarItem({
        executionMode: "immediate",
        intendedExecuteAt: "2026-08-21T09:00:00.000Z",
        visibleStartIso: WEEK_START,
        visibleEndIso: WEEK_END,
      }),
    ).toBe(false);
  });

  it("projects a scheduled publication onto the local Amsterdam day", () => {
    const item = projectPublicationToCalendarItem({
      publicationId: "33333333-3333-4333-8333-333333333333",
      provider: "instagram",
      executionMode: "scheduled",
      intendedExecuteAt: "2026-08-21T15:00:00.000Z",
      status: "queued",
      contentFormat: "image",
      title: "Launch image",
      caption: "Hello",
      hasMedia: true,
      connectionDisplayName: "Brand IG",
      timeZone: "Europe/Amsterdam",
      now: NOW,
      role: "owner",
    });
    expect(item?.localDayKey).toBe("2026-08-21");
    expect(item?.localTimeLabel).toBe("17:00");
    expect(item?.timeZone).toBe("Europe/Amsterdam");
    expect(item?.canReschedule).toBe(true);
    expect(item?.canCancel).toBe(true);
    expect(item?.canSchedule).toBe(false);
    expect(item?.statusLabel).toBe("Scheduled");
  });

  it("does not treat schedule-slot style immediate rows as calendar scheduled items", () => {
    expect(
      projectPublicationToCalendarItem({
        publicationId: "33333333-3333-4333-8333-333333333333",
        provider: "instagram",
        executionMode: "immediate",
        intendedExecuteAt: "2026-08-21T09:00:00.000Z",
        status: "queued",
        contentFormat: "image",
        title: "Not scheduled",
        caption: null,
        hasMedia: false,
        connectionDisplayName: null,
        timeZone: "Europe/Amsterdam",
        now: NOW,
        role: "owner",
      }),
    ).toBeNull();
  });

  it("represents cancelled and due states with domain terminology", () => {
    expect(
      resolveSocialCalendarStatusKind({
        status: "cancelled",
        executionMode: "scheduled",
        intendedExecuteAt: "2026-08-21T09:00:00.000Z",
        now: NOW,
      }),
    ).toBe("cancelled");
    expect(socialCalendarStatusLabel("cancelled")).toBe("Cancelled");
    expect(
      resolveSocialCalendarStatusKind({
        status: "queued",
        executionMode: "scheduled",
        intendedExecuteAt: "2026-08-21T11:00:00.000Z",
        now: NOW,
      }),
    ).toBe("scheduled_due");
    expect(socialCalendarStatusLabel("claimed")).toBe("Claimed");
    expect(socialCalendarStatusLabel("processing")).toBe("Processing");
    expect(socialCalendarStatusLabel("unknown_external_outcome")).toBe(
      "Unknown outcome",
    );
  });

  it("sets permission flags for Owner/Admin and denies Staff/Viewer", () => {
    const scheduled = resolveSocialPublicationScheduleEligibility({
      status: "queued",
      executionMode: "scheduled",
    });
    expect(
      resolveCalendarMutationFlags({ role: "owner", eligibility: scheduled }),
    ).toEqual({
      canSchedule: false,
      canReschedule: true,
      canCancel: true,
    });
    expect(
      resolveCalendarMutationFlags({ role: "admin", eligibility: scheduled }),
    ).toEqual({
      canSchedule: false,
      canReschedule: true,
      canCancel: true,
    });
    expect(
      resolveCalendarMutationFlags({ role: "staff", eligibility: scheduled }),
    ).toEqual({
      canSchedule: false,
      canReschedule: false,
      canCancel: false,
    });
    expect(
      resolveCalendarMutationFlags({ role: "viewer", eligibility: scheduled }),
    ).toEqual({
      canSchedule: false,
      canReschedule: false,
      canCancel: false,
    });
    expect(canScheduleSocialPublication("staff", "active")).toBe(false);
    expect(canScheduleSocialPublication("viewer", "active")).toBe(false);
  });

  it("labels Story separately from feed IMAGE", () => {
    const item = projectPublicationToCalendarItem({
      publicationId: "aaa11111-1111-4111-8111-111111111111",
      provider: "instagram",
      executionMode: "scheduled",
      intendedExecuteAt: "2026-08-21T09:00:00.000Z",
      status: "queued",
      contentFormat: "story",
      title: "Story one",
      caption: "editorial copy only",
      hasMedia: true,
      connectionDisplayName: "Brand IG",
      timeZone: "UTC",
      now: NOW,
      role: "owner",
    });
    expect(item).not.toBeNull();
    expect(item?.contentFormatLabel).toBe("Story");
    expect(item?.contentFormat).toBe("story");
    expect(item?.accountLabel).toContain("Brand IG");
  });

  it("groups one publication per day without duplicating ids", () => {
    const item = projectPublicationToCalendarItem({
      publicationId: "aaa11111-1111-4111-8111-111111111111",
      provider: "instagram",
      executionMode: "scheduled",
      intendedExecuteAt: "2026-08-21T09:00:00.000Z",
      status: "queued",
      contentFormat: "image",
      title: "One",
      caption: null,
      hasMedia: false,
      connectionDisplayName: null,
      timeZone: "Europe/Amsterdam",
      now: NOW,
      role: "owner",
    });
    expect(item).not.toBeNull();
    const grouped = groupCalendarItemsByDay(
      [item!, item!],
      ["2026-08-20", "2026-08-21"],
    );
    expect(grouped["2026-08-21"]).toHaveLength(2);
    expect(grouped["2026-08-20"]).toHaveLength(0);
  });

  it("keeps calendar query params as view state only", () => {
    const state = resolveSocialCalendarHrefState({
      weekParam: "2026-08-19",
      dayParam: "2026-08-21",
      timeZone: "Europe/Amsterdam",
      now: NOW,
    });
    expect(state.weekStartDay).toBe("2026-08-17");
    expect(state.selectedDay).toBe("2026-08-21");
  });

  it("summarizes scheduled-this-week without counting cancelled rows", () => {
    expect(
      summarizeScheduledOverview({
        publications: [
          {
            executionMode: "scheduled",
            status: "queued",
            intendedExecuteAt: "2026-08-22T09:00:00.000Z",
          },
          {
            executionMode: "scheduled",
            status: "cancelled",
            intendedExecuteAt: "2026-08-21T10:00:00.000Z",
          },
          {
            executionMode: "immediate",
            status: "queued",
            intendedExecuteAt: "2026-08-21T11:00:00.000Z",
          },
        ],
        visibleStartIso: WEEK_START,
        visibleEndIso: WEEK_END,
        nowIso: NOW.toISOString(),
      }),
    ).toEqual({
      scheduledThisWeek: 1,
      nextScheduledAt: "2026-08-22T09:00:00.000Z",
    });
  });

  it("maps mutation errors to safe copy without database wording", () => {
    expect(userSafeSocialScheduleActionMessage("invalid_time")).toBe(
      "Schedule must be in the future.",
    );
    expect(userSafeSocialScheduleActionMessage("conflict")).not.toMatch(
      /supabase|postgres|rpc/i,
    );
  });
});
