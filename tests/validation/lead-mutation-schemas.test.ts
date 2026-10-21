import { describe, expect, it } from "vitest";
import {
  archiveLeadInputSchema,
  convertLeadInputSchema,
  createLeadInputSchema,
  restoreLeadInputSchema,
  transitionLeadStageInputSchema,
  transitionLeadStatusInputSchema,
  updateLeadProfileInputSchema,
} from "@/features/leads/validation/mutation-schemas";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";
const CUSTOMER_ID = "55555555-5555-4555-8555-555555555555";

describe("createLeadInputSchema", () => {
  it("accepts normalized optional fields and defaults sourceType", () => {
    const result = createLeadInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "  Prospect Co  ",
      firstName: "",
      lastName: "  ",
      email: "  OPS@LEAD.TEST ",
      phone: "",
      ownerMemberId: MEMBER_ID,
      sourceDetail: "  LinkedIn  ",
      pursuitLabel: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Prospect Co");
      expect(result.data.firstName).toBeNull();
      expect(result.data.lastName).toBeNull();
      expect(result.data.email).toBe("ops@lead.test");
      expect(result.data.phone).toBeNull();
      expect(result.data.sourceType).toBe("manual");
      expect(result.data.sourceDetail).toBe("LinkedIn");
      expect(result.data.pursuitLabel).toBeNull();
    }
  });

  it("rejects stage, status, and unknown lifecycle fields", () => {
    const result = createLeadInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "Prospect",
      stageId: STAGE_ID,
      status: "open",
      toStatus: "converted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUIDs, whitespace-only display names, and overlong fields", () => {
    expect(
      createLeadInputSchema.safeParse({
        organizationId: "bad",
        displayName: "x".repeat(201),
      }).success,
    ).toBe(false);

    expect(
      createLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        displayName: "   ",
      }).success,
    ).toBe(false);

    expect(
      createLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        displayName: "Prospect",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("surfaces Lead name and Lead source terminology in validation messages", () => {
    const missingName = createLeadInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "   ",
    });
    expect(missingName.success).toBe(false);
    if (!missingName.success) {
      expect(missingName.error.issues.some((issue) => issue.message === "Lead name is required.")).toBe(
        true,
      );
    }

    const missingSource = createLeadInputSchema.safeParse({
      organizationId: ORG_ID,
      displayName: "Prospect",
      sourceType: "   ",
    });
    expect(missingSource.success).toBe(false);
    if (!missingSource.success) {
      expect(
        missingSource.error.issues.some((issue) => issue.message === "Lead source is required."),
      ).toBe(true);
    }
  });
});

describe("updateLeadProfileInputSchema", () => {
  it("rejects lifecycle, conversion, and privileged fields", () => {
    const result = updateLeadProfileInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      displayName: "Prospect",
      sourceType: "manual",
      status: "lost",
      stageId: STAGE_ID,
      archivedAt: "2026-07-14T10:00:00.000Z",
      convertedCustomerId: CUSTOMER_ID,
      role: "owner",
      actorId: MEMBER_ID,
    });
    expect(result.success).toBe(false);
  });

  it("enforces phone max length and requires display name", () => {
    expect(
      updateLeadProfileInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        displayName: "Prospect",
        sourceType: "manual",
        phone: "x".repeat(51),
      }).success,
    ).toBe(false);

    const missingName = updateLeadProfileInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      displayName: "",
      sourceType: "manual",
    });
    expect(missingName.success).toBe(false);
    if (!missingName.success) {
      expect(missingName.error.issues.some((issue) => issue.message === "Lead name is required.")).toBe(
        true,
      );
    }
  });

  it("accepts legacy free-text sourceType values on update without rewriting them", () => {
    const result = updateLeadProfileInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      displayName: "Prospect",
      sourceType: "trade-show-2024",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceType).toBe("trade-show-2024");
    }
  });

  it("rejects empty update payloads missing required fields", () => {
    expect(updateLeadProfileInputSchema.safeParse({}).success).toBe(false);
    expect(
      updateLeadProfileInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
      }).success,
    ).toBe(false);
  });
});

describe("transitionLeadStageInputSchema", () => {
  it("accepts trimmed reason and nullifies empty reason", () => {
    const result = transitionLeadStageInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      toStageId: STAGE_ID,
      reason: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBeNull();
    }
  });

  it("rejects unknown fields and invalid stage ids", () => {
    expect(
      transitionLeadStageInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStageId: STAGE_ID,
        fromStageId: STAGE_ID,
      }).success,
    ).toBe(false);

    expect(
      transitionLeadStageInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStageId: "bad",
      }).success,
    ).toBe(false);
  });
});

describe("transitionLeadStatusInputSchema", () => {
  it("accepts allowed transition targets", () => {
    for (const toStatus of ["open", "lost", "disqualified"] as const) {
      expect(
        transitionLeadStatusInputSchema.safeParse({
          organizationId: ORG_ID,
          leadId: LEAD_ID,
          toStatus,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects conversion through generic status mutation", () => {
    const result = transitionLeadStatusInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      toStatus: "converted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown statuses and extra actor fields", () => {
    expect(
      transitionLeadStatusInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStatus: "active",
      }).success,
    ).toBe(false);

    expect(
      transitionLeadStatusInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStatus: "lost",
        fromStatus: "open",
        role: "staff",
      }).success,
    ).toBe(false);
  });

  it("rejects reason over 500 characters", () => {
    expect(
      transitionLeadStatusInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStatus: "lost",
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe("convertLeadInputSchema", () => {
  it("accepts create-new and link-existing conversion payloads", () => {
    expect(
      convertLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
      }).success,
    ).toBe(true);

    const linked = convertLeadInputSchema.safeParse({
      organizationId: ORG_ID,
      leadId: LEAD_ID,
      existingCustomerId: CUSTOMER_ID,
      reason: "  Matched existing customer  ",
    });
    expect(linked.success).toBe(true);
    if (linked.success) {
      expect(linked.data.reason).toBe("Matched existing customer");
    }
  });

  it("rejects conversion payloads that smuggle status mutation fields", () => {
    expect(
      convertLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStatus: "converted",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid existing customer ids", () => {
    expect(
      convertLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        existingCustomerId: "bad",
      }).success,
    ).toBe(false);
  });
});

describe("archive and restore schemas", () => {
  it("accepts bounded archive and restore input", () => {
    expect(
      archiveLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
      }).success,
    ).toBe(true);
    expect(
      restoreLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown restore fields", () => {
    expect(
      restoreLeadInputSchema.safeParse({
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        archivedAt: null,
      }).success,
    ).toBe(false);
  });
});
