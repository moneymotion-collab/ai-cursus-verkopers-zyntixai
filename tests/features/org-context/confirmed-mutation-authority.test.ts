import { describe, expect, it } from "vitest";
import {
  isActiveConfirmedActorMembership,
  isOrgContextConfirmedActorRole,
  isOrgContextConfirmedMutationOperation,
} from "@/features/org-context/domain/confirmed-mutation-authority";
import { ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS } from "@/features/org-context/domain/types";

describe("ORG-CONTEXT confirmed mutation authority", () => {
  it("allows only classify, activate, and assign", () => {
    expect([...ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS]).toEqual([
      "classify_activity",
      "activate_activity",
      "assign_context_version",
    ]);
    expect(isOrgContextConfirmedMutationOperation("classify_activity")).toBe(true);
    expect(isOrgContextConfirmedMutationOperation("activate_activity")).toBe(true);
    expect(isOrgContextConfirmedMutationOperation("assign_context_version")).toBe(true);
    expect(isOrgContextConfirmedMutationOperation("create_activity")).toBe(false);
    expect(isOrgContextConfirmedMutationOperation("set_primary")).toBe(false);
    expect(isOrgContextConfirmedMutationOperation("change_context_version")).toBe(false);
    expect(isOrgContextConfirmedMutationOperation("archive_activity")).toBe(false);
    expect(isOrgContextConfirmedMutationOperation("unknown")).toBe(false);
  });

  it("allows only active Owner or Admin in the same Organization", () => {
    expect(isOrgContextConfirmedActorRole("owner")).toBe(true);
    expect(isOrgContextConfirmedActorRole("admin")).toBe(true);
    expect(isOrgContextConfirmedActorRole("staff")).toBe(false);
    expect(isOrgContextConfirmedActorRole("viewer")).toBe(false);
    expect(
      isActiveConfirmedActorMembership({
        status: "active",
        role: "owner",
        organizationId: "org-a",
        expectedOrganizationId: "org-a",
      }),
    ).toBe(true);
    expect(
      isActiveConfirmedActorMembership({
        status: "suspended",
        role: "owner",
        organizationId: "org-a",
        expectedOrganizationId: "org-a",
      }),
    ).toBe(false);
    expect(
      isActiveConfirmedActorMembership({
        status: "active",
        role: "staff",
        organizationId: "org-a",
        expectedOrganizationId: "org-a",
      }),
    ).toBe(false);
    expect(
      isActiveConfirmedActorMembership({
        status: "active",
        role: "admin",
        organizationId: "org-b",
        expectedOrganizationId: "org-a",
      }),
    ).toBe(false);
  });
});
