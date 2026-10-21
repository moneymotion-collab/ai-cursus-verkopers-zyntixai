import { describe, expect, it } from "vitest";
import {
  PROJECT_STATUSES,
  projectPermissions,
  projectStatusLabel,
  type ProjectRole,
} from "@/features/projects/domain/types";
import {
  createProjectSchema,
  projectIdActionSchema,
  transitionProjectSchema,
  updateProjectSchema,
} from "@/features/projects/validation/project-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";

const validCreate = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  name: "  Website rollout  ",
  summary: "  Delivery summary  ",
  ownerMemberId: MEMBER_ID,
  plannedStart: "2026-09-05",
  plannedEnd: "2026-09-05",
};

describe("project input schemas", () => {
  it("normalizes text and optional values while accepting equal planned dates", () => {
    expect(createProjectSchema.parse(validCreate)).toEqual({
      ...validCreate,
      name: "Website rollout",
      summary: "Delivery summary",
    });

    expect(
      createProjectSchema.parse({
        ...validCreate,
        summary: " ",
        ownerMemberId: "",
        plannedStart: "",
        plannedEnd: null,
      }),
    ).toEqual({
      ...validCreate,
      name: "Website rollout",
      summary: null,
      ownerMemberId: null,
      plannedStart: null,
      plannedEnd: null,
    });
  });

  it("rejects reversed or invalid calendar dates at plannedEnd", () => {
    for (const input of [
      { ...validCreate, plannedEnd: "2026-09-04" },
      { ...validCreate, plannedStart: "2026-02-30" },
    ]) {
      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    }

    const reversed = createProjectSchema.safeParse({
      ...validCreate,
      plannedEnd: "2026-09-04",
    });
    if (reversed.success) throw new Error("Expected reversed dates to fail");
    expect(reversed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["plannedEnd"],
          message: "Planned end must be on or after planned start.",
        }),
      ]),
    );
  });

  it("enforces UUIDs, required names, length limits, and strict inputs", () => {
    expect(createProjectSchema.safeParse({ ...validCreate, organizationId: "other-org" }).success)
      .toBe(false);
    expect(createProjectSchema.safeParse({ ...validCreate, customerId: "" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ ...validCreate, name: " " }).success).toBe(false);
    expect(createProjectSchema.safeParse({ ...validCreate, name: "x".repeat(201) }).success)
      .toBe(false);
    expect(createProjectSchema.safeParse({ ...validCreate, summary: "x".repeat(4001) }).success)
      .toBe(false);
    expect(createProjectSchema.safeParse({ ...validCreate, status: "active" }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ ...validCreate, projectId: "bad-id" }).success)
      .toBe(false);
    expect(projectIdActionSchema.safeParse({ organizationId: ORG_ID, projectId: PROJECT_ID }).success)
      .toBe(true);
  });

  it("accepts only the canonical status set and caps transition reasons", () => {
    expect(PROJECT_STATUSES).toEqual([
      "planned",
      "active",
      "on_hold",
      "completed",
      "cancelled",
    ]);
    for (const toStatus of PROJECT_STATUSES) {
      expect(
        transitionProjectSchema.safeParse({
          organizationId: ORG_ID,
          projectId: PROJECT_ID,
          toStatus,
          reason: "",
        }).success,
      ).toBe(true);
    }
    expect(
      transitionProjectSchema.safeParse({
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        toStatus: "archived",
      }).success,
    ).toBe(false);
    expect(
      transitionProjectSchema.safeParse({
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        toStatus: "active",
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe("project permissions and lifecycle labels", () => {
  it.each([
    ["owner", [true, true, true, true, false, true]],
    ["admin", [true, true, true, true, false, true]],
    ["staff", [true, true, true, false, false, false]],
    ["viewer", [false, false, false, false, false, false]],
  ] satisfies [ProjectRole, boolean[]][])(
    "applies the active-project matrix for %s",
    (role, expected) => {
      expect(Object.values(projectPermissions(role))).toEqual(expected);
    },
  );

  it.each([
    ["owner", [true, false, false, false, true, true]],
    ["admin", [true, false, false, false, true, true]],
    ["staff", [true, false, false, false, false, false]],
    ["viewer", [false, false, false, false, false, false]],
  ] satisfies [ProjectRole, boolean[]][])(
    "applies the archived-project matrix for %s",
    (role, expected) => {
      expect(Object.values(projectPermissions(role, true))).toEqual(expected);
    },
  );

  it("renders stable human-readable labels for every lifecycle status", () => {
    expect(PROJECT_STATUSES.map(projectStatusLabel)).toEqual([
      "Planned",
      "Active",
      "On hold",
      "Completed",
      "Cancelled",
    ]);
  });
});
