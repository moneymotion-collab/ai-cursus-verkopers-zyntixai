import { describe, expect, it } from "vitest";
import {
  validateArchiveProgramInput,
  validateCreateProgramInput,
  validateRestoreProgramInput,
  validateTransitionProgramStatusInput,
  validateUpdateProgramInput,
} from "@/features/programs/validation/mutation-schemas";
import {
  normalizeProgramPagination,
  validateProgramListQuery,
} from "@/features/programs/validation/read-query-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";

describe("program mutation schemas", () => {
  it("accepts valid create input and trims name", () => {
    const parsed = validateCreateProgramInput({
      organizationId: ORG_ID,
      name: "  Growth Lab  ",
      deliveryMode: "cohort",
      description: "  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Growth Lab");
      expect(parsed.data.description).toBeNull();
    }
  });

  it("rejects missing name and invalid delivery mode", () => {
    expect(
      validateCreateProgramInput({
        organizationId: ORG_ID,
        name: " ",
        deliveryMode: "cohort",
      }).success,
    ).toBe(false);

    expect(
      validateCreateProgramInput({
        organizationId: ORG_ID,
        name: "X",
        deliveryMode: "live",
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported fields", () => {
    expect(
      validateCreateProgramInput({
        organizationId: ORG_ID,
        name: "X",
        deliveryMode: "cohort",
        expectedEndDate: "2026-01-01",
      }).success,
    ).toBe(false);
  });

  it("validates update, transition, archive and restore identifiers", () => {
    expect(
      validateUpdateProgramInput({
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
        name: "Updated",
        deliveryMode: "hybrid",
        description: null,
      }).success,
    ).toBe(true);

    expect(
      validateTransitionProgramStatusInput({
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
        toStatus: "active",
      }).success,
    ).toBe(true);

    expect(
      validateTransitionProgramStatusInput({
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
        toStatus: "archived",
      }).success,
    ).toBe(false);

    expect(
      validateArchiveProgramInput({
        organizationId: ORG_ID,
        programId: PROGRAM_ID,
      }).success,
    ).toBe(true);

    expect(
      validateRestoreProgramInput({
        organizationId: "not-a-uuid",
        programId: PROGRAM_ID,
      }).success,
    ).toBe(false);
  });
});

describe("program list query schemas", () => {
  it("allowlists sort fields and bounds pagination", () => {
    const parsed = validateProgramListQuery({
      organizationId: ORG_ID,
      filters: { search: "growth", includeArchived: false },
      pagination: { page: 2, pageSize: 10 },
      sort: { field: "name", direction: "asc" },
    });
    expect(parsed.success).toBe(true);

    expect(
      validateProgramListQuery({
        organizationId: ORG_ID,
        sort: { field: "secret", direction: "asc" },
      }).success,
    ).toBe(false);

    const pagination = normalizeProgramPagination({ page: 0, pageSize: 999 });
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(25);
  });

  it("rejects invalid status and delivery mode filters", () => {
    expect(
      validateProgramListQuery({
        organizationId: ORG_ID,
        filters: { status: "archived" },
      }).success,
    ).toBe(false);

    expect(
      validateProgramListQuery({
        organizationId: ORG_ID,
        filters: { deliveryMode: "live" },
      }).success,
    ).toBe(false);
  });
});
