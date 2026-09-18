import { NextResponse, type NextRequest } from "next/server";

export const DOCUMENT_LANGUAGE_HEADER = "x-document-language";

export const DOCUMENT_LANGUAGES = ["en", "nl"] as const;

export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number];

export const FALLBACK_DOCUMENT_LANGUAGE: DocumentLanguage = "en";

function normalizePathname(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] ?? "/";
  const trimmed = withoutQueryOrHash.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * Route-scoped document language (PW-8 Model A).
 * Logged-out `/` is the only predominantly Dutch HTML page.
 * Authenticated `/` is redirect-only and does not emit this document.
 * Query, cookies, Accept-Language, and client headers must not control this value.
 */
export function resolveDocumentLanguageFromPathname(
  pathname: string,
): DocumentLanguage {
  return normalizePathname(pathname) === "/" ? "nl" : "en";
}

export function parseDocumentLanguage(
  value: string | null | undefined,
): DocumentLanguage {
  if (value === "en" || value === "nl") {
    return value;
  }

  return FALLBACK_DOCUMENT_LANGUAGE;
}

export function applyTrustedDocumentLanguageHeaders(
  requestHeaders: Headers,
  pathname: string,
): Headers {
  const headers = new Headers(requestHeaders);
  headers.delete(DOCUMENT_LANGUAGE_HEADER);
  headers.set(
    DOCUMENT_LANGUAGE_HEADER,
    resolveDocumentLanguageFromPathname(pathname),
  );
  return headers;
}

export function nextWithTrustedDocumentLanguage(
  request: NextRequest,
): NextResponse {
  return NextResponse.next({
    request: {
      headers: applyTrustedDocumentLanguageHeaders(
        request.headers,
        request.nextUrl.pathname,
      ),
    },
  });
}
