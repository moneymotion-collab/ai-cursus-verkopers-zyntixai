import { describe, expect, it } from "vitest";
import {
  ENROLLMENT_INITIAL_STATUSES,
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_METADATA,
  OPEN_ENROLLMENT_STATUSES,
  TERMINAL_ENROLLMENT_STATUSES,
  getAllowedEnrollmentStatusTransitions,
  getEnrollmentStatusDescription,
  getEnrollmentStatusLabel,
  isAllowedEnrollmentStatusTransition,
  isEnrollmentInitialStatus,
  isEnrollmentStatus,
  isOpenEnrollment,
  isOpenEnrollmentStatus,
  isTerminalEnrollmentStatus,
} from "@/features/enrollments/domain/status";

describe("enrollment status metadata", () => {
  it("exposes exact database lifecycle statuses", () => {
    expect([...ENROLLMENT_STATUSES]).toEqual([
      "pending",
      "active",
      "paused",
      "completed",
      "cancelled",
    ]);
  });

  it("exposes exact create-allowed initial statuses", () => {
    expect([...ENROLLMENT_INITIAL_STATUSES]).toEqual(["pending", "active"]);
  });

  it("provides deterministic labels and descriptions", () => {
    expect(getEnrollmentStatusLabel("pending")).toBe("Pending");
    expect(getEnrollmentStatusLabel("active")).toBe("Active");
    expect(getEnrollmentStatusLabel("paused")).toBe("Paused");
    expect(getEnrollmentStatusLabel("completed")).toBe("Completed");
    expect(getEnrollmentStatusLabel("cancelled")).toBe("Cancelled");

    for (const status of ENROLLMENT_STATUSES) {
      expect(getEnrollmentStatusDescription(status).length).toBeGreaterThan(0);
    }

    expect(getEnrollmentStatusLabel("pending")).toBe(getEnrollmentStatusLabel("pending"));
    expect(getEnrollmentStatusDescription("active")).toBe(
      getEnrollmentStatusDescription("active"),
    );
  });

  it("marks only pending as the create default and pending/active as create-allowed", () => {
    const initialStatuses = ENROLLMENT_STATUS_METADATA.filter(
      (item) => item.isCreateAllowed,
    ).map((item) => item.value);
    expect(initialStatuses).toEqual(["pending", "active"]);

    const defaults = ENROLLMENT_STATUS_METADATA.filter((item) => item.isCreateDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.value).toBe("pending");
  });
});

describe("enrollment lifecycle transitions", () => {
  it("mirrors the exact database-allowed transition matrix", () => {
    expect(getAllowedEnrollmentStatusTransitions("pending")).toEqual([
      "active",
      "cancelled",
    ]);
    expect(getAllowedEnrollmentStatusTransitions("active")).toEqual([
      "paused",
      "completed",
      "cancelled",
    ]);
    expect(getAllowedEnrollmentStatusTransitions("paused")).toEqual([
      "active",
      "completed",
      "cancelled",
    ]);
    expect(getAllowedEnrollmentStatusTransitions("completed")).toEqual([]);
    expect(getAllowedEnrollmentStatusTransitions("cancelled")).toEqual([]);
  });

  it("allows only the exact permitted transition pairs", () => {
    expect(isAllowedEnrollmentStatusTransition("pending", "active")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("pending", "cancelled")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("pending", "paused")).toBe(false);
    expect(isAllowedEnrollmentStatusTransition("pending", "completed")).toBe(false);

    expect(isAllowedEnrollmentStatusTransition("active", "paused")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("active", "completed")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("active", "cancelled")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("active", "pending")).toBe(false);

    expect(isAllowedEnrollmentStatusTransition("paused", "active")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("paused", "completed")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("paused", "cancelled")).toBe(true);
    expect(isAllowedEnrollmentStatusTransition("paused", "pending")).toBe(false);

    for (const target of ENROLLMENT_STATUSES) {
      expect(isAllowedEnrollmentStatusTransition("completed", target)).toBe(false);
      expect(isAllowedEnrollmentStatusTransition("cancelled", target)).toBe(false);
    }
  });

  it("rejects same-status transitions for every status", () => {
    for (const status of ENROLLMENT_STATUSES) {
      expect(isAllowedEnrollmentStatusTransition(status, status)).toBe(false);
    }
  });
});

describe("open and terminal enrollment status classification", () => {
  it("exposes the exact open-participation status set", () => {
    expect([...OPEN_ENROLLMENT_STATUSES]).toEqual(["pending", "active", "paused"]);
  });

  it("exposes the exact terminal status set", () => {
    expect([...TERMINAL_ENROLLMENT_STATUSES]).toEqual(["completed", "cancelled"]);
  });

  it("classifies isOpenEnrollmentStatus and isTerminalEnrollmentStatus correctly", () => {
    expect(isOpenEnrollmentStatus("pending")).toBe(true);
    expect(isOpenEnrollmentStatus("active")).toBe(true);
    expect(isOpenEnrollmentStatus("paused")).toBe(true);
    expect(isOpenEnrollmentStatus("completed")).toBe(false);
    expect(isOpenEnrollmentStatus("cancelled")).toBe(false);

    expect(isTerminalEnrollmentStatus("completed")).toBe(true);
    expect(isTerminalEnrollmentStatus("cancelled")).toBe(true);
    expect(isTerminalEnrollmentStatus("pending")).toBe(false);
    expect(isTerminalEnrollmentStatus("active")).toBe(false);
    expect(isTerminalEnrollmentStatus("paused")).toBe(false);
  });

  it("isOpenEnrollment requires an open status and a non-archived record", () => {
    expect(isOpenEnrollment("active", null)).toBe(true);
    expect(isOpenEnrollment("active", undefined)).toBe(true);
    expect(isOpenEnrollment("active", "2026-07-20T00:00:00.000Z")).toBe(false);
    expect(isOpenEnrollment("completed", null)).toBe(false);
    expect(isOpenEnrollment("cancelled", "2026-07-20T00:00:00.000Z")).toBe(false);
  });
});

describe("enrollment status type guards", () => {
  it("rejects unsupported status and initial-status strings", () => {
    expect(isEnrollmentStatus("pending")).toBe(true);
    expect(isEnrollmentStatus("archived")).toBe(false);
    expect(isEnrollmentStatus("")).toBe(false);

    expect(isEnrollmentInitialStatus("pending")).toBe(true);
    expect(isEnrollmentInitialStatus("active")).toBe(true);
    expect(isEnrollmentInitialStatus("paused")).toBe(false);
    expect(isEnrollmentInitialStatus("completed")).toBe(false);
    expect(isEnrollmentInitialStatus("cancelled")).toBe(false);
  });
});
