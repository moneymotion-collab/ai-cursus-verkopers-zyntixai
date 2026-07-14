import { describe, expect, it } from "vitest";
import { resolveSelectedOrganization } from "@/features/tasks/ui/resolve-task-organization-selection";

const ORG_A = "02016e91-7237-4a20-aec3-6275d2e8a67f";
const ORG_B = "e6e4c376-697c-4863-bb30-fd52b7256ff9";

const memberships = [
  { organizationId: ORG_A, role: "staff" as const },
  { organizationId: ORG_B, role: "owner" as const },
];

describe("multi-organization selection safety", () => {
  it("auto-selects the only organization", () => {
    const result = resolveSelectedOrganization([memberships[0]], undefined);
    expect(result.organizationId).toBe(ORG_A);
    expect(result.requiresSelection).toBe(false);
  });

  it("uses a valid verified organization for multiple memberships", () => {
    const result = resolveSelectedOrganization(memberships, ORG_B);
    expect(result.organizationId).toBe(ORG_B);
    expect(result.requiresSelection).toBe(false);
    expect(result.invalidSelection).toBe(false);
  });

  it("requires explicit selection when multiple organizations and no org param", () => {
    const result = resolveSelectedOrganization(memberships, undefined);
    expect(result.organizationId).toBeNull();
    expect(result.requiresSelection).toBe(true);
    expect(result.invalidSelection).toBe(false);
  });

  it("requires explicit selection for invalid organization param", () => {
    const result = resolveSelectedOrganization(
      memberships,
      "00000000-0000-4000-8000-000000000001",
    );
    expect(result.organizationId).toBeNull();
    expect(result.requiresSelection).toBe(true);
    expect(result.invalidSelection).toBe(true);
  });

  it("does not silently fall back to the first organization", () => {
    const missing = resolveSelectedOrganization(memberships, undefined);
    const invalid = resolveSelectedOrganization(memberships, "not-a-uuid");
    expect(missing.organizationId).not.toBe(ORG_A);
    expect(invalid.organizationId).not.toBe(ORG_A);
  });
});
