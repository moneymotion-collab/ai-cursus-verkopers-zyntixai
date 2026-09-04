import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import {
  ENROLLMENTS_NAV_LABEL,
  ENROLLMENTS_NAV_VISIBLE,
  ENROLLMENTS_ROUTE,
} from "@/features/enrollments/domain/enrollments-navigation";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../features/product-access/module-access-fixtures";

describe("Enrollments navigation activation", () => {
  it("exposes Enrollments link when context permits and preserves nav order", () => {
    expect(ENROLLMENTS_NAV_VISIBLE).toBe(false);

    const html = renderToStaticMarkup(
      <AppShell
        activeNav="enrollments"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
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
      <AppShell
        activeNav="enrollments"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(`aria-current="page" href="${ENROLLMENTS_ROUTE}"`);
  });

  it("hides Enrollments link when context denies access", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={{
          ...KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
          enrollments: false,
        }}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(html).not.toContain(`>${ENROLLMENTS_NAV_LABEL}<`);
  });
});
