import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { isProtectedApplicationPath } from "@/features/auth/server/safe-return-path";
import {
  PUBLIC_ACCESS_ANSWER,
  PUBLIC_ACCESS_QUESTION,
  PUBLIC_BETA_EXISTING,
  PUBLIC_BETA_NOW,
  PUBLIC_H1,
  PUBLIC_PRIVACY_EMAIL,
  PUBLIC_PRIVACY_H1,
  PUBLIC_PRIVACY_VERSION,
  PUBLIC_INSTAGRAM_BUTTON,
  PUBLIC_INSTAGRAM_FOOTER,
  PUBLIC_INSTAGRAM_LIMIT,
  PUBLIC_INSTAGRAM_PROMPT,
  PUBLIC_INSTAGRAM_URL,
  PUBLIC_NAV,
  PUBLIC_OFFER,
  PUBLIC_FREE_ANSWER,
  PUBLIC_FREE_QUESTION,
  PUBLIC_PREVIEW_CAPTION,
  PUBLIC_PREVIEW_ORG,
  PUBLIC_SKIP,
  PUBLIC_WORDMARK,
} from "@/features/public-web/copy";
import { PUBLIC_INFORMATION_PATHS } from "@/features/public-web/paths";
import { PublicHomepage } from "@/features/public-web/ui/public-homepage";
import {
  PublicAboutPage,
  PublicAudiencesPage,
  PublicHowPage,
  PublicNotFound,
  PublicPlatformPage,
  PublicPrivacyPage,
} from "@/features/public-web/ui/public-pages";

const FUTURE_LANGUAGE = [
  "binnenkort",
  "wordt ontwikkeld",
  "in voorbereiding",
  "beoogde werkwijze",
  "roadmap",
  "je hele bedrijf",
  "alles in één",
  "alles in een",
  "wachtlijst",
  "proefperiode",
  "gratis proef",
  "voor altijd",
  "onbeperkt",
  "upgrade",
  "testimonial",
  "Business Operating System",
];

function readSrc(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function pages() {
  return [
    ["/", renderToStaticMarkup(<PublicHomepage />)],
    ["/platform", renderToStaticMarkup(<PublicPlatformPage />)],
    ["/voor-wie", renderToStaticMarkup(<PublicAudiencesPage />)],
    ["/zo-werkt-het", renderToStaticMarkup(<PublicHowPage />)],
    ["/over", renderToStaticMarkup(<PublicAboutPage />)],
    ["/privacy", renderToStaticMarkup(<PublicPrivacyPage />)],
    ["/404", renderToStaticMarkup(<PublicNotFound />)],
  ] as const;
}

describe("public website", () => {
  it("renders the homepage landmarks, current description, and sign-in", () => {
    const markup = renderToStaticMarkup(<PublicHomepage />);
    expect(markup.match(/<h1\b/g)?.length).toBe(1);
    expect(markup).toContain(PUBLIC_H1);
    expect(markup).toContain(PUBLIC_BETA_NOW);
    expect(markup).toContain(PUBLIC_BETA_EXISTING);
    expect(markup).toContain(PUBLIC_PREVIEW_CAPTION);
    expect(markup).toContain(PUBLIC_PREVIEW_ORG);
    expect(markup).toContain(PUBLIC_OFFER);
    expect(markup).toContain(PUBLIC_FREE_QUESTION);
    expect(markup).toContain(PUBLIC_FREE_ANSWER);
    expect(markup).toContain(PUBLIC_ACCESS_QUESTION);
    expect(markup).toContain(PUBLIC_ACCESS_ANSWER);
    expect(markup).toContain(PUBLIC_INSTAGRAM_BUTTON);
    expect(markup).toContain(PUBLIC_INSTAGRAM_PROMPT);
    expect(markup).toContain(PUBLIC_INSTAGRAM_LIMIT);
    expect(markup).toContain(PUBLIC_WORDMARK);
    expect(markup).toContain(PUBLIC_SKIP);
    expect(markup).toContain('lang="nl"');
    expect(markup).toContain("<header");
    expect(markup).toContain("<main");
    expect(markup).toContain("<footer");
    expect(markup).toContain("<details");
    expect(markup).toContain('href="/login"');
    expect(markup).not.toContain('href="/register"');
    expect(markup).not.toContain('href="/home"');
    expect(markup).not.toContain('href="#"');
    for (const item of PUBLIC_NAV) {
      expect(markup).toContain(`href="${item.href}"`);
    }
  });

  it("keeps public pages free of future promises and acquisition forms", () => {
    const markup = pages()
      .map(([, html]) => html)
      .join("\n")
      .toLowerCase();
    for (const phrase of FUTURE_LANGUAGE) {
      expect(markup).not.toContain(phrase.toLowerCase());
    }
    expect(markup).not.toMatch(/<form\b/);
    expect(markup).not.toMatch(/<script\b/);
    expect(markup).not.toMatch(/wachtlijst|stripe|gps/i);
    expect(markup).not.toMatch(/instagram\.com\/(?!zyntixai\/)/);
    expect(markup).not.toMatch(/embed|sdk|pixel/i);
  });

  it("links every public page to the same Instagram profile", () => {
    for (const [, html] of pages()) {
      const hrefs = html.match(/href="https:\/\/www\.instagram\.com\/[^"]*"/g) ?? [];
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href).toBe(`href="${PUBLIC_INSTAGRAM_URL}"`);
      }
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain(PUBLIC_INSTAGRAM_FOOTER);
      expect(html).toContain('href="/login"');
      expect(html).not.toContain('href="/register"');
    }
    const home = renderToStaticMarkup(<PublicHomepage />);
    const how = renderToStaticMarkup(<PublicHowPage />);
    const platform = renderToStaticMarkup(<PublicPlatformPage />);
    expect(home.match(new RegExp(PUBLIC_INSTAGRAM_BUTTON, "g"))?.length).toBe(2);
    expect(how.match(new RegExp(PUBLIC_INSTAGRAM_BUTTON, "g"))?.length).toBe(1);
    expect(platform).not.toContain(PUBLIC_INSTAGRAM_BUTTON);
    const privacy = renderToStaticMarkup(<PublicPrivacyPage />);
    expect(privacy).toContain(PUBLIC_PRIVACY_H1);
    expect(privacy).toContain("Guus Vermolen");
    expect(privacy).toContain(PUBLIC_PRIVACY_EMAIL);
    expect(privacy).toContain(PUBLIC_PRIVACY_VERSION);
    expect(privacy).toContain('href="mailto:testplatform617@gmail.com"');
    expect(privacy).toContain('href="/privacy"');
    expect(privacy).not.toContain("KvK");
  });

  it("leaves authenticated routes protected and public routes open", () => {
    for (const pathname of PUBLIC_INFORMATION_PATHS) {
      expect(isProtectedApplicationPath(pathname)).toBe(false);
    }
    expect(isProtectedApplicationPath("/home")).toBe(true);
    expect(isProtectedApplicationPath("/customers")).toBe(true);
    expect(isProtectedApplicationPath("/login")).toBe(false);
  });

  it("keeps the public stylesheet isolated from the authenticated product", () => {
    const publicCss = readSrc("src/features/public-web/ui/public-homepage.module.css");
    const globals = readSrc("src/app/globals.css");
    const appShellCss = readSrc("src/components/app-shell.module.css");
    const loginCss = readSrc("src/app/login/page.module.css");
    const homeCss = readSrc("src/app/(authenticated)/home/page.module.css");
    const layout = readSrc("src/app/layout.tsx");
    const rootPage = readSrc("src/app/page.tsx");
    const packageJson = readSrc("package.json");

    expect(publicCss).toContain("#090611");
    expect(publicCss).toContain("#c8adff");
    expect(publicCss).toContain("#23113f");
    expect(publicCss).not.toMatch(/(^|\n):root\s*\{/);
    expect(publicCss).not.toContain("overflow-x: hidden");
    expect(publicCss).not.toContain("overflow-x: clip");
    expect(publicCss).toContain("prefers-reduced-motion");
    expect(publicCss).toContain("forced-colors");
    expect(publicCss).toContain("outline-offset: 3px");
    expect(globals).not.toContain("#090611");
    expect(globals).not.toContain("#c8adff");
    expect(appShellCss).not.toContain("#090611");
    expect(loginCss).not.toContain("#090611");
    expect(homeCss).not.toContain("#090611");
    expect(layout).toContain("parseDocumentLanguage");
    expect(packageJson).not.toContain("framer-motion");
    expect(rootPage).toContain("PublicHomepage");
    expect(rootPage).toContain("resolveAuthenticatedEntryPath");
    expect(rootPage).not.toMatch(/redirect\(\s*["']\/login["']/);
  });
});
