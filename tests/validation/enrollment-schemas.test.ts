import { describe, expect, it } from "vitest";
import {
  validateArchiveEnrollmentInput,
  validateCreateEnrollmentInput,
  validateRestoreEnrollmentInput,
  validateTransitionEnrollmentStatusInput,
  validateUpdateEnrollmentOwnerMetadataInput,
} from "@/features/enrollments/validation/mutation-schemas";
import {
  normalizeEnrollmentPagination,
  validateEnrollmentListQuery,
} from "@/features/enrollments/validation/read-query-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const ENROLLMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

describe("createEnrollmentInputSchema", () => {
  it("accepts valid create input and defaults initialStatus/metadata", () => {
    const parsed = validateCreateEnrollmentInput({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.initialStatus).toBe("pending");
      expect(parsed.data.metadata).toEqual({});
    }
  });

  it("accepts an explicit active initial status and owner", () => {
    const parsed = validateCreateEnrollmentInput({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
      ownerMemberId: MEMBER_ID,
      initialStatus: "active",
      metadata: { note: "priority" },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.initialStatus).toBe("active");
      expect(parsed.data.ownerMemberId).toBe(MEMBER_ID);
      expect(parsed.data.metadata).toEqual({ note: "priority" });
    }
  });

  it("rejects malformed UUIDs for organization, customer, and program", () => {
    expect(
      validateCreateEnrollmentInput({
        organizationId: "not-a-uuid",
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
      }).success,
    ).toBe(false);

    expect(
      validateCreateEnrollmentInput({
        organizationId: ORG_ID,
        customerId: "not-a-uuid",
        programId: PROGRAM_ID,
      }).success,
    ).toBe(false);

    expect(
      validateCreateEnrollmentInput({
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported initialStatus values not accepted by create_enrollment", () => {
    for (const badStatus of ["paused", "completed", "cancelled", "archived"]) {
      const parsed = validateCreateEnrollmentInput({
        organizationId: ORG_ID,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
        initialStatus: badStatus,
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects extra unsupported fields via strict schema", () => {
    const parsed = validateCreateEnrollmentInput({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
      unexpectedField: "nope",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("updateEnrollmentOwnerMetadataInputSchema", () => {
  it("accepts an owner-only update", () => {
    const parsed = validateUpdateEnrollmentOwnerMetadataInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      ownerMemberId: MEMBER_ID,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a metadata-only update", () => {
    const parsed = validateUpdateEnrollmentOwnerMetadataInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      metadata: { note: "updated" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty update with neither owner nor metadata", () => {
    const parsed = validateUpdateEnrollmentOwnerMetadataInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects extra unsupported fields via strict schema", () => {
    const parsed = validateUpdateEnrollmentOwnerMetadataInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      ownerMemberId: MEMBER_ID,
      extra: "nope",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("transitionEnrollmentStatusInputSchema", () => {
  it("accepts a valid transition with a reason", () => {
    const parsed = validateTransitionEnrollmentStatusInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      toStatus: "active",
      reason: "Started onboarding",
    });
    expect(parsed.success).toBe(true);
  });

  it("normalizes whitespace-only reasons to null", () => {
    const parsed = validateTransitionEnrollmentStatusInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      toStatus: "active",
      reason: "   ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reason).toBeNull();
    }
  });

  it("trims a padded reason string", () => {
    const parsed = validateTransitionEnrollmentStatusInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      toStatus: "active",
      reason: "  Ready now  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reason).toBe("Ready now");
    }
  });

  it("rejects unsupported status strings", () => {
    for (const badStatus of ["archived", "deleted", "unknown", ""]) {
      const parsed = validateTransitionEnrollmentStatusInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        toStatus: badStatus,
      });
      expect(parsed.success).toBe(false);
    }
  });
});

describe("archive and restore enrollment schemas", () => {
  it("accepts valid identifiers", () => {
    expect(
      validateArchiveEnrollmentInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
      }).success,
    ).toBe(true);

    expect(
      validateRestoreEnrollmentInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
      }).success,
    ).toBe(true);
  });

  it("rejects malformed organization or enrollment identifiers", () => {
    expect(
      validateArchiveEnrollmentInput({
        organizationId: "not-a-uuid",
        enrollmentId: ENROLLMENT_ID,
      }).success,
    ).toBe(false);

    expect(
      validateArchiveEnrollmentInput({
        organizationId: ORG_ID,
        enrollmentId: "not-a-uuid",
      }).success,
    ).toBe(false);

    expect(
      validateRestoreEnrollmentInput({
        organizationId: ORG_ID,
        enrollmentId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("enrollment list query schema", () => {
  it("accepts valid filters, pagination, and sort", () => {
    const parsed = validateEnrollmentListQuery({
      organizationId: ORG_ID,
      filters: { search: "acme", includeArchived: false },
      pagination: { page: 2, pageSize: 10 },
      sort: { field: "status", direction: "asc" },
    });
    expect(parsed.success).toBe(true);
  });

  it("enforces pagination boundaries: page >= 1 and pageSize in 1..100", () => {
    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        pagination: { page: 0, pageSize: 10 },
      }).success,
    ).toBe(false);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 0 },
      }).success,
    ).toBe(false);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 101 },
      }).success,
    ).toBe(false);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 100 },
      }).success,
    ).toBe(true);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 1 },
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported sort fields", () => {
    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        sort: { field: "secret", direction: "asc" },
      }).success,
    ).toBe(false);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        sort: { field: "status", direction: "sideways" },
      }).success,
    ).toBe(false);
  });

  it("rejects malformed organization ids", () => {
    expect(
      validateEnrollmentListQuery({
        organizationId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported status and extra fields", () => {
    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        filters: { status: "archived" },
      }).success,
    ).toBe(false);

    expect(
      validateEnrollmentListQuery({
        organizationId: ORG_ID,
        unexpectedField: "nope",
      }).success,
    ).toBe(false);
  });
});

describe("normalizeEnrollmentPagination", () => {
  it("returns validated page/pageSize with computed offset and limit", () => {
    const result = normalizeEnrollmentPagination({ page: 2, pageSize: 10 });
    expect(result).toEqual({ page: 2, pageSize: 10, offset: 10, limit: 10 });
  });

  it("falls back safely to defaults on invalid input", () => {
    const result = normalizeEnrollmentPagination({ page: 0, pageSize: 999 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(25);
  });

  it("falls back safely when given no input", () => {
    const result = normalizeEnrollmentPagination({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });
});
