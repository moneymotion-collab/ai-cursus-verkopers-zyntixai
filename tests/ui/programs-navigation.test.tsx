import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import {
  PROGRAMS_NAV_LABEL,
  PROGRAMS_NAV_VISIBLE,
  PROGRAMS_ROUTE,
} from "@/features/programs/domain/programs-navigation";

describe("Programs navigation activation", () => {
  it("exposes Programs link in authenticated shell after Customers and before Tasks", () => {
    expect(PROGRAMS_NAV_VISIBLE).toBe(true);

    const html = renderToStaticMarkup(
      <AppShell activeNav="programs">
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(PROGRAMS_NAV_LABEL);
    expect(html).toContain(`href="${PROGRAMS_ROUTE}"`);
    expect(html).not.toContain("Enrollments");

    const customersIndex = html.indexOf(">Customers<");
    const programsIndex = html.indexOf(`>${PROGRAMS_NAV_LABEL}<`);
    const tasksIndex = html.indexOf(">Tasks<");
    expect(customersIndex).toBeGreaterThan(-1);
    expect(programsIndex).toBeGreaterThan(customersIndex);
    expect(tasksIndex).toBeGreaterThan(programsIndex);
  });
});
