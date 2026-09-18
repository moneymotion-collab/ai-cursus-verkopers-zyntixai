import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  DOCUMENT_LANGUAGE_HEADER,
  applyTrustedDocumentLanguageHeaders,
  nextWithTrustedDocumentLanguage,
  parseDocumentLanguage,
  resolveDocumentLanguageFromPathname,
} from "@/lib/i18n/document-language";

describe("resolveDocumentLanguageFromPathname", () => {
  it("assigns Dutch only to the public homepage path", () => {
    expect(resolveDocumentLanguageFromPathname("/")).toBe("nl");
    expect(resolveDocumentLanguageFromPathname("")).toBe("nl");
    expect(resolveDocumentLanguageFromPathname("/?ref=nav")).toBe("nl");
  });

  it("normalizes a trailing slash on the homepage without treating other routes as Dutch", () => {
    expect(resolveDocumentLanguageFromPathname("///")).toBe("nl");
    expect(resolveDocumentLanguageFromPathname("/login/")).toBe("en");
    expect(resolveDocumentLanguageFromPathname("/home/")).toBe("en");
  });

  it("keeps English for login, product, onboarding, invitation, and recovery HTML", () => {
    for (const pathname of [
      "/login",
      "/login?next=/home",
      "/home",
      "/onboarding",
      "/onboarding/operating-model",
      "/invite/accept",
      "/register",
      "/register/check-email",
      "/forgot-password",
      "/reset-password",
      "/settings/members",
    ]) {
      expect(resolveDocumentLanguageFromPathname(pathname)).toBe("en");
    }
  });

  it("ignores query strings when resolving language", () => {
    expect(resolveDocumentLanguageFromPathname("/")).toBe("nl");
    expect(resolveDocumentLanguageFromPathname("/login")).toBe("en");
  });
});

describe("parseDocumentLanguage", () => {
  it("allowlists only en and nl", () => {
    expect(parseDocumentLanguage("en")).toBe("en");
    expect(parseDocumentLanguage("nl")).toBe("nl");
    expect(parseDocumentLanguage("fr")).toBe("en");
    expect(parseDocumentLanguage("zh-CN")).toBe("en");
    expect(parseDocumentLanguage("NL")).toBe("en");
    expect(parseDocumentLanguage("en-US")).toBe("en");
    expect(parseDocumentLanguage(null)).toBe("en");
    expect(parseDocumentLanguage(undefined)).toBe("en");
    expect(parseDocumentLanguage("")).toBe("en");
  });
});

describe("applyTrustedDocumentLanguageHeaders", () => {
  it("overwrites a client-supplied internal language header from the pathname", () => {
    const incoming = new Headers();
    incoming.set(DOCUMENT_LANGUAGE_HEADER, "fr");
    incoming.set("accept-language", "nl");

    const homepage = applyTrustedDocumentLanguageHeaders(incoming, "/");
    expect(homepage.get(DOCUMENT_LANGUAGE_HEADER)).toBe("nl");
    expect(homepage.get("accept-language")).toBe("nl");

    const login = applyTrustedDocumentLanguageHeaders(incoming, "/login");
    expect(login.get(DOCUMENT_LANGUAGE_HEADER)).toBe("en");
  });

  it("cannot be forced to an arbitrary tag by spoofing the homepage as English", () => {
    const incoming = new Headers();
    incoming.set(DOCUMENT_LANGUAGE_HEADER, "en");
    const headers = applyTrustedDocumentLanguageHeaders(incoming, "/");
    expect(headers.get(DOCUMENT_LANGUAGE_HEADER)).toBe("nl");
  });
});

describe("nextWithTrustedDocumentLanguage", () => {
  function forwardedLanguage(request: NextRequest): string | null {
    const response = nextWithTrustedDocumentLanguage(request);
    return (
      response.headers.get(`x-middleware-request-${DOCUMENT_LANGUAGE_HEADER}`) ??
      response.headers.get(DOCUMENT_LANGUAGE_HEADER)
    );
  }

  it("forwards Dutch for public / and English for /login after overwriting spoofed values", () => {
    const home = new NextRequest("http://localhost:3000/?utm=1", {
      headers: { [DOCUMENT_LANGUAGE_HEADER]: "en" },
    });
    expect(forwardedLanguage(home)).toBe("nl");

    const login = new NextRequest("http://localhost:3000/login?next=/", {
      headers: { [DOCUMENT_LANGUAGE_HEADER]: "nl" },
    });
    expect(forwardedLanguage(login)).toBe("en");
  });
});
