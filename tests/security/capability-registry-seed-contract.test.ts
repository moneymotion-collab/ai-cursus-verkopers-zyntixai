import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824180010_seed_capability_registry_cap1.sql",
  ),
  "utf8",
);

const CAPABILITY_KEYS = [
  "core.tasks",
  "core.attention",
  "core.member-administration",
  "shared.crm.leads",
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
  "horizontal.social.connection",
  "horizontal.social.content",
  "horizontal.social.approval",
  "horizontal.social.scheduling",
  "horizontal.social.publishing",
] as const;

const CORE_CRM_KNOWLEDGE_KEYS = [
  "core.tasks",
  "core.attention",
  "core.member-administration",
  "shared.crm.leads",
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
] as const;

const SOCIAL_PROVIDER_KEYS = [
  "horizontal.social.connection",
  "horizontal.social.content",
  "horizontal.social.approval",
] as const;

const SOCIAL_MEDIA_KEYS = [
  "horizontal.social.scheduling",
  "horizontal.social.publishing",
] as const;

describe("CAP-1B capability registry seed contract", () => {
  it("seeds exactly 13 active listed capabilities without hardcoded UUIDs", () => {
    expect(CAPABILITY_KEYS).toHaveLength(13);
    for (const key of CAPABILITY_KEYS) {
      expect(seedMigration).toContain(`'${key}'`);
    }
    expect(seedMigration).toContain("'Tasks'");
    expect(seedMigration).toContain("'Attention'");
    expect(seedMigration).toContain("'Member administration'");
    expect(seedMigration).toContain("'Leads'");
    expect(seedMigration).toContain("'Customers'");
    expect(seedMigration).toContain("'Programs'");
    expect(seedMigration).toContain("'Enrollments'");
    expect(seedMigration).toContain("'Progress'");
    expect(seedMigration).toContain("'Social account connection'");
    expect(seedMigration).toContain("'Social content management'");
    expect(seedMigration).toContain("'Social review and approval'");
    expect(seedMigration).toContain("'Social calendar and scheduling'");
    expect(seedMigration).toContain("'Social publishing'");
    expect(seedMigration).toContain("n_capabilities <> 13");
    expect(seedMigration).toContain("on conflict (capability_key) do nothing");
    expect(seedMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
    expect(seedMigration).not.toContain("gen_random_uuid()");
  });

  it("assigns owners and Knowledge Foundation without Service/Field/Product seed", () => {
    expect(seedMigration).toContain("'core'");
    expect(seedMigration).toContain("'platform'");
    expect(seedMigration).toContain("'shared'");
    expect(seedMigration).toContain("'crm'");
    expect(seedMigration).toContain("'foundation'");
    expect(seedMigration).toContain("'knowledge'");
    expect(seedMigration).toContain("'horizontal'");
    expect(seedMigration).toContain("'social'");
    expect(seedMigration).toContain("f.key = 'knowledge'");
    expect(seedMigration).toContain("taxonomy foundation knowledge missing");
    expect(seedMigration).toContain("n_knowledge_foundation <> 3");
    expect(seedMigration).not.toContain("horizontal.social.stories");
    expect(seedMigration).not.toContain("service.engagement");
    expect(seedMigration).not.toContain("field.jobs");
    expect(seedMigration).not.toContain("product.inventory");
    expect(seedMigration).not.toContain("core.invitations");
    expect(seedMigration).not.toContain("insert into public.taxonomy_foundations");
  });

  it("seeds exactly 13 production_verified readiness rows with frozen scopes", () => {
    expect(seedMigration).toContain("n_readiness <> 13");
    expect(seedMigration).toContain("n_production_verified <> 13");
    expect(seedMigration).toContain("'production_verified'");
    expect(seedMigration).toContain(
      `'{"workspace": "closed-beta-course-sellers"}'::jsonb`,
    );
    expect(seedMigration).toContain(`'{"provider": "instagram"}'::jsonb`);
    expect(seedMigration).toContain(
      `'{"provider": "instagram", "media": ["feed-image", "story-image"]}'::jsonb`,
    );
    for (const key of CORE_CRM_KNOWLEDGE_KEYS) {
      expect(seedMigration).toContain(`'${key}'`);
    }
    expect(CORE_CRM_KNOWLEDGE_KEYS).toHaveLength(8);
    expect(SOCIAL_PROVIDER_KEYS).toHaveLength(3);
    expect(SOCIAL_MEDIA_KEYS).toHaveLength(2);
    expect(seedMigration).not.toContain("video-story");
    expect(seedMigration).not.toContain("LinkedIn");
    expect(seedMigration).not.toContain("TikTok");
  });

  it("grounds verified_at and evidence_phase from BETA1-FV and SMM-B1-FV", () => {
    expect(seedMigration).toContain("'BETA1-FV'");
    expect(seedMigration).toContain("'SMM-B1-FV'");
    expect(seedMigration).toContain("timestamptz '2026-08-22 13:50:00+00'");
    expect(seedMigration).toContain("timestamptz '2026-08-22 10:27:28+00'");
    expect(seedMigration).toContain("Verification UTC");
    expect(seedMigration).toContain("cd125f81");
    expect(seedMigration).not.toContain("pg_catalog.now()");
    expect(seedMigration).not.toMatch(/verified_at,\s*now\s*\(/i);
  });

  it("does not assign Organizations or rewrite onboarding enums", () => {
    expect(seedMigration).not.toMatch(/\borganization_id\b/);
    expect(seedMigration).not.toMatch(/alter table public\.organizations/i);
    expect(seedMigration).not.toContain("business_type");
    expect(seedMigration).not.toContain("insert into public.organizations");
    expect(seedMigration).not.toContain("social_closed_beta_enrollments");
  });

  it("fails closed when Knowledge Foundation or counts are incomplete", () => {
    expect(seedMigration).toContain("raise exception 'CAP-1 seed:");
    expect(seedMigration).toContain("missing capabilities");
    expect(seedMigration).toContain("expected 13 capabilities");
    expect(seedMigration).toContain("expected 7 dependency edges");
    expect(seedMigration).toContain("expected 13 readiness rows");
  });
});
