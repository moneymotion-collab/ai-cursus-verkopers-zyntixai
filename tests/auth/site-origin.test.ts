import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  resolveSiteOrigin,
} from "@/lib/env/site-origin";

describe("resolveSiteOrigin", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and strips trailing slash", () => {
    expect(
      resolveSiteOrigin({
        NEXT_PUBLIC_SITE_URL: "https://app.example.com/",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://app.example.com");
  });

  it("falls back to https VERCEL_URL when site URL is absent", () => {
    expect(
      resolveSiteOrigin({
        VERCEL_URL: "my-app.vercel.app",
      }),
    ).toBe("https://my-app.vercel.app");
  });

  it("uses local default when no env values are present", () => {
    expect(resolveSiteOrigin({})).toBe("http://127.0.0.1:3000");
  });
});

describe("buildAuthCallbackUrl", () => {
  it("builds callback and recovery destinations", () => {
    expect(buildAuthCallbackUrl("https://app.example.com")).toBe(
      "https://app.example.com/auth/callback",
    );
    expect(buildAuthCallbackUrl("https://app.example.com", "/reset-password")).toBe(
      "https://app.example.com/auth/callback?next=%2Freset-password",
    );
  });
});
