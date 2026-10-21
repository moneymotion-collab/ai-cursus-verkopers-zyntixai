import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824153310_seed_taxonomy_registry_tax1.sql",
  ),
  "utf8",
);

const FOUNDATION_KEYS = [
  "knowledge",
  "service",
  "field-operations",
  "product-operations",
] as const;

const INDUSTRY_PARENTS: Array<[string, string]> = [
  ["education-and-learning", "knowledge"],
  ["coaching-and-mentoring", "knowledge"],
  ["communities-and-memberships", "knowledge"],
  ["marketing-creative-and-media-services", "service"],
  ["consulting-and-advisory", "service"],
  ["technology-and-it-services", "service"],
  ["recruitment-hr-and-talent-services", "service"],
  ["finance-legal-and-administrative-services", "service"],
  ["business-support-and-outsourcing", "service"],
  ["property-and-real-estate-services", "service"],
  ["construction-and-installation", "field-operations"],
  ["property-and-facility-services", "field-operations"],
  ["cleaning-and-hygiene-services", "field-operations"],
  ["landscaping-and-outdoor-services", "field-operations"],
  ["technical-maintenance-and-repair", "field-operations"],
  ["security-safety-and-inspection-services", "field-operations"],
  ["ecommerce-and-online-retail", "product-operations"],
  ["brands-and-consumer-products", "product-operations"],
  ["retail-and-omnichannel", "product-operations"],
  ["wholesale-and-distribution", "product-operations"],
  ["warehousing-and-fulfillment", "product-operations"],
  ["manufacturing-and-production", "product-operations"],
];

describe("TAX-1B taxonomy registry seed contract", () => {
  it("seeds exactly one active release ucf-tax-1 without hardcoded UUIDs", () => {
    expect(seedMigration).toContain("('ucf-tax-1', 'UCF Taxonomy v1', 'active')");
    expect(seedMigration).toContain("on conflict (key) do nothing");
    expect(seedMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
    expect(seedMigration).not.toContain("gen_random_uuid()");
  });

  it("seeds exactly the four frozen Foundations as listed/active under ucf-tax-1", () => {
    expect(seedMigration).toContain("('knowledge', 'Knowledge')");
    expect(seedMigration).toContain("('service', 'Service')");
    expect(seedMigration).toContain("('field-operations', 'Field Operations')");
    expect(seedMigration).toContain(
      "('product-operations', 'Product Operations')",
    );
    expect(seedMigration).toContain("n_foundations <> 4");
    expect(seedMigration).not.toMatch(/\('manufacturing-operations'/);
    for (const key of FOUNDATION_KEYS) {
      expect(seedMigration).toContain(`('${key}'`);
    }
  });

  it("seeds exactly 22 Industries with frozen keys and Foundation parents", () => {
    expect(INDUSTRY_PARENTS).toHaveLength(22);
    for (const [industryKey, foundationKey] of INDUSTRY_PARENTS) {
      expect(seedMigration).toContain(`('${industryKey}',`);
      expect(seedMigration).toContain(
        `('${industryKey}', '${foundationKey}')`,
      );
    }
    expect(seedMigration).toContain("n_industries <> 22");
    expect(seedMigration).toContain(
      "manufacturing-and-production must remain under product-operations",
    );
  });

  it("seeds exactly one reference Niche under education-and-learning", () => {
    expect(seedMigration).toContain("'online-course-business'");
    expect(seedMigration).toContain("'Online Course Business'");
    expect(seedMigration).toContain("i.key = 'education-and-learning'");
    expect(seedMigration).toContain("n_niches <> 1");
    expect(seedMigration).not.toContain("insert into public.taxonomy_specializations");
    expect(seedMigration).not.toContain(
      "insert into public.taxonomy_deep_specializations",
    );
    expect(seedMigration).toContain("n_specializations <> 0");
    expect(seedMigration).toContain("n_deep <> 0");
  });

  it("seeds exactly two English aliases onto online-course-business", () => {
    expect(seedMigration).toContain("('Course Seller')");
    expect(seedMigration).toContain("('Course Sellers')");
    expect(seedMigration).toContain("a.alias_normalized = 'course seller'");
    expect(seedMigration).toContain("a.alias_normalized = 'course sellers'");
    expect(seedMigration).toContain("and a.locale = 'en'");
    expect(seedMigration).toContain("n.key = 'online-course-business'");
    expect(seedMigration).toContain("n_aliases <> 2");
  });

  it("does not assign Organizations or rewrite onboarding enums", () => {
    expect(seedMigration).not.toMatch(/\borganization_id\b/);
    expect(seedMigration).not.toMatch(/alter table public\.organizations/i);
    expect(seedMigration).not.toContain("business_type");
    expect(seedMigration).not.toContain("course_seller");
    expect(seedMigration).not.toContain("insert into public.organizations");
    expect(seedMigration).not.toContain("electrician");
    expect(seedMigration).not.toContain("ev-charging");
  });

  it("fails closed when parent lookup or counts are incomplete", () => {
    expect(seedMigration).toContain("raise exception 'TAX-1 seed:");
    expect(seedMigration).toContain("missing foundations");
    expect(seedMigration).toContain("missing industries");
    expect(seedMigration).toContain("industry parent mismatch");
    expect(seedMigration).toContain("reference niche online-course-business missing");
  });
});
