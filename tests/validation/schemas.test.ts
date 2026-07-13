import { describe, expect, it } from "vitest";
import {
  taskCancelInputSchema,
  taskCreateInputSchema,
  validateOrganizationContext,
} from "@/features/tasks/validation/schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";
const PROGRAM_ID = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT_ID = "55555555-5555-4555-8555-555555555555";

describe("taskCreateInputSchema", () => {
  it("accepts valid lead-only manual task", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required title", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
    });

    expect(result.success).toBe(false);
  });

  it("rejects malformed UUID", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects lead and customer together", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.success).toBe(false);
  });

  it("rejects enrollment without customer and program", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.success).toBe(false);
  });

  it("accepts enrollment tuple", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      enrollmentId: ENROLLMENT_ID,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid timestamp", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "not-a-date",
      leadId: LEAD_ID,
    });

    expect(result.success).toBe(false);
  });

  it("rejects manual task with idempotency key", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
      idempotencyKey: "key-1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected fields in strict mode", () => {
    const result = taskCreateInputSchema.safeParse({
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
      organizationId: ORG_ID,
    });

    expect(result.success).toBe(false);
  });
});

describe("taskCancelInputSchema", () => {
  it("requires cancel reason", () => {
    const result = taskCancelInputSchema.safeParse({
      taskId: "66666666-6666-4666-8666-666666666666",
      cancelReason: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("validateOrganizationContext", () => {
  it("requires a valid organization UUID", () => {
    expect(validateOrganizationContext({ organizationId: ORG_ID }).success).toBe(true);
    expect(validateOrganizationContext({ organizationId: "bad" }).success).toBe(false);
  });
});
