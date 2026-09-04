import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import {
  PROGRAMS_NAV_LABEL,
  PROGRAMS_ROUTE,
} from "@/features/programs/domain/programs-navigation";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../features/product-access/module-access-fixtures";

describe("Programs navigation activation", () => {
  it("exposes Programs link when context permits and preserves nav order", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="programs"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(PROGRAMS_NAV_LABEL);
    expect(html).toContain(`href="${PROGRAMS_ROUTE}"`);

    const customersIndex = html.indexOf(">Customers<");
    const programsIndex = html.indexOf(`>${PROGRAMS_NAV_LABEL}<`);
    const tasksIndex = html.indexOf(">Tasks<");
    expect(customersIndex).toBeGreaterThan(-1);
    expect(programsIndex).toBeGreaterThan(customersIndex);
    expect(tasksIndex).toBeGreaterThan(programsIndex);
  });

  it("hides Programs link when context denies access", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={{
          ...KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
          programs: false,
          enrollments: false,
          progress: false,
        }}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(html).not.toContain(`>${PROGRAMS_NAV_LABEL}<`);
  });
});
