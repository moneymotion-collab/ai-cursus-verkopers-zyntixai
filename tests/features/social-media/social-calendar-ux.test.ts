import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
import { SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED } from "@/features/social-media/domain/calendar";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

describe("SMM-B1.11-B calendar UX surface", () => {
  it("adds Calendar to the canonical /social workspace via existing section routing", () => {
    expect(
      buildSocialWorkspaceHref({
        organizationId: "11111111-1111-4111-8111-111111111111",
        section: "calendar",
        week: "2026-08-17",
        day: "2026-08-21",
      }),
    ).toBe(
      "/social?org=11111111-1111-4111-8111-111111111111&section=calendar&week=2026-08-17&day=2026-08-21",
    );

    const panel = read(
      "src/features/social-media/ui/social-workspace-panel.tsx",
    );
    expect(panel).toContain('["calendar", "Calendar"]');
    expect(panel).toContain("SocialCalendarPanel");
    expect(panel).not.toContain("drag");
    expect(panel).not.toContain("Will automatically publish");
  });

  it("keeps calendar query parameters from authorizing tenant access", () => {
    const loader = read(
      "src/features/social-media/server/load-social-workspace-page.ts",
    );
    expect(loader).toContain("resolveOrganizationContext");
    expect(loader).toContain("resolveSelectedOrganization");
    expect(loader).toContain("loadSocialCalendar");
    expect(loader).toContain("rawSearchParams.week");
    expect(loader).toContain("rawSearchParams.tz");
    expect(loader).not.toMatch(
      /organizationId:\s*firstSearchParam\(rawSearchParams\.org\)/,
    );
  });

  it("wires schedule, reschedule, and confirmed cancel to B1.11-A actions", () => {
    const calendar = read(
      "src/features/social-media/ui/social-calendar-panel.tsx",
    );
    expect(calendar).toContain("scheduleSocialPublicationAction");
    expect(calendar).toContain("rescheduleSocialPublicationAction");
    expect(calendar).toContain("cancelScheduledSocialPublicationAction");
    expect(calendar).toContain("Confirm cancel");
    expect(calendar).toContain("convertLocalWallTimeToUtcIso");
    expect(calendar).toContain("userSafeSocialScheduleActionMessage");
    expect(calendar).toContain("userSafeLocalTimeConversionMessage");
    expect(calendar).toContain("htmlFor=\"calendar-date\"");
    expect(calendar).toContain("htmlFor=\"calendar-time\"");
    expect(calendar).toContain("htmlFor=\"calendar-timezone\"");
    expect(calendar).toContain("Previous week");
    expect(calendar).toContain("Next week");
    expect(calendar).toContain("Today");
    expect(calendar).toContain("Automatic execution is not enabled");
    expect(calendar).not.toContain("Will automatically publish");
    expect(calendar).not.toContain("onDrag");
    expect(SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED).toBe(false);
  });

  it("shows intended execute time on Activity when a publication is scheduled", () => {
    const activity = read(
      "src/features/social-media/ui/b19-lifecycle-panel.tsx",
    );
    expect(activity).toContain("intendedExecuteAt");
    expect(activity).toContain("executionMode === \"scheduled\"");
    expect(activity).toContain("scheduled for");
  });

  it("does not add cron, worker, Stories, or provider writes", () => {
    const calendar = read(
      "src/features/social-media/ui/social-calendar-panel.tsx",
    );
    const loader = read(
      "src/features/social-media/server/load-social-calendar.ts",
    );
    for (const source of [calendar, loader]) {
      expect(source).not.toContain("vercel.json");
      expect(source).not.toContain("/api/cron");
      expect(source).not.toContain("executeB18ImagePublication");
      expect(source).not.toContain("media_publish");
      expect(source).not.toContain("graph.facebook.com");
    }
  });
});
