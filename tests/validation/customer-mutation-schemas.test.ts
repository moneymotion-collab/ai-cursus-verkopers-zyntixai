import { describe, expect, it } from "vitest";
import {
  archiveCustomerInputSchema,
  createCustomerInputSchema,
  restoreCustomerInputSchema,
  transitionCustomerStatusInputSchema,
  updateCustomerProfileInputSchema,
} from "@/features/customers/validation/mutation-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

describe("createCustomerInputSchema", () => {
  it("accepts normalized optional fields", () => {
    const result = createCustomerInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "  Acme Corp  ",
      firstName: "",
      lastName: "  ",
      email: "  OPS@ACME.TEST ",
      phone: "",
      ownerMemberId: MEMBER_ID,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Acme Corp");
      expect(result.data.firstName).toBeNull();
      expect(result.data.lastName).toBeNull();
      expect(result.data.email).toBe("ops@acme.test");
      expect(result.data.phone).toBeNull();
    }
  });

  it("rejects unknown fields", () => {
    const result = createCustomerInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "Acme",
      status: "active",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUIDs and oversized display name", () => {
    expect(
      createCustomerInputSchema.safeParse({
        organizationId: "bad",
        displayName: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("updateCustomerProfileInputSchema", () => {
  it("rejects lifecycle and metadata fields", () => {
    const result = updateCustomerProfileInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      displayName: "Acme",
      status: "paused",
      archivedAt: "2026-07-14T10:00:00.000Z",
      metadata: { foo: "bar" },
      role: "owner",
      actorId: MEMBER_ID,
    });
    expect(result.success).toBe(false);
  });

  it("enforces phone max length", () => {
    const result = updateCustomerProfileInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      displayName: "Acme",
      phone: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe("transitionCustomerStatusInputSchema", () => {
  it("accepts trimmed reason and nullifies empty reason", () => {
    const result = transitionCustomerStatusInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      toStatus: "paused",
      reason: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBeNull();
    }
  });

  it("rejects client-supplied current status and actor fields", () => {
    const result = transitionCustomerStatusInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      toStatus: "paused",
      fromStatus: "active",
      role: "staff",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reason over 500 characters", () => {
    const result = transitionCustomerStatusInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      toStatus: "paused",
      reason: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("archive and restore schemas", () => {
  it("accept bounded archive input", () => {
    const result = archiveCustomerInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });
    expect(result.success).toBe(true);
  });

  it("reject unknown restore fields", () => {
    const result = restoreCustomerInputSchema.safeParse({
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
      archivedAt: null,
    });
    expect(result.success).toBe(false);
  });
});
