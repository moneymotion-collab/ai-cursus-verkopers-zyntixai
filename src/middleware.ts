import { NextResponse, type NextRequest } from "next/server";
import { resolveAd02PreviewAccess } from "@/dev/ad02-preview-access";
import { nextWithTrustedDocumentLanguage } from "@/lib/i18n/document-language";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/ad02-preview") {
    const access = resolveAd02PreviewAccess({
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      state: request.nextUrl.searchParams.getAll("state"),
    });
    if (access === "not-found") {
      return new NextResponse(null, { status: 404 });
    }
    if (process.env.VERCEL_ENV === "preview") {
      return nextWithTrustedDocumentLanguage(request);
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
