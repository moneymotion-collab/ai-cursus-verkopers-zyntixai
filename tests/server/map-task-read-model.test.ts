import { describe, expect, it } from "vitest";
import {
  mapLinkedContext,
  mapTaskDetail,
  mapTaskHistoryEntry,
  mapTaskListItem,
  type TaskListRow,
} from "@/features/tasks/server/map-task-read-model";
import type { TaskRow, TaskStatusHistoryRow } from "@/features/tasks/domain/types";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";
const CUSTOMER_ID = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT_ID = "55555555-5555-4555-8555-555555555555";
const PROGRAM_ID = "66666666-6666-4666-8666-666666666666";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";

function baseListRow(overrides: Partial<TaskListRow> = {}): TaskListRow {
  return {
    id: TASK_ID,
    organization_id: ORG_ID,
    title: "Follow up",
    status: "open",
    task_type: "follow_up",
    priority: "normal",
    source: "manual",
    due_at: "2026-07-15T10:00:00.000Z",
    assignee_member_id: MEMBER_ID,
    lead_id: null,
    customer_id: null,
    enrollment_id: null,
    program_id: null,
    archived_at: null,
    created_at: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

function baseDetailRow(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    ...baseListRow(),
    description: "Details",
    created_by_member_id: MEMBER_ID,
    predecessor_task_id: null,
    completed_at: null,
    cancelled_at: null,
    updated_at: "2026-07-01T10:00:00.000Z",
    cancel_reason: null,
    cancelled_by_member_id: null,
    completed_by_member_id: null,
    completion_note: null,
    idempotency_key: null,
    metadata: {},
    ...overrides,
  };
}

describe("mapLinkedContext", () => {
  it("maps lead-only context", () => {
    expect(mapLinkedContext({ lead_id: LEAD_ID, customer_id: null, enrollment_id: null, program_id: null })).toEqual({
      kind: "lead",
      leadId: LEAD_ID,
    });
  });

  it("maps customer-only context", () => {
    expect(
      mapLinkedContext({
        lead_id: null,
        customer_id: CUSTOMER_ID,
        enrollment_id: null,
        program_id: null,
      }),
    ).toEqual({
      kind: "customer",
      customerId: CUSTOMER_ID,
    });
  });

  it("maps enrollment-linked context", () => {
    expect(
      mapLinkedContext({
        lead_id: null,
        customer_id: CUSTOMER_ID,
        enrollment_id: ENROLLMENT_ID,
        program_id: PROGRAM_ID,
      }),
    ).toEqual({
      kind: "enrollment",
      enrollmentId: ENROLLMENT_ID,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });
  });
});

describe("mapTaskListItem", () => {
  it("maps complete list row", () => {
    const mapped = mapTaskListItem(
      baseListRow({ lead_id: LEAD_ID }),
      "UTC",
      new Date("2026-07-14T12:00:00.000Z"),
    );

    expect(mapped.id).toBe(TASK_ID);
    expect(mapped.linkedContext).toEqual({ kind: "lead", leadId: LEAD_ID });
    expect(mapped.derived.archived).toBe(false);
  });

  it("maps terminal task", () => {
    const mapped = mapTaskListItem(
      baseListRow({ status: "completed", lead_id: LEAD_ID }),
      "UTC",
      new Date("2026-07-14T12:00:00.000Z"),
    );

    expect(mapped.derived.terminal).toBe(true);
    expect(mapped.derived.overdue).toBe(false);
  });

  it("maps archived task", () => {
    const mapped = mapTaskListItem(
      baseListRow({ archived_at: "2026-07-10T10:00:00.000Z", lead_id: LEAD_ID }),
      "UTC",
      new Date("2026-07-14T12:00:00.000Z"),
    );

    expect(mapped.derived.archived).toBe(true);
  });
});

describe("mapTaskDetail", () => {
  it("maps nullable context fields safely for customer-only task", () => {
    const mapped = mapTaskDetail(
      baseDetailRow({
        lead_id: null,
        customer_id: CUSTOMER_ID,
        enrollment_id: null,
        program_id: null,
      }),
      "UTC",
    );

    expect(mapped.linkedContext).toEqual({ kind: "customer", customerId: CUSTOMER_ID });
    expect(mapped.predecessorTaskId).toBeNull();
  });
});

describe("mapTaskHistoryEntry", () => {
  it("maps history row", () => {
    const row: TaskStatusHistoryRow = {
      id: "88888888-8888-4888-8888-888888888888",
      organization_id: ORG_ID,
      task_id: TASK_ID,
      from_status: "open",
      to_status: "completed",
      changed_by_member_id: MEMBER_ID,
      reason: "Done",
      source: "manual",
      created_at: "2026-07-02T10:00:00.000Z",
    };

    const mapped = mapTaskHistoryEntry(row);
    expect(mapped.fromStatus).toBe("open");
    expect(mapped.toStatus).toBe("completed");
    expect(mapped.reason).toBe("Done");
  });
});
