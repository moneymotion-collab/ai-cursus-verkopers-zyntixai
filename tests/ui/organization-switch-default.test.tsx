import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShellChrome } from "@/components/app-shell-chrome";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";

const firstOrganization: OrganizationOption = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  role: "owner",
  displayName: "First workspace",
};
const secondOrganization: OrganizationOption = {
  organizationId: "22222222-2222-4222-8222-222222222222",
  role: "owner",
  displayName: "Second workspace",
};

function renderShell(selectedOrganizationId?: string) {
  return renderToStaticMarkup(
    <AppShellChrome
      activeNav="home"
      membersNavVisible={false}
      organizationOptions={[firstOrganization, secondOrganization]}
      selectedOrganizationId={selectedOrganizationId}
      organizationSelectorAction="/home"
    >
      <h1>Today</h1>
    </AppShellChrome>,
  );
}

function checkedValues(html: string) {
  return [...html.matchAll(/name="org" checked="" value="([^"]+)"/g)].map(
    (match) => match[1],
  );
}

describe("organization switch default", () => {
  it("checks the first organization when no radio has been chosen", () => {
    const html = renderShell();

    expect(checkedValues(html)).toEqual([
      firstOrganization.organizationId,
      firstOrganization.organizationId,
    ]);
    expect(html).toContain(firstOrganization.displayName);
    expect(html).not.toContain(
      `name="org" checked="" value="${secondOrganization.organizationId}"`,
    );
  });

  it("checks the first organization when the current id matches neither option", () => {
    const html = renderShell("33333333-3333-4333-8333-333333333333");

    expect(checkedValues(html)).toEqual([
      firstOrganization.organizationId,
      firstOrganization.organizationId,
    ]);
  });

  it("keeps the matching organization checked", () => {
    const html = renderShell(secondOrganization.organizationId);

    expect(checkedValues(html)).toEqual([
      secondOrganization.organizationId,
      secondOrganization.organizationId,
    ]);
    expect(html).not.toContain(
      `name="org" checked="" value="${firstOrganization.organizationId}"`,
    );
  });
});
