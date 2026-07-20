import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(
  join(process.cwd(), "src/features/onboarding/actions/onboarding-actions.ts"),
  "utf8",
);
const apply = readFileSync(
  join(process.cwd(), "src/features/onboarding/server/apply-onboarding.ts"),
  "utf8",
);
const read = readFileSync(
  join(process.cwd(), "src/features/onboarding/server/read-onboarding-context.ts"),
  "utf8",
);

describe("B1.2 onboarding source security contract", () => {
  it("keeps server actions behind getUser-backed helpers and typed parsers", () => {
    expect(actions).toContain('"use server"');
    expect(actions).toContain("createSupabaseServerClient");
    expect(actions).toContain("parseOnboardingDraftInput");
    expect(actions).toContain("parseOnboardingCompleteInput");
    expect(actions).not.toContain("SERVICE_ROLE");
    expect(actions).not.toContain("service_role");
  });

  it("requires owner role before write RPC and never trusts org id alone", () => {
    expect(apply).toContain('resolved.role !== "owner"');
    expect(apply).toContain("apply_organization_onboarding");
    expect(apply).toContain("resolveOnboardingOrganizationId");
    expect(read).toContain("listActiveOrganizationMemberships");
    expect(read).toContain("organization_ambiguous");
  });

  it("does not introduce onboarding UI routes or middleware gates", () => {
    expect(actions).not.toContain("redirect(");
    expect(apply).not.toContain("middleware");
  });
});
