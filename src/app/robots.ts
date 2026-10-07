import type { MetadataRoute } from "next";
import { PUBLIC_INFORMATION_PATHS, PUBLIC_SITE_ORIGIN } from "@/features/public-web/paths";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...PUBLIC_INFORMATION_PATHS],
      disallow: [
        "/home",
        "/login",
        "/register",
        "/onboarding",
        "/invite",
        "/forgot-password",
        "/reset-password",
        "/auth",
        "/api",
        "/customers",
        "/leads",
        "/tasks",
        "/programs",
        "/enrollments",
        "/progress",
        "/attention",
        "/projects",
        "/sites",
        "/work-orders",
        "/dispatch",
        "/products",
        "/orders",
        "/inventory",
        "/fulfillment",
        "/settings",
        "/social",
        "/operator",
      ],
    },
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
    host: PUBLIC_SITE_ORIGIN,
  };
}
