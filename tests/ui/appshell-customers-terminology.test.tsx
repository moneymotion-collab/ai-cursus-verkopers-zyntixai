import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import { MEMBERS_NAV_LABEL } from "@/features/invitations/domain/members-navigation";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import {
  FIELD_MODULE_NAV_VISIBILITY,
  FIELD_PRODUCT_TERMINOLOGY,
  KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
  SERVICE_MODULE_NAV_VISIBILITY,
  SERVICE_PRODUCT_TERMINOLOGY,
} from "../features/product-access/module-access-fixtures";

describe("AppShell shared nav terminology (BETA1-4TG-TERMINOLOGY)", () => {
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

  it("renders Projects for Service and Jobs for Field", () => {
    const serviceHtml = renderToStaticMarkup(
      <AppShell
        activeNav="projects"
        membersNavVisible={false}
        moduleNavVisibility={SERVICE_MODULE_NAV_VISIBILITY}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );
    const fieldHtml = renderToStaticMarkup(
      <AppShell
        activeNav="projects"
        membersNavVisible={false}
        moduleNavVisibility={FIELD_MODULE_NAV_VISIBILITY}
        terminology={FIELD_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(serviceHtml).toContain('href="/projects"');
    expect(serviceHtml).toContain(">Projects<");
    expect(serviceHtml).not.toContain(">Jobs<");
    expect(fieldHtml).toContain('href="/projects"');
    expect(fieldHtml).toContain(">Jobs<");
    expect(fieldHtml).not.toContain(">Projects<");
  });

  it("does not let project terminology grant Projects access", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
        terminology={FIELD_PRODUCT_TERMINOLOGY}
      >
        <p>content</p>
      </AppShell>,
    );

    expect(KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY.projects).toBe(false);
    expect(html).not.toContain('href="/projects"');
    expect(html).not.toContain(">Jobs<");
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

describe("AppShell skip-link and loading honesty", () => {
  it("places one skip-link to #main-content as the first focusable control", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    const firstHref = html.match(/<a\b[^>]*href="([^"]+)"/);
    expect(firstHref?.[1]).toBe("#main-content");
    expect(html).toContain("Skip to main content");
    expect(html).toContain('id="main-content"');
    expect(html).toContain('tabindex="-1"');
    expect((html.match(/id="main-content"/g) ?? []).length).toBe(1);
    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    expect(html.indexOf("Skip to main content")).toBeLessThan(
      html.indexOf('aria-label="Primary"'),
    );
    expect(html.indexOf("Skip to main content")).toBeLessThan(
      html.indexOf("Log out"),
    );
    expect(html.indexOf("Skip to main content")).toBeLessThan(
      html.indexOf(">Menu<"),
    );
    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain(">Leads<");
    expect(html).toContain(">Home<");
  });

  it("keeps resolved navigation unchanged when presentation is omitted", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).not.toContain("Loading workspace…");
    expect(html).toContain(">Leads<");
    expect(html).toContain(">Tasks<");
    expect(html).toContain(">Attention<");
  });

  it("hides Primary nav in pending Home loading and does not invent module links", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        navigationPresentation="pending"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain("Loading workspace…");
    expect(html).not.toContain('aria-label="Primary"');
    expect(html).not.toContain(">Leads<");
    expect(html).not.toContain(">Tasks<");
    expect(html).toContain("Skip to main content");
    expect(html).toContain(">ZyntixAI<");
    expect(html).toContain("Log out");
    expect(html).not.toContain("<summary");
    expect(html).not.toContain(">Menu<");
  });

  it("source-locks skip-link focus visibility above chrome without layout flow", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/app-shell.module.css"),
      "utf8",
    );
    expect(css).toContain(".skipLink:focus");
    expect(css).toContain(".skipLink:focus-visible");
    expect(css).toContain("clip: unset");
    expect(css).toContain("clip-path: none");
    expect(css).toContain("z-index: 50");
    expect(css).toContain("position: fixed");
    expect(css).toContain("width: auto");
    expect(css).toContain("height: auto");
    expect(css).toContain("overflow: visible");
    expect(css).toContain("pointer-events: auto");
    expect(css).toContain("outline: 2px solid var(--focus-color)");
    expect(css).toContain(".main:focus");
    expect(css).toContain(".main:focus-visible");
    expect(css.indexOf(".skipLink {")).toBeLessThan(css.indexOf(".header {"));
  });
});

describe("AppShell mobile navigation disclosure and active Home", () => {
  function homeAnchor(html: string): string {
    return html.match(/<a\b[^>]*>Home<\/a>/)?.[0] ?? "";
  }

  it("exposes an accessible Menu trigger and keeps Primary navigation collapsed by default", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain("<summary");
    expect(html).toContain(">Menu</summary>");
    expect(html).toMatch(/<details\b/);
    expect(html).not.toMatch(/<details\b[^>]*\sopen(?:\s|>)/);
    expect(html).toContain("Log out");
    expect(html.indexOf(">Menu<")).toBeGreaterThan(-1);
    expect(html.indexOf('aria-label="Primary"')).toBeGreaterThan(-1);
    expect(html.indexOf(">Menu<")).toBeLessThan(html.lastIndexOf('aria-label="Primary"'));
    expect(html.indexOf('aria-label="Primary"')).toBeLessThan(html.indexOf("Log out"));
  });

  it("keeps desktop Primary navigation order for authorized Knowledge destinations", () => {
    const html = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    const home = html.indexOf(">Home<");
    const leads = html.indexOf(">Leads<");
    const customers = html.indexOf(">Customers<");
    const programs = html.indexOf(">Programs<");
    const enrollments = html.indexOf(">Enrollments<");
    const progress = html.indexOf(">Progress<");
    const attention = html.indexOf(">Attention<");
    const tasks = html.indexOf(">Tasks<");
    expect(home).toBeGreaterThan(-1);
    expect(home).toBeLessThan(leads);
    expect(leads).toBeLessThan(customers);
    expect(customers).toBeLessThan(programs);
    expect(programs).toBeLessThan(enrollments);
    expect(enrollments).toBeLessThan(progress);
    expect(progress).toBeLessThan(attention);
    expect(attention).toBeLessThan(tasks);
  });

  it("marks Home as the current page only when Home is actually current", () => {
    const homeHtml = renderToStaticMarkup(
      <AppShell
        activeNav="home"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(homeAnchor(homeHtml)).toContain('aria-current="page"');

    const leadsHtml = renderToStaticMarkup(
      <AppShell
        activeNav="leads"
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(homeAnchor(leadsHtml)).not.toContain("aria-current");
    expect(leadsHtml).toMatch(/<a\b[^>]*aria-current="page"[^>]*>Leads<\/a>/);

    const defaultHtml = renderToStaticMarkup(
      <AppShell
        membersNavVisible={false}
        moduleNavVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      >
        <p>content</p>
      </AppShell>,
    );
    expect(homeAnchor(defaultHtml)).not.toContain("aria-current");
  });

  it("keeps unresolved Home-only navigation free of unauthorized modules", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="home">
        <p>content</p>
      </AppShell>,
    );
    expect(html).toContain(">Home<");
    expect(html).toContain(">Menu</summary>");
    expect(html).toContain("Log out");
    expect(html).not.toContain(">Leads<");
    expect(html).not.toContain(">Customers<");
    expect(html).not.toContain(">Tasks<");
    expect(html).not.toContain(">Attention<");
    expect(html).not.toContain(">Programs<");
  });

  it("source-locks mobile compact header, visible focus, and active-page treatment", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/app-shell.module.css"),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 959px)");
    expect(css).toContain("@media (min-width: 960px)");
    expect(css).toContain(".menuTrigger");
    expect(css).toContain(".navDisclosure");
    expect(css).toContain(".desktopCluster");
    expect(css).toContain(".navCluster");
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain("display: none");
    expect(css).toContain('[aria-current="page"]');
    expect(css).toContain(".menuTrigger:focus-visible");
    expect(css).toContain(".navLink:focus-visible");
    expect(css).toContain("min-height: var(--control-min-height)");
  });
});
