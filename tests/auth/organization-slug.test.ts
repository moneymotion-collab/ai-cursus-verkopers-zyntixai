import { describe, expect, it } from "vitest";
import {
  buildOrganizationSlugCandidate,
  isReservedSlug,
  withSlugCollisionSuffix,
} from "@/features/auth/server/organization-slug";

describe("organization slug helpers", () => {
  it("canonicalizes company names into slugs", () => {
    expect(buildOrganizationSlugCandidate("  Analytical Engines! ")).toBe(
      "analytical-engines",
    );
  });

  it("falls back for non-latin transliteration empties", () => {
    expect(buildOrganizationSlugCandidate("東京株式会社")).toBe("org");
  });

  it("prefixes reserved slugs", () => {
    expect(buildOrganizationSlugCandidate("admin")).toBe("org-admin");
    expect(isReservedSlug("login")).toBe(true);
  });

  it("appends collision suffixes within max length", () => {
    const suffixed = withSlugCollisionSuffix("acme", 1);
    expect(suffixed.startsWith("acme-")).toBe(true);
    expect(suffixed.length).toBeLessThanOrEqual(48);
  });
});
