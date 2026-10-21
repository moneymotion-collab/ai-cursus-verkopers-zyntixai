import { NextResponse, type NextRequest } from "next/server";
import { DUTCH_PUBLIC_PATHNAMES } from "@/lib/i18n/dutch-public-paths";

export const DOCUMENT_LANGUAGE_HEADER = "x-document-language";

export const DOCUMENT_LANGUAGES = ["en", "nl"] as const;

export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number];

export const FALLBACK_DOCUMENT_LANGUAGE: DocumentLanguage = "en";

function normalizePathname(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] ?? "/";
  const trimmed = withoutQueryOrHash.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

const DUTCH_PUBLIC_PATHNAME_SET = new Set<string>(DUTCH_PUBLIC_PATHNAMES);

/**
 * Route-scoped document language.
 * Dutch is limited to the public information pages.
 * Login, registration, onboarding, and authenticated product routes stay English.
 * Query, cookies, Accept-Language, and client headers must not control this value.
 */
export function resolveDocumentLanguageFromPathname(
  pathname: string,
): DocumentLanguage {
  return DUTCH_PUBLIC_PATHNAME_SET.has(normalizePathname(pathname)) ? "nl" : "en";
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
