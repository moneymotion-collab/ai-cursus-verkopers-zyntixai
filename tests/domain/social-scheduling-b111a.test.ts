import { describe, expect, it } from "vitest";
import { SOCIAL_PUBLICATION_STATUSES } from "@/features/social-media/domain/publishing";
import {
  SOCIAL_PUBLICATION_SCHEDULE_BLOCKED_STATUSES,
  SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES,
  SOCIAL_SCHEDULE_MISS_GRACE_SECONDS,
  SOCIAL_SCHEDULE_MISS_POLICY,
  isFutureExecutionInstant,
  isSocialPublicationScheduleEligibleStatus,
  parseUnambiguousExecutionInstant,
  resolveSocialPublicationScheduleEligibility,
} from "@/features/social-media/domain/scheduling";

describe("SMM-B1.11-A scheduling domain", () => {
  it("records the locked 15-minute missed policy without executing it", () => {
    expect(SOCIAL_SCHEDULE_MISS_GRACE_SECONDS).toBe(900);
    expect(SOCIAL_SCHEDULE_MISS_POLICY).toContain("15 minutes");
    expect(SOCIAL_SCHEDULE_MISS_POLICY).toContain("B1.11-D");
  });

  it("covers every publication status exactly once in eligibility vs blocked", () => {
    const combined = [
      ...SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES,
      ...SOCIAL_PUBLICATION_SCHEDULE_BLOCKED_STATUSES,
    ];
    expect([...combined].sort()).toEqual(
      [...SOCIAL_PUBLICATION_STATUSES].sort(),
    );
  });

  it("allows schedule only for pending/queued/failed_retryable immediate rows", () => {
    expect(
      resolveSocialPublicationScheduleEligibility({
        status: "queued",
        executionMode: "immediate",
      }),
    ).toEqual({
      schedule: true,
      reschedule: false,
      cancelScheduled: false,
      reason: "schedulable",
    });
    expect(
      resolveSocialPublicationScheduleEligibility({
        status: "queued",
        executionMode: "scheduled",
      }).schedule,
    ).toBe(false);
    expect(
      resolveSocialPublicationScheduleEligibility({
        status: "queued",
        executionMode: "scheduled",
      }).reschedule,
    ).toBe(true);
    expect(isSocialPublicationScheduleEligibleStatus("failed_retryable")).toBe(
      true,
    );
  });

  it("denies claimed, processing, succeeded, cancelled, UEO, terminal, intervention", () => {
    for (const status of SOCIAL_PUBLICATION_SCHEDULE_BLOCKED_STATUSES) {
      const eligibility = resolveSocialPublicationScheduleEligibility({
        status,
        executionMode: "scheduled",
      });
      expect(eligibility.schedule).toBe(false);
      expect(eligibility.reschedule).toBe(false);
      expect(eligibility.cancelScheduled).toBe(false);
    }
  });

  it("accepts unambiguous UTC/offset instants and rejects naive local strings", () => {
    expect(parseUnambiguousExecutionInstant("2026-10-25T08:00:00Z")).toEqual(
      new Date("2026-10-25T08:00:00.000Z"),
    );
    expect(
      parseUnambiguousExecutionInstant("2026-10-25T10:00:00+02:00")?.toISOString(),
    ).toBe("2026-10-25T08:00:00.000Z");
    expect(parseUnambiguousExecutionInstant("2026-10-25 02:30")).toBeNull();
    expect(parseUnambiguousExecutionInstant("2026-10-25T02:30")).toBeNull();
    expect(parseUnambiguousExecutionInstant("")).toBeNull();
    expect(parseUnambiguousExecutionInstant(null)).toBeNull();
    expect(parseUnambiguousExecutionInstant("not-a-date")).toBeNull();
  });

  it("requires a strictly future instant versus now", () => {
    const now = new Date("2026-08-21T12:00:00.000Z");
    expect(
      isFutureExecutionInstant(new Date("2026-08-21T12:00:01.000Z"), now),
    ).toBe(true);
    expect(isFutureExecutionInstant(now, now)).toBe(false);
    expect(
      isFutureExecutionInstant(new Date("2026-08-21T11:59:59.000Z"), now),
    ).toBe(false);
  });
});
