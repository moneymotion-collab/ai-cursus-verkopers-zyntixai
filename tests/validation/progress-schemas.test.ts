import { describe, expect, it } from "vitest";
import {
  validateRecordProgressFactInput,
  validateVoidProgressFactInput,
} from "@/features/progress/validation/mutation-schemas";
import {
  escapeProgressIlikePattern,
  normalizeProgressPagination,
  validateProgressFactIdQuery,
  validateProgressListQuery,
} from "@/features/progress/validation/read-query-schemas";
import {
  ENROLLMENT_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
} from "../helpers/progress-test-fixtures";

describe("progress validation schemas", () => {
  it("accepts a valid record payload and rejects empty payload", () => {
    const valid = validateRecordProgressFactInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      factType: "manual_observation",
      occurredAt: "2026-07-20T10:00:00.000Z",
      title: "  Note  ",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.title).toBe("Note");
    }

    const empty = validateRecordProgressFactInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      factType: "manual_observation",
      occurredAt: "2026-07-20T10:00:00.000Z",
    });
    expect(empty.success).toBe(false);
  });

  it("rejects invalid UUIDs, unknown fact types, and unexpected properties", () => {
    expect(
      validateRecordProgressFactInput({
        organizationId: "not-a-uuid",
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "x",
      }).success,
    ).toBe(false);

    expect(
      validateRecordProgressFactInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "health_score",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "x",
      }).success,
    ).toBe(false);

    expect(
      validateRecordProgressFactInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "x",
        unexpected: true,
      }).success,
    ).toBe(false);
  });

  it("requires idempotency key for corrections and numeric value when unit is set", () => {
    expect(
      validateRecordProgressFactInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "fix",
        correctedFromFactId: PROGRESS_FACT_ID,
      }).success,
    ).toBe(false);

    expect(
      validateRecordProgressFactInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        numericUnit: "hours",
      }).success,
    ).toBe(false);
  });

  it("requires a non-empty void reason", () => {
    expect(
      validateVoidProgressFactInput({
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
        reason: "   ",
      }).success,
    ).toBe(false);

    expect(
      validateVoidProgressFactInput({
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
        reason: "Entered in error",
      }).success,
    ).toBe(true);
  });

  it("validates list/id queries and normalizes pagination", () => {
    expect(
      validateProgressListQuery({
        organizationId: ORG_ID,
        filters: { includeVoided: true, factType: "unit_completed" },
      }).success,
    ).toBe(true);

    expect(
      validateProgressFactIdQuery({
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
      }).success,
    ).toBe(true);

    expect(normalizeProgressPagination({ page: 2, pageSize: 10 })).toEqual({
      page: 2,
      pageSize: 10,
      offset: 10,
      limit: 10,
    });
    expect(escapeProgressIlikePattern("100%_done")).toBe("100\\%\\_done");
  });
});
