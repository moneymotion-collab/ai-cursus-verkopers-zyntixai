import { describe, expect, it } from "vitest";
import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

describe("normalizeOrganizationInvitationEmail", () => {
  it("leaves a normal lowercase email unchanged", () => {
    expect(normalizeOrganizationInvitationEmail("user@example.com")).toBe(
      "user@example.com",
    );
  });

  it("lowercases an uppercase email", () => {
    expect(normalizeOrganizationInvitationEmail("USER@EXAMPLE.COM")).toBe(
      "user@example.com",
    );
  });

  it("trims leading whitespace", () => {
    expect(normalizeOrganizationInvitationEmail("  user@example.com")).toBe(
      "user@example.com",
    );
  });

  it("trims trailing whitespace", () => {
    expect(normalizeOrganizationInvitationEmail("user@example.com  ")).toBe(
      "user@example.com",
    );
  });

  it("lowercases mixed case", () => {
    expect(normalizeOrganizationInvitationEmail("User@Example.COM")).toBe(
      "user@example.com",
    );
  });

  it("trims and lowercases whitespace + mixed case", () => {
    expect(
      normalizeOrganizationInvitationEmail("  USER@Example.COM  "),
    ).toBe("user@example.com");
  });

  it("returns empty string for empty / whitespace-only input", () => {
    expect(normalizeOrganizationInvitationEmail("")).toBe("");
    expect(normalizeOrganizationInvitationEmail("   ")).toBe("");
  });
});
