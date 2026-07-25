import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import {
  ENROLLMENTS_NAV_LABEL,
  ENROLLMENTS_NAV_VISIBLE,
  ENROLLMENTS_ROUTE,
} from "@/features/enrollments/domain/enrollments-navigation";

describe("Enrollments navigation activation", () => {
  it("exposes Enrollments link in authenticated shell after Programs and before Tasks", () => {
    expect(ENROLLMENTS_NAV_VISIBLE).toBe(true);

    const html = renderToStaticMarkup(
      <AppShell activeNav="enrollments">
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(ENROLLMENTS_NAV_LABEL);
    expect(html).toContain(`href="${ENROLLMENTS_ROUTE}"`);

    const customersIndex = html.indexOf(">Customers<");
    const programsIndex = html.indexOf(">Programs<");
    const enrollmentsIndex = html.indexOf(`>${ENROLLMENTS_NAV_LABEL}<`);
    const tasksIndex = html.indexOf(">Tasks<");

    expect(customersIndex).toBeGreaterThan(-1);
    expect(programsIndex).toBeGreaterThan(customersIndex);
    expect(enrollmentsIndex).toBeGreaterThan(programsIndex);
    expect(tasksIndex).toBeGreaterThan(enrollmentsIndex);
  });

  it("marks the Enrollments link as the current page when active", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="enrollments">
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(`aria-current="page" href="${ENROLLMENTS_ROUTE}"`);
  });
});
