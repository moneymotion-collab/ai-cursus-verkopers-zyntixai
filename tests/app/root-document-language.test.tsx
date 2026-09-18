import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const headerGetMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: headerGetMock,
  }),
}));

import RootLayout from "@/app/layout";
import {
  DOCUMENT_LANGUAGE_HEADER,
  parseDocumentLanguage,
} from "@/lib/i18n/document-language";

describe("root document language layout", () => {
  beforeEach(() => {
    headerGetMock.mockReset();
  });

  it("renders html lang from the trusted allowlisted header for the public homepage", async () => {
    headerGetMock.mockImplementation((name: string) =>
      name === DOCUMENT_LANGUAGE_HEADER ? "nl" : null,
    );
    const markup = renderToStaticMarkup(
      await RootLayout({ children: <main>public</main> }),
    );
    expect(markup.startsWith('<html lang="nl">')).toBe(true);
    expect(markup).toContain("<main>public</main>");
    expect(headerGetMock).toHaveBeenCalledWith(DOCUMENT_LANGUAGE_HEADER);
  });

  it("renders html lang=en for login and other English surfaces", async () => {
    headerGetMock.mockImplementation((name: string) =>
      name === DOCUMENT_LANGUAGE_HEADER ? "en" : null,
    );
    const markup = renderToStaticMarkup(
      await RootLayout({ children: <h1>Sign in</h1> }),
    );
    expect(markup.startsWith('<html lang="en">')).toBe(true);
    expect(markup).toContain("<h1>Sign in</h1>");
  });

  it("falls back to English when the internal header is missing or invalid", async () => {
    headerGetMock.mockReturnValue("fr");
    const invalid = renderToStaticMarkup(
      await RootLayout({ children: <p>fallback</p> }),
    );
    expect(invalid.startsWith('<html lang="en">')).toBe(true);

    headerGetMock.mockReturnValue(null);
    const missing = renderToStaticMarkup(
      await RootLayout({ children: <p>fallback</p> }),
    );
    expect(missing.startsWith('<html lang="en">')).toBe(true);
    expect(parseDocumentLanguage("not-a-tag")).toBe("en");
  });
});
