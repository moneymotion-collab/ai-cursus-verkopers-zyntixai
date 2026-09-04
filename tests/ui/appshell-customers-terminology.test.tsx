import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import { MEMBERS_NAV_LABEL } from "@/features/invitations/domain/members-navigation";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import {
  KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
  SERVICE_MODULE_NAV_VISIBILITY,
  SERVICE_PRODUCT_TERMINOLOGY,
} from "../features/product-access/module-access-fixtures";

describe("AppShell Customers nav label terminology (BETA1-4TG-TERMINOLOGY)", () => {
  it("renders generic Customers label for Knowledge/OCB (TG1 unchanged) when terminology is omitted", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain(">Customers<");
    expect(html).not.toContain(">Clients<");
  });

  it("renders Customers label for Knowledge/OCB when explicit default terminology is supplied", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
        terminology={DEFAULT_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain(">Customers<");
  });

  it("renders Clients label for Service context terminology", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={SERVICE_MODULE_NAV_VISIBILITY}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain(">Clients<");
    expect(html).not.toContain(">Customers<");
  });

  it("does not let terminology influence module visibility (Programs stays hidden for Service)", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="customers"
        membersNavVisible={false}
        moduleNavVisibility={SERVICE_MODULE_NAV_VISIBILITY}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(SERVICE_MODULE_NAV_VISIBILITY.programs).toBe(false);
    expect(html).not.toContain(">Programs<");
    expect(html).toContain(">Clients<");
  });

  it("keeps the Members nav label as Members/Team for Service, not the seeded Technician term", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="members"
        membersNavVisible={true}
        moduleNavVisibility={SERVICE_MODULE_NAV_VISIBILITY}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain(`>${MEMBERS_NAV_LABEL}<`);
    expect(html).not.toContain(">Technicians<");
    expect(html).not.toContain(">Technician<");
  });

  it("falls back to generic Customers wording for unresolved context (no Course Seller fallback)", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="home">
        <p>content</p>
      </AppShell>,
    );
    expect(html).not.toContain(">Customers<");
    expect(html).not.toContain(">Clients<");
    expect(html).toContain(">Home<");
  });
});
