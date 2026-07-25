import { describe, expect, it } from "vitest";
import {
  mapEnrollmentCustomerSummary,
  mapEnrollmentDetail,
  mapEnrollmentListItem,
  mapEnrollmentProgramSummary,
  mapEnrollmentStatusHistoryEntry,
} from "@/features/enrollments/server/map-enrollment-read-model";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
} from "../helpers/enrollment-test-fixtures";

describe("mapEnrollmentListItem", () => {
  it("maps a list row into the domain read model with derived flags", () => {
    const item = mapEnrollmentListItem(
      {
        id: ENROLLMENT_ID,
        organization_id: ORG_ID,
        customer_id: CUSTOMER_ID,
        program_id: PROGRAM_ID,
        status: "active",
        owner_member_id: MEMBER_ID,
        enrolled_at: "2026-07-01T10:00:00.000Z",
        updated_at: "2026-07-14T12:00:00.000Z",
        archived_at: null,
      },
      { customerDisplayName: "Acme Corp", programName: "Growth Lab" },
    );

    expect(item.statusLabel).toBe("Active");
    expect(item.customerDisplayName).toBe("Acme Corp");
    expect(item.programName).toBe("Growth Lab");
    expect(item.derived).toEqual({ isArchived: false, isOpen: true, isTerminal: false });
  });

  it("derives archived, terminal, and closed flags for a completed archived row", () => {
    const item = mapEnrollmentListItem({
      id: ENROLLMENT_ID,
      organization_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      program_id: PROGRAM_ID,
      status: "completed",
      owner_member_id: null,
      enrolled_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-14T12:00:00.000Z",
      archived_at: "2026-07-20T09:00:00.000Z",
    });

    expect(item.derived.isArchived).toBe(true);
    expect(item.derived.isTerminal).toBe(true);
    expect(item.derived.isOpen).toBe(false);
    expect(item.customerDisplayName).toBeNull();
    expect(item.programName).toBeNull();
  });

  it("falls back to a safe status for unrecognized database values", () => {
    const item = mapEnrollmentListItem({
      id: ENROLLMENT_ID,
      organization_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      program_id: PROGRAM_ID,
      status: "unknown_future_status",
      owner_member_id: null,
      enrolled_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-14T12:00:00.000Z",
      archived_at: null,
    });

    expect(item.status).toBe("pending");
    expect(item.statusLabel).toBe("Pending");
  });
});

describe("mapEnrollmentDetail", () => {
  it("maps a detail row including allowed transitions and related summaries", () => {
    const detail = mapEnrollmentDetail(
      {
        id: ENROLLMENT_ID,
        organization_id: ORG_ID,
        customer_id: CUSTOMER_ID,
        program_id: PROGRAM_ID,
        status: "active",
        owner_member_id: MEMBER_ID,
        created_by_member_id: MEMBER_ID,
        enrolled_at: "2026-07-01T10:00:00.000Z",
        started_at: "2026-07-01T10:00:00.000Z",
        completed_at: null,
        cancelled_at: null,
        source: "manual",
        metadata: { note: "priority" },
        created_at: "2026-07-01T10:00:00.000Z",
        updated_at: "2026-07-14T12:00:00.000Z",
        archived_at: null,
      },
      {
        customer: mapEnrollmentCustomerSummary({
          id: CUSTOMER_ID,
          display_name: "Acme Corp",
          status: "active",
          archived_at: null,
        }),
        program: mapEnrollmentProgramSummary({
          id: PROGRAM_ID,
          name: "Growth Lab",
          status: "active",
          archived_at: null,
        }),
      },
    );

    expect(detail.derived.allowedTransitions).toEqual([
      "paused",
      "completed",
      "cancelled",
    ]);
    expect(detail.customer?.displayName).toBe("Acme Corp");
    expect(detail.program?.name).toBe("Growth Lab");
    expect(detail.metadata).toEqual({ note: "priority" });
  });

  it("returns terminal status with no allowed transitions and null related records", () => {
    const detail = mapEnrollmentDetail({
      id: ENROLLMENT_ID,
      organization_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      program_id: PROGRAM_ID,
      status: "cancelled",
      owner_member_id: null,
      created_by_member_id: MEMBER_ID,
      enrolled_at: "2026-07-01T10:00:00.000Z",
      started_at: null,
      completed_at: null,
      cancelled_at: "2026-07-10T10:00:00.000Z",
      source: "manual",
      metadata: null,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-10T10:00:00.000Z",
      archived_at: null,
    });

    expect(detail.derived.allowedTransitions).toEqual([]);
    expect(detail.derived.isTerminal).toBe(true);
    expect(detail.customer).toBeNull();
    expect(detail.program).toBeNull();
    expect(detail.metadata).toEqual({});
  });

  it("marks an archived row with archived/closed derived flags", () => {
    const detail = mapEnrollmentDetail({
      id: ENROLLMENT_ID,
      organization_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      program_id: PROGRAM_ID,
      status: "completed",
      owner_member_id: MEMBER_ID,
      created_by_member_id: MEMBER_ID,
      enrolled_at: "2026-07-01T10:00:00.000Z",
      started_at: "2026-07-01T10:00:00.000Z",
      completed_at: "2026-07-18T09:00:00.000Z",
      cancelled_at: null,
      source: "manual",
      metadata: {},
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-18T09:00:00.000Z",
      archived_at: "2026-07-20T09:00:00.000Z",
    });

    expect(detail.derived.isArchived).toBe(true);
    expect(detail.derived.isOpen).toBe(false);
  });
});

describe("mapEnrollmentStatusHistoryEntry", () => {
  it("maps a history row with a known from-status", () => {
    const entry = mapEnrollmentStatusHistoryEntry({
      id: "55555555-5555-4555-8555-555555555555",
      organization_id: ORG_ID,
      enrollment_id: ENROLLMENT_ID,
      from_status: "pending",
      to_status: "active",
      changed_by_member_id: MEMBER_ID,
      reason: "Started onboarding",
      source: "manual",
      changed_at: "2026-07-01T10:00:00.000Z",
    });

    expect(entry.fromStatus).toBe("pending");
    expect(entry.fromStatusLabel).toBe("Pending");
    expect(entry.toStatus).toBe("active");
    expect(entry.toStatusLabel).toBe("Active");
  });

  it("maps a history row with a null from-status (initial creation)", () => {
    const entry = mapEnrollmentStatusHistoryEntry({
      id: "66666666-6666-4666-8666-666666666666",
      organization_id: ORG_ID,
      enrollment_id: ENROLLMENT_ID,
      from_status: null,
      to_status: "pending",
      changed_by_member_id: null,
      reason: null,
      source: "manual",
      changed_at: "2026-07-01T10:00:00.000Z",
    });

    expect(entry.fromStatus).toBeNull();
    expect(entry.fromStatusLabel).toBeNull();
    expect(entry.toStatusLabel).toBe("Pending");
    expect(entry.changedByMemberId).toBeNull();
  });

  it("falls back to null when an unrecognized from-status is stored historically", () => {
    const entry = mapEnrollmentStatusHistoryEntry({
      id: "77777777-7777-4777-8777-777777777777",
      organization_id: ORG_ID,
      enrollment_id: ENROLLMENT_ID,
      from_status: "legacy_unknown",
      to_status: "active",
      changed_by_member_id: MEMBER_ID,
      reason: null,
      source: "manual",
      changed_at: "2026-07-01T10:00:00.000Z",
    });

    expect(entry.fromStatus).toBeNull();
  });
});
