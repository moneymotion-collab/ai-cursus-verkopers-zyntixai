import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHomepage } from "@/features/public-web/ui/public-homepage";
import {
  PUBLIC_ACCESS_H2,
  PUBLIC_ACCESS_STATUS,
  PUBLIC_ACCESS_UTILITY,
  PUBLIC_BETA_EXISTING,
  PUBLIC_BETA_NOW,
  PUBLIC_CS_BODY,
  PUBLIC_CS_H2,
  PUBLIC_CS_QUALIFIER,
  PUBLIC_H1,
  PUBLIC_HONEST_STOP,
  PUBLIC_MECHANISM_BODY,
  PUBLIC_MECHANISM_H2,
  PUBLIC_NAV_BETA,
  PUBLIC_NAV_DISCLOSURE,
  PUBLIC_NAV_MECHANISM,
  PUBLIC_NAV_OVER,
  PUBLIC_NAV_SIGN_IN,
  PUBLIC_SECTION_IDS,
  PUBLIC_SKIP,
  PUBLIC_SUPPORT,
  PUBLIC_TODAY_BODY,
  PUBLIC_TODAY_H2,
  PUBLIC_TODAY_QUALIFIER,
  PUBLIC_TRUST_BODY,
  PUBLIC_TRUST_H2,
  PUBLIC_VALUE_BODY,
  PUBLIC_VALUE_H2,
  PUBLIC_WORDMARK,
} from "@/features/public-web/copy";

function html() {
  return renderToStaticMarkup(<PublicHomepage />);
}

function readSrc(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("public homepage frozen copy and semantics", () => {
  it("renders one H1 and the exact Route A2 board", () => {
    const markup = html();
    expect(markup.match(/<h1\b/g)?.length).toBe(1);
    expect(markup.match(/<h2\b/g)?.length).toBe(6);
    expect(markup).not.toMatch(/<h3\b/);
    expect(markup).toContain(PUBLIC_H1);
    expect(markup).toContain(PUBLIC_SUPPORT);
    expect(markup).toContain(PUBLIC_BETA_NOW);
    expect(markup).toContain(PUBLIC_BETA_EXISTING);
    expect(markup).toContain(PUBLIC_VALUE_H2);
    expect(markup).toContain(PUBLIC_VALUE_BODY);
    expect(markup).toContain(PUBLIC_MECHANISM_H2);
    expect(markup).toContain(PUBLIC_MECHANISM_BODY);
    expect(markup).toContain(PUBLIC_TODAY_H2);
    expect(markup).toContain(PUBLIC_TODAY_BODY);
    expect(markup).toContain(PUBLIC_TODAY_QUALIFIER);
    expect(markup).toContain(PUBLIC_CS_H2);
    expect(markup).toContain(PUBLIC_CS_BODY);
    expect(markup).toContain(PUBLIC_CS_QUALIFIER);
    expect(markup).toContain("programma\u2019s");
    expect(markup).toContain(PUBLIC_TRUST_H2);
    expect(markup).toContain(PUBLIC_TRUST_BODY);
    expect(markup).toContain(PUBLIC_ACCESS_H2);
    expect(markup).toContain(PUBLIC_ACCESS_STATUS);
    expect(markup).toContain("Heb je al een account? ");
    expect(markup).toContain(`>${PUBLIC_NAV_SIGN_IN}<`);
    expect(markup).toContain(PUBLIC_HONEST_STOP);
    expect(markup).toContain(PUBLIC_WORDMARK);
    expect(markup).toContain(PUBLIC_SKIP);
    expect(markup).toContain(PUBLIC_NAV_DISCLOSURE);
    expect(markup).toContain(PUBLIC_NAV_OVER);
    expect(markup).toContain(PUBLIC_NAV_MECHANISM);
    expect(markup).toContain(PUBLIC_NAV_BETA);
    expect(markup).toContain(PUBLIC_NAV_SIGN_IN);
  });

  it("locks diacritics and the curly apostrophe", () => {
    expect(PUBLIC_CS_BODY).toContain("\u2019");
    expect(PUBLIC_CS_BODY).not.toContain("programma's");
    expect(PUBLIC_NAV_BETA).toContain("\u00e8");
    expect(PUBLIC_BETA_NOW).toContain("\u00e8");
    expect(PUBLIC_ACCESS_STATUS).toContain("\u00e8");
    expect(PUBLIC_ACCESS_UTILITY).toBe("Heb je al een account? Inloggen.");
  });

  it("uses Dutch public language scope and real destinations", () => {
    const markup = html();
    expect(markup).toContain('lang="nl"');
    expect(markup).toContain(`id="${PUBLIC_SECTION_IDS.main}"`);
    expect(markup).toContain(`href="#${PUBLIC_SECTION_IDS.main}"`);
    expect(markup).toContain(`href="#${PUBLIC_SECTION_IDS.over}"`);
    expect(markup).toContain(`href="#${PUBLIC_SECTION_IDS.mechanism}"`);
    expect(markup).toContain(`href="#${PUBLIC_SECTION_IDS.beta}"`);
    expect(markup).toContain(`href="/login"`);
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('href="#"');
    expect(markup).not.toContain('href=""');
    expect(markup).not.toContain('href="/home"');
    expect(markup).not.toContain('href="/register"');
  });

  it("keeps unique ids, landmarks, and a coherent heading order", () => {
    const markup = html();
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(markup).toMatch(/<header\b/);
    expect(markup).toMatch(/<nav\b/);
    expect(markup).toMatch(/<main\b/);
    expect(markup).toMatch(/<footer\b/);
    expect(markup.indexOf("<header")).toBeLessThan(markup.indexOf("<main"));
    expect(markup.indexOf("<main")).toBeLessThan(markup.indexOf("<footer"));
    expect(markup.indexOf(`>${PUBLIC_H1}</h1>`)).toBeLessThan(
      markup.indexOf(`>${PUBLIC_VALUE_H2}</h2>`),
    );
    expect(markup.indexOf(`>${PUBLIC_VALUE_H2}</h2>`)).toBeLessThan(
      markup.indexOf(`>${PUBLIC_MECHANISM_H2}</h2>`),
    );
    expect(markup.indexOf(PUBLIC_BETA_NOW)).toBeLessThan(
      markup.indexOf(`>${PUBLIC_VALUE_H2}</h2>`),
    );
  });

  it("keeps BOS and AI copy inactive and omits acquisition CTAs", () => {
    const markup = html();
    expect(markup).not.toMatch(/Business Operating System/i);
    expect(markup).not.toContain("ZyntixAI is geen chatbot");
    expect(markup).not.toMatch(/wachtlijst|waitlist/i);
    expect(markup).not.toMatch(/\baanmelden\b|sign up|register now/i);
    expect(markup).not.toMatch(/gratis proberen|free trial|request access/i);
    expect(markup).not.toMatch(/Stripe|checkout/i);
    expect(markup).not.toMatch(/<button\b/i);
  });

  it("exposes a non-modal Navigatie disclosure", () => {
    const markup = html();
    expect(markup).toContain("<details");
    expect(markup).toContain("<summary");
    expect(markup).toContain(`>${PUBLIC_NAV_DISCLOSURE}<`);
    expect(markup).not.toMatch(/role="dialog"/);
    expect(markup).not.toMatch(/aria-modal/);
  });
});

describe("public homepage isolation source lock", () => {
  it("keeps public tokens out of global :root and does not restyle AppShell", () => {
    const publicCss = readSrc("src/features/public-web/ui/public-homepage.module.css");
    const globals = readSrc("src/app/globals.css");
    const layout = readSrc("src/app/layout.tsx");
    const middleware = readSrc("src/middleware.ts");
    const appShell = readSrc("src/components/app-shell.tsx");
    const appShellCss = readSrc("src/components/app-shell.module.css");
    const loginCss = readSrc("src/app/login/page.module.css");
    const homeCss = readSrc("src/app/(authenticated)/home/page.module.css");
    const packageJson = readSrc("package.json");
    const rootPage = readSrc("src/app/page.tsx");

    expect(publicCss).not.toMatch(/(^|\n):root\s*\{/);
    expect(globals).not.toContain("#F4F1EA");
    expect(globals).not.toContain("#1F5C57");
    expect(globals).toContain("--link-color: #1d4ed8");
    expect(layout).toContain('lang="en"');
    expect(layout).not.toContain('lang="nl"');
    expect(middleware).not.toContain("PublicHomepage");
    expect(appShell).toContain("Skip to main content");
    expect(appShell).not.toContain("Ga naar de hoofdinhoud");
    expect(appShellCss).not.toContain("#F4F1EA");
    expect(loginCss).not.toContain("#F4F1EA");
    expect(homeCss).not.toContain("#F4F1EA");
    expect(packageJson).not.toContain("framer-motion");
    expect(rootPage).toContain("PublicHomepage");
    expect(rootPage).toContain("resolveAuthenticatedEntryPath");
    expect(rootPage).toContain("readInvitationCookiesFromStore");
    expect(rootPage).toContain('export const dynamic = "force-dynamic"');
    expect(rootPage).not.toMatch(/redirect\(\s*["']\/login["']/);
  });

  it("uses frozen hex values and isolation contracts in the public stylesheet", () => {
    const publicCss = readSrc("src/features/public-web/ui/public-homepage.module.css");
    expect(publicCss).toContain("#F4F1EA");
    expect(publicCss).toContain("#1A1916");
    expect(publicCss).toContain("#1F5C57");
    expect(publicCss).toContain("box-shadow: none");
    expect(publicCss).toContain("outline-offset: 2px");
    expect(publicCss).toContain(".navDisclosure:not([open]) .disclosurePanel");
    expect(publicCss).toContain("forced-colors");
    expect(publicCss).toContain(".today {");
    expect(publicCss).toContain("border: 1px solid CanvasText");
    expect(publicCss).not.toContain("overflow-x: clip");
    expect(publicCss).not.toContain("overflow-x: hidden");
    expect(publicCss).toContain("prefers-reduced-motion");
    expect(publicCss).toContain("max-width: 45rem");
    expect(publicCss).toContain("max-width: 40rem");
    expect(publicCss).toContain("--public-space-8: 2.5rem");
    expect(publicCss).toContain("--public-wide: 64rem");
    expect(publicCss).toContain("--public-reading: 40rem");
  });

  it("keeps hash-focus as a heading-aware progressive enhancement", () => {
    const hashFocus = readSrc("src/features/public-web/ui/public-hash-focus.tsx");
    expect(hashFocus).toContain('"use client"');
    expect(hashFocus).toContain("hashchange");
    expect(hashFocus).toContain("preventScroll: true");
    expect(hashFocus).toContain("PUBLIC_SECTION_IDS.main");
    expect(hashFocus).toContain("querySelector");
    expect(hashFocus).toContain("removeEventListener");
    expect(hashFocus).not.toContain("scrollIntoView");
    expect(hashFocus).not.toContain("smooth");
  });
});
