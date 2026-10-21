import { describe, expect, it } from "vitest";
import { validateCreateOrganizationInvitationInput } from "@/features/invitations/validation/mutation-schemas";

const VALID_ORG_ID = "11111111-1111-4111-8111-111111111111";

describe("validateCreateOrganizationInvitationInput", () => {
  it("accepts valid UUID + email + admin/staff/viewer", () => {
    for (const targetRole of ["admin", "staff", "viewer"] as const) {
      const result = validateCreateOrganizationInvitationInput({
        organizationId: VALID_ORG_ID,
        email: "user@example.com",
        targetRole,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          organizationId: VALID_ORG_ID,
          email: "user@example.com",
          targetRole,
        });
      }
    }
  });

  it("rejects owner as target role", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: VALID_ORG_ID,
      email: "user@example.com",
      targetRole: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid roles", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: VALID_ORG_ID,
      email: "user@example.com",
      targetRole: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: "not-a-uuid",
      email: "user@example.com",
      targetRole: "staff",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: VALID_ORG_ID,
      email: "not-an-email",
      targetRole: "staff",
    });
    expect(result.success).toBe(false);
  });

  it("trims and lowercases email via domain normalizer", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: VALID_ORG_ID,
      email: "  USER@Example.COM  ",
      targetRole: "viewer",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects actor-authoritative fields via strict object", () => {
    const result = validateCreateOrganizationInvitationInput({
      organizationId: VALID_ORG_ID,
      email: "user@example.com",
      targetRole: "staff",
      actorRole: "owner",
      actorStatus: "active",
      userId: VALID_ORG_ID,
    });
    expect(result.success).toBe(false);
  });
});
