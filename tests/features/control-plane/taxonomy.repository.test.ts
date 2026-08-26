import { describe, expect, it } from "vitest";
import { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";
import { createControlPlaneMemoryClient } from "./memory-query-client";

const RELEASE_ID = "tax-release-1";
const FOUNDATION_ID = "tax-foundation-knowledge";
const INDUSTRY_ID = "tax-industry-education";
const NICHE_ID = "tax-niche-ocb";
const INTERNAL_INDUSTRY_ID = "tax-industry-internal";

function catalog() {
  return createControlPlaneMemoryClient({
    taxonomy_releases: [
      {
        id: RELEASE_ID,
        key: "tax-1",
        label: "TAX-1",
        lifecycle_status: "active",
      },
    ],
    taxonomy_foundations: [
      {
        id: FOUNDATION_ID,
        key: "knowledge",
        label: "Knowledge",
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_industries: [
      {
        id: INDUSTRY_ID,
        key: "education-and-learning",
        label: "Education and Learning",
        foundation_id: FOUNDATION_ID,
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
      {
        id: INTERNAL_INDUSTRY_ID,
        key: "internal-ops",
        label: "Internal Ops",
        foundation_id: FOUNDATION_ID,
        lifecycle_status: "active",
        catalog_visibility: "internal",
      },
      {
        id: "tax-industry-draft",
        key: "draft-industry",
        label: "Draft",
        foundation_id: FOUNDATION_ID,
        lifecycle_status: "draft",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_niches: [
      {
        id: NICHE_ID,
        key: "online-course-business",
        label: "Online Course Business",
        industry_id: INDUSTRY_ID,
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_specializations: [],
    taxonomy_deep_specializations: [],
    taxonomy_aliases: [
      {
        id: "alias-1",
        alias_label: "Course Sellers",
        alias_normalized: "course sellers",
        locale: "en",
        foundation_id: null,
        industry_id: null,
        niche_id: NICHE_ID,
        specialization_id: null,
        deep_specialization_id: null,
      },
    ],
  });
}

describe("TaxonomyRepository", () => {
  const repo = new TaxonomyRepository(catalog());

  it("finds a taxonomy node by kind and id", async () => {
    const byId = await repo.getNodeById("niche", NICHE_ID);
    expect(byId).toMatchObject({
      ok: true,
      value: { key: "online-course-business", kind: "niche" },
    });
  });

  it("finds Foundation, Industry, and Niche by canonical key", async () => {
    const foundation = await repo.findFoundationByKey("knowledge");
    const industry = await repo.findIndustryByKey("education-and-learning");
    const niche = await repo.findNicheByKey("online-course-business");
    expect(foundation).toMatchObject({ ok: true, value: { key: "knowledge" } });
    expect(industry).toMatchObject({
      ok: true,
      value: { key: "education-and-learning" },
    });
    expect(niche).toMatchObject({
      ok: true,
      value: { key: "online-course-business" },
    });
  });

  it("returns NOT_FOUND for missing Specialization and Deep Specialization", async () => {
    const specialization = await repo.findSpecializationByKey("missing");
    const deep = await repo.findDeepSpecializationByKey("missing");
    expect(specialization).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(deep).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("returns the single active taxonomy release", async () => {
    const release = await repo.findActiveRelease();
    expect(release).toMatchObject({ ok: true, value: { key: "tax-1" } });
  });

  it("fails closed when there is no active release", async () => {
    const empty = new TaxonomyRepository(
      createControlPlaneMemoryClient({ taxonomy_releases: [] }),
    );
    const result = await empty.findActiveRelease();
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_INTEGRITY_ERROR" },
    });
  });

  it("fails closed when multiple active releases exist", async () => {
    const dup = new TaxonomyRepository(
      createControlPlaneMemoryClient({
        taxonomy_releases: [
          { id: "a", key: "one", label: "One", lifecycle_status: "active" },
          { id: "b", key: "two", label: "Two", lifecycle_status: "active" },
        ],
      }),
    );
    const result = await dup.findActiveRelease();
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_INTEGRITY_ERROR" },
    });
  });

  it("walks the canonical parent path without Organization inference", async () => {
    const path = await repo.getTaxonomyPath({
      kind: "niche",
      key: "online-course-business",
    });
    expect(path.ok).toBe(true);
    if (!path.ok) {
      return;
    }
    expect(path.value.foundation.key).toBe("knowledge");
    expect(path.value.industry?.key).toBe("education-and-learning");
    expect(path.value.niche?.key).toBe("online-course-business");
    expect(path.value.specialization).toBeNull();
    expect(path.value.deepSpecialization).toBeNull();
    const byId = await repo.getTaxonomyPathById({
      kind: "niche",
      id: NICHE_ID,
    });
    expect(byId).toEqual(path);
  });

  it("fails closed on a broken parent chain", async () => {
    const broken = new TaxonomyRepository(
      createControlPlaneMemoryClient({
        taxonomy_foundations: [
          {
            id: FOUNDATION_ID,
            key: "knowledge",
            label: "Knowledge",
            lifecycle_status: "active",
            catalog_visibility: "listed",
          },
        ],
        taxonomy_industries: [
          {
            id: INDUSTRY_ID,
            key: "education-and-learning",
            label: "Education",
            foundation_id: "missing-parent",
            lifecycle_status: "active",
            catalog_visibility: "listed",
          },
        ],
      }),
    );
    const result = await broken.getTaxonomyPath({
      kind: "industry",
      key: "education-and-learning",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_INTEGRITY_ERROR" },
    });
  });

  it("lists active listed children and hides internal by default", async () => {
    const listed = await repo.listActiveListedChildren({
      kind: "foundation",
      id: FOUNDATION_ID,
    });
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.value.map((node) => node.key)).toEqual(["education-and-learning"]);
    const withInternal = await repo.listActiveListedChildren(
      { kind: "foundation", id: FOUNDATION_ID },
      { includeInternal: true },
    );
    expect(withInternal.ok).toBe(true);
    if (!withInternal.ok) {
      return;
    }
    expect(withInternal.value.map((node) => node.key).sort()).toEqual([
      "education-and-learning",
      "internal-ops",
    ]);
  });

  it("resolves a unique alias candidate without converting alias text to identity", async () => {
    const result = await repo.resolveAliasCandidates("Course Sellers", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.aliasLabel).toBe("Course Sellers");
    expect(result.value.target.key).toBe("online-course-business");
  });

  it("returns AMBIGUOUS when multiple alias candidates match", async () => {
    const ambiguous = new TaxonomyRepository(
      createControlPlaneMemoryClient({
        taxonomy_niches: [
          {
            id: NICHE_ID,
            key: "online-course-business",
            label: "Online Course Business",
            industry_id: INDUSTRY_ID,
            lifecycle_status: "active",
            catalog_visibility: "listed",
          },
          {
            id: "other-niche",
            key: "other-niche",
            label: "Other",
            industry_id: INDUSTRY_ID,
            lifecycle_status: "active",
            catalog_visibility: "listed",
          },
        ],
        taxonomy_aliases: [
          {
            id: "a1",
            alias_label: "Course Sellers",
            alias_normalized: "course sellers",
            locale: "en",
            niche_id: NICHE_ID,
          },
          {
            id: "a2",
            alias_label: "Course Sellers",
            alias_normalized: "course sellers",
            locale: "en",
            niche_id: "other-niche",
          },
        ],
      }),
    );
    const result = await ambiguous.resolveAliasCandidates("Course Sellers", "en");
    expect(result).toMatchObject({ ok: false, error: { code: "AMBIGUOUS" } });
  });

  it("returns NOT_FOUND when no alias candidates exist", async () => {
    const result = await repo.resolveAliasCandidates("unknown", "en");
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("does not invent a first-row fallback for missing keys", async () => {
    const result = await repo.findNicheByKey("electrician");
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
