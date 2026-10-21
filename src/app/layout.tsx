import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  DOCUMENT_LANGUAGE_HEADER,
  parseDocumentLanguage,
} from "@/lib/i18n/document-language";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZyntixAI",
  description: "ZyntixAI application foundation",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const lang = parseDocumentLanguage(headerList.get(DOCUMENT_LANGUAGE_HEADER));

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
