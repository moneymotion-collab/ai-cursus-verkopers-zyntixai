import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf8");
}

describe("SMM-B1.11-B calendar tenant honesty", () => {
  it("calendar loader always filters by the resolved organization id", () => {
    const loader = read(
      "src/features/social-media/server/load-social-calendar.ts",
    );
    expect(loader).toContain('.eq("organization_id", input.organizationId)');
    expect(loader).toContain(
      "asString(record.organization_id) !== input.organizationId",
    );
    expect(loader).not.toContain("service_role");
    expect(loader).not.toContain("accessToken");
  });

  it("workspace page still uses authoritative org resolution before calendar load", () => {
    const page = read(
      "src/features/social-media/server/load-social-workspace-page.ts",
    );
    expect(page).toContain("resolveSelectedOrganization");
    expect(page).toContain("resolveOrganizationContext");
    expect(page).toContain("canManageSocialConnections");
    expect(page.indexOf("resolveOrganizationContext")).toBeLessThan(
      page.indexOf("loadSocialCalendar"),
    );
  });

  it("does not let calendar query parameters override organization context", () => {
    const page = read(
      "src/features/social-media/server/load-social-workspace-page.ts",
    );
    expect(page).not.toContain("organizationId: tzParamRaw");
    expect(page).not.toContain("organizationId: weekParam");
    expect(page).toContain("canScheduleSocialPublication(role, \"active\")");
  });
});
