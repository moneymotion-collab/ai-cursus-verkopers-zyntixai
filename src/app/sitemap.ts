import type { MetadataRoute } from "next";
import { PUBLIC_INFORMATION_PATHS, publicCanonicalUrl } from "@/features/public-web/paths";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_INFORMATION_PATHS.map((path) => ({
    url: publicCanonicalUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));
}
