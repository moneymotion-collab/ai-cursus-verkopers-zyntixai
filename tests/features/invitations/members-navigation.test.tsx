import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppShell } from "@/components/app-shell";
import {
  MEMBERS_NAV_LABEL,
  MEMBERS_NAV_VISIBLE,
  MEMBERS_ROUTE,
  buildMembersListHref,
  isMembersPathname,
  resolveMembersNavVisible,
} from "@/features/invitations/domain/members-navigation";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../../features/product-access/module-access-fixtures";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "99999999-9999-4999-8999-999999999999";

describe("resolveMembersNavVisible", () => {
  it("honors explicit false and true overrides", () => {
    expect(
      resolveMembersNavVisible({
        explicitVisibility: false,
        organizationOptions: [{ organizationId: ORG_A, role: "owner" }],
      }),
    ).toBe(false);

    expect(
      resolveMembersNavVisible({
        explicitVisibility: true,
        organizationOptions: [],
      }),
    ).toBe(true);
  });

  it("hides when options are empty or undefined", () => {
    expect(resolveMembersNavVisible({})).toBe(false);
    expect(resolveMembersNavVisible({ organizationOptions: [] })).toBe(false);
    expect(resolveMembersNavVisible({ organizationOptions: null })).toBe(false);
  });

  it("derives sole-org visibility from role", () => {
    expect(
      resolveMembersNavVisible({
        organizationOptions: [{ organizationId: ORG_A, role: "owner" }],
      }),
    ).toBe(true);
    expect(
      resolveMembersNavVisible({
        organizationOptions: [{ organizationId: ORG_A, role: "admin" }],
      }),
    ).toBe(true);
    expect(
      resolveMembersNavVisible({
        organizationOptions: [{ organizationId: ORG_A, role: "staff" }],
      }),
    ).toBe(false);
    expect(
      resolveMembersNavVisible({
        organizationOptions: [{ organizationId: ORG_A, role: "viewer" }],
      }),
    ).toBe(false);
  });

  it("scopes multi-org visibility to the selected organization only", () => {
    const options = [
      { organizationId: ORG_A, role: "owner" as const },
      { organizationId: ORG_B, role: "viewer" as const },
    ];

    expect(
      resolveMembersNavVisible({
        organizationOptions: options,
        selectedOrganizationId: ORG_B,
      }),
    ).toBe(false);

    expect(
      resolveMembersNavVisible({
        organizationOptions: [
          { organizationId: ORG_A, role: "viewer" },
          { organizationId: ORG_B, role: "admin" },
        ],
        selectedOrganizationId: ORG_B,
      }),
    ).toBe(true);

    expect(
      resolveMembersNavVisible({
        organizationOptions: options,
      }),
    ).toBe(false);

    expect(
      resolveMembersNavVisible({
        organizationOptions: options,
        selectedOrganizationId: "00000000-0000-4000-8000-000000000000",
      }),
    ).toBe(false);
  });
});

describe("Members navigation AppShell presentation", () => {
  it("exposes Members route constants", () => {
    expect(MEMBERS_NAV_VISIBLE).toBe(true);
    expect(MEMBERS_ROUTE).toBe("/settings/members");
    expect(isMembersPathname("/settings/members")).toBe(true);
    expect(isMembersPathname("/settings/members-evil")).toBe(false);
    expect(buildMembersListHref(ORG_A)).toBe(
      `/settings/members?org=${ORG_A}`,
    );
  });

  it("renders Members nav for Owner options and hides for Staff", () => {
    const ownerHtml = renderToStaticMarkup(
      <AppShell
        activeNav="members"
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
        organizationOptions={[
          { organizationId: ORG_A, role: "owner", displayName: "Acme" },
        ]}
        selectedOrganizationId={ORG_A}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(ownerHtml).toContain(MEMBERS_NAV_LABEL);
    expect(ownerHtml).toContain(`aria-current="page"`);

    const staffHtml = renderToStaticMarkup(
      <AppShell
        activeNav="tasks"
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
        organizationOptions={[
          { organizationId: ORG_A, role: "staff", displayName: "Acme" },
        ]}
        selectedOrganizationId={ORG_A}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(staffHtml).not.toContain(`>${MEMBERS_NAV_LABEL}<`);
  });

  it("hides Members nav with no options (loading/error fail-closed)", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="members">
        <p>content</p>
      </AppShell>,
    );
    expect(html).not.toContain(`>${MEMBERS_NAV_LABEL}<`);
  });

  it("hides Members when Owner in another org but Viewer is selected", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="tasks"
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
        organizationOptions={[
          { organizationId: ORG_A, role: "owner", displayName: "Org A" },
          { organizationId: ORG_B, role: "viewer", displayName: "Org B" },
        ]}
        selectedOrganizationId={ORG_B}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).not.toContain(`>${MEMBERS_NAV_LABEL}<`);
  });

  it("keeps Members loading source free of forced visible override", () => {
    const loadingSource = readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/settings/members/loading.tsx",
      ),
      "utf8",
    );
    expect(loadingSource).not.toMatch(/membersNavVisible\s*=?\s*\{?\s*true/);
    expect(loadingSource).not.toContain("membersNavVisible>");
  });

  it("does not import server-only modules into Members nav resolution", () => {
    const navSource = readFileSync(
      path.join(
        process.cwd(),
        "src/features/invitations/domain/members-navigation.ts",
      ),
      "utf8",
    );
    const accessSource = readFileSync(
      path.join(
        process.cwd(),
        "src/features/invitations/domain/member-administration-access.ts",
      ),
      "utf8",
    );
    for (const source of [navSource, accessSource]) {
      expect(source).not.toContain("next/headers");
      expect(source).not.toContain("createSupabaseServerClient");
      expect(source).not.toContain("server-only");
    }
  });
});
