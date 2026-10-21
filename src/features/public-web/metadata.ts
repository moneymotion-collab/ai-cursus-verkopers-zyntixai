import type { Metadata } from "next";
import { publicCanonicalUrl } from "@/features/public-web/paths";

export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = publicCanonicalUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "ZyntixAI",
      locale: "nl_NL",
      type: "website",
    },
  };
}
