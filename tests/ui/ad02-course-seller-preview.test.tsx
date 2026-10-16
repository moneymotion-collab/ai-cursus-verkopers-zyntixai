import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Ad02PreviewBody } from "@/dev/ad02-preview-body";
import previewStyles from "@/dev/ad02-preview.module.css";
import {
  COURSE_SELLER_PREVIEW_STATES,
  resolveAd02PreviewAccess,
} from "@/dev/ad02-preview-access";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
  notFound: () => {
    throw new Error("notFound");
  },
}));

const root = process.cwd();

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("course seller layout preview protection", () => {
  it("decides preview access from the runtime environment", () => {
    for (const state of [undefined, "", "course-seller", "course-seller-leads", "populated", "program-new"]) {
      expect(
        resolveAd02PreviewAccess({ nodeEnv: "development", vercelEnv: undefined, state }),
      ).toBe("allow");
    }

    for (const state of COURSE_SELLER_PREVIEW_STATES) {
      expect(
        resolveAd02PreviewAccess({ nodeEnv: "production", vercelEnv: "preview", state }),
      ).toBe("allow");
    }
    for (const state of [
      undefined,
      "",
      "populated",
      "program-new",
      "course-seller-unknown",
      "course-seller-leads-extra",
      ["course-seller", "leads"],
    ]) {
      expect(
        resolveAd02PreviewAccess({ nodeEnv: "production", vercelEnv: "preview", state }),
      ).toBe("not-found");
    }

    for (const state of [undefined, ...COURSE_SELLER_PREVIEW_STATES, "populated"]) {
      expect(
        resolveAd02PreviewAccess({ nodeEnv: "production", vercelEnv: "production", state }),
      ).toBe("not-found");
      expect(
        resolveAd02PreviewAccess({ nodeEnv: "production", vercelEnv: undefined, state }),
      ).toBe("not-found");
    }
  });

  it("keeps production fail-closed in the route, middleware, and webpack build", () => {
    const page = source("src/app/ad02-preview/page.tsx");
    const middleware = source("src/middleware.ts");
    const disabled = source("src/dev/ad02-preview-disabled.tsx");
    const config = source("next.config.ts");

    expect(page).toContain("resolveAd02PreviewAccess");
    expect(page.indexOf("notFound()")).toBeLessThan(page.indexOf("<Ad02PreviewBody"));
    expect(middleware).toContain('request.nextUrl.pathname === "/ad02-preview"');
    expect(middleware.indexOf("status: 404")).toBeLessThan(middleware.indexOf("updateSession(request)"));
    expect(middleware).toContain('process.env.VERCEL_ENV === "preview"');
    expect(middleware).toContain("nextWithTrustedDocumentLanguage(request)");
    expect(disabled).toContain("notFound()");
    expect(disabled).not.toContain("AppShellChrome");
    expect(config).toContain("ad02-preview-body");
    expect(config).toContain("ad02-preview-disabled.tsx");
    expect(config).toContain('process.env.VERCEL_ENV !== "preview"');
  });

  it("does not import a database or mail client from the preview files", () => {
    const files = [
      "src/app/ad02-preview/page.tsx",
      "src/dev/ad02-preview-access.ts",
      "src/dev/ad02-preview-body.tsx",
      "src/dev/ad02-preview-disabled.tsx",
      "src/dev/ad03-records-preview.tsx",
      "src/dev/ad04-records-preview.tsx",
      "src/dev/ad05-records-preview.tsx",
      "src/dev/ad09-records-preview.tsx",
    ];
    for (const file of files) {
      const text = source(file);
      expect(text).not.toMatch(/supabase|serviceRole|createClient|sendEmail|signUp|rpc\(/);
    }
  });

  it("labels the course seller index as a local simulation and shows only its navigation", () => {
    const html = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller" }} />,
    );

    expect(html).toContain("Local simulated QA preview for course_seller");
    expect(html).toContain("Not a signed-in workspace and not a runtime access test.");
    expect(html).toContain("Course seller layout preview");
    for (const label of [
      "Home",
      "Leads",
      "Customers",
      "Programs",
      "Enrollments",
      "Progress",
      "Attention",
      "Tasks",
      "Members",
    ]) {
      expect(html).toContain(`>${label}</a>`);
    }
    for (const hidden of [
      "Projects",
      "Sites",
      "Work orders",
      "Dispatch",
      "Products",
      "Orders",
      "Inventory",
      "Fulfillment",
      "Social",
    ]) {
      expect(html).not.toContain(`>${hidden}</a>`);
    }
    expect(html).toContain("/ad02-preview?state=course-seller-leads-empty");
    expect(html).toContain("/ad02-preview?state=course-seller-program-list");
    for (const state of COURSE_SELLER_PREVIEW_STATES) {
      if (state === "course-seller" || state.endsWith("-new") || state.endsWith("-form") || state.endsWith("-detail")) {
        continue;
      }
      expect(html).toContain(`/ad02-preview?state=${state}`);
    }
    const programList = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-program-list" }} />,
    );
    expect(programList).toContain("/ad02-preview?state=course-seller-program-new");
    expect(programList).not.toContain("/ad02-preview?state=program-new");
    const home = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-empty" }} />,
    );
    expect(home).toContain("/ad02-preview?state=course-seller-attention");
    expect(home).toContain("/ad02-preview?state=course-seller-tasks");
    expect(home).toContain("/ad02-preview?state=course-seller-leads");
    const members = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-member-list" }} />,
    );
    expect(members).toContain(">Members</h1>");
    expect(members).not.toContain("Invite member");
    expect(html).toContain('href="/programs?org=11111111-1111-4111-8111-111111111111"');
    expect(html).not.toContain('href="/projects');
    expect(html).not.toContain('href="/products');
  });

  it("renders empty and filled course seller lists from local synthetic data", () => {
    const leadsEmpty = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-leads-empty" }} />,
    );
    const leadsFilled = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-leads" }} />,
    );
    const programsEmpty = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-program-empty" }} />,
    );
    const programsFilled = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-program-list" }} />,
    );

    for (const html of [leadsEmpty, leadsFilled, programsEmpty, programsFilled]) {
      expect(html).toContain("Local simulated QA preview for course_seller");
      expect(html).toContain(">Programs</a>");
      expect(html).not.toContain(">Projects</a>");
    }
    expect(leadsEmpty).toContain(">Leads</h1>");
    expect(leadsEmpty).not.toContain("Example north lead");
    expect(leadsFilled).toContain("Example north lead");
    expect(programsEmpty).toContain("No programs yet");
    expect(programsFilled).toContain("AD05 example program");
  });

  it("places the simulation banner and shell in one desktop viewport stage", () => {
    const css = source("src/dev/ad02-preview.module.css");
    const shell = source("src/components/app-shell.module.css");
    const desktopRule = css.slice(css.indexOf("@media (min-width: 960px)"));

    expect(desktopRule).toContain("height: 100vh");
    expect(desktopRule).toContain("max-height: 100vh");
    expect(desktopRule).toContain("overflow: hidden");
    expect(desktopRule).toContain("flex: 0 0 auto");
    expect(desktopRule).toContain("min-height: 0");
    expect(css.slice(0, css.indexOf("@media (min-width: 960px)"))).not.toContain("overflow: hidden");
    expect(shell).toContain("height: 100vh");
    expect(shell).toContain("max-height: 100vh");
    expect(shell).not.toContain("previewStage");

    const html = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "course-seller-long" }} />,
    );
    const stageAt = html.indexOf(previewStyles.previewStage);
    const bannerAt = html.indexOf("Local simulated QA preview for course_seller");
    expect(stageAt).toBeGreaterThanOrEqual(0);
    expect(bannerAt).toBeGreaterThan(stageAt);
    expect(html.indexOf(previewStyles.previewBanner)).toBeGreaterThan(stageAt);
  });

  it("keeps an existing preview state free of the course seller banner", () => {
    const html = renderToStaticMarkup(
      <Ad02PreviewBody searchParams={{ state: "populated", model: "service" }} />,
    );

    expect(html).not.toContain("Local simulated QA preview for course_seller");
    expect(html).not.toContain(previewStyles.previewStage);
    expect(html).toContain(">Customers</a>");
    expect(html).not.toContain(">Programs</a>");
  });
});
