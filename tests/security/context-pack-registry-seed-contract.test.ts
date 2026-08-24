import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql",
  ),
  "utf8",
);

const FOUNDATION_REQUIRED = [
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
] as const;

const NICHE_MAPPINGS: ReadonlyArray<readonly [string, string]> = [
  ["shared.crm.leads", "recommended"],
  ["horizontal.social.connection", "optional"],
  ["horizontal.social.content", "optional"],
  ["horizontal.social.approval", "optional"],
  ["horizontal.social.scheduling", "optional"],
  ["horizontal.social.publishing", "optional"],
];

const TERMINOLOGY = [
  ["customer", "Customer", "Customers"],
  ["program", "Program", "Programs"],
  ["enrollment", "Enrollment", "Enrollments"],
  ["progress", "Progress", "Progress"],
] as const;

describe("CTX-1B context pack registry seed contract", () => {
  it("seeds exactly two packs without hardcoded UUIDs or extra layers", () => {
    expect(seedMigration).toContain("'foundation.knowledge'");
    expect(seedMigration).toContain("'Knowledge'");
    expect(seedMigration).toContain("'niche.online-course-business'");
    expect(seedMigration).toContain("'Online Course Business'");
    expect(seedMigration).toContain("f.key = 'knowledge'");
    expect(seedMigration).toContain("n.key = 'online-course-business'");
    expect(seedMigration).toContain("n_packs <> 2");
    expect(seedMigration).toContain("on conflict (pack_key) do nothing");
    expect(seedMigration).not.toMatch(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
    expect(seedMigration).not.toContain("gen_random_uuid()");
    expect(seedMigration).not.toContain("pack_kind = 'industry'");
    expect(seedMigration).not.toContain("education-and-learning");
    expect(seedMigration).not.toContain("pack_kind = 'industry'");
    expect(seedMigration).not.toContain("pack_kind = 'specialization'");
    expect(seedMigration).not.toContain("pack_kind = 'deep_specialization'");
    expect(seedMigration).not.toContain("course_seller");
    expect(seedMigration).not.toContain("Course Seller");
  });

  it("seeds exactly two published full v1 versions with Knowledge as Niche parent", () => {
    expect(seedMigration).toContain("n_versions <> 2");
    expect(seedMigration).toContain("n_published <> 2");
    expect(seedMigration).toContain("change_impact = 'high'");
    expect(seedMigration).toContain(
      "Initial governed Context baseline establishing capability relevance and operating definition.",
    );
    expect(seedMigration).toContain(
      "A Knowledge business creates and delivers structured learning programs to enrolled customers and records their progress.",
    );
    expect(seedMigration).toContain("Knowledge / education operator");
    expect(seedMigration).toContain("Structured learning programs");
    expect(seedMigration).toContain(
      "An Online Course Business sells and delivers structured educational programs online, typically generating leads, converting them to customers, enrolling those customers in programs, and tracking progress.",
    );
    expect(seedMigration).toContain("Online course creator / course-seller operator");
    expect(seedMigration).toContain("Online courses sold as programs");
    expect(seedMigration).toContain(
      "parent_version_id is distinct from knowledge_version_id",
    );
    expect(seedMigration).toContain("on conflict (pack_id, version_number) do nothing");
    expect(seedMigration).not.toContain("do update");
  });

  it("seeds exactly four Foundation required SET mappings and no extra Foundation rows", () => {
    expect(FOUNDATION_REQUIRED).toHaveLength(4);
    for (const key of FOUNDATION_REQUIRED) {
      expect(seedMigration).toContain(`('${key}', 'required')`);
    }
    expect(seedMigration).toContain("n_foundation_required <> 4");
    expect(seedMigration).toContain("Foundation v1 must have exactly 4 mappings");
  });

  it("seeds exactly six Niche SET mappings and does not duplicate Foundation required rows", () => {
    expect(NICHE_MAPPINGS).toHaveLength(6);
    for (const [key, relevance] of NICHE_MAPPINGS) {
      expect(seedMigration).toContain(`('${key}', '${relevance}')`);
    }
    expect(seedMigration).toContain("n_niche_mappings <> 6");
    expect(seedMigration).toContain("n_mappings <> 10");
    expect(seedMigration).toContain(
      "Niche v1 must inherit Foundation required mappings, not duplicate them",
    );
    expect(seedMigration).toContain("n_remove <> 0");
    expect(seedMigration).toContain("v1 must not contain REMOVE mappings");
  });

  it("does not store Core system-baseline capabilities", () => {
    expect(seedMigration).toContain("c.capability_key like 'core.%'");
    expect(seedMigration).toContain("n_core <> 0");
    expect(seedMigration).not.toContain("('core.tasks'");
    expect(seedMigration).not.toContain("('core.attention'");
    expect(seedMigration).not.toContain("('core.member-administration'");
  });

  it("seeds exactly four Foundation en terminology identity maps and zero Niche terms", () => {
    expect(TERMINOLOGY).toHaveLength(4);
    for (const [key, singular, plural] of TERMINOLOGY) {
      expect(seedMigration).toContain(`('${key}', '${singular}', '${plural}')`);
    }
    expect(seedMigration).toContain("n_terms <> 4");
    expect(seedMigration).toContain("n_niche_terms <> 0");
    expect(seedMigration).toContain("Niche v1 must have 0 terminology rows");
    expect(seedMigration).not.toContain("'Student'");
    expect(seedMigration).not.toContain("'Participant'");
    expect(seedMigration).not.toContain("'Learner'");
    expect(seedMigration).not.toContain("'Client'");
  });

  it("seeds context_ready readiness with inert supported_scope and null verified_at", () => {
    expect(seedMigration).toContain("n_readiness <> 2");
    expect(seedMigration).toContain("n_context_ready <> 2");
    expect(seedMigration).toContain("'context_ready'");
    expect(seedMigration).toContain("'CTX-1B'");
    expect(seedMigration).toContain(
      `'{"journey": "closed-beta-course-sellers", "runtime": "inert", "resolver": false}'::jsonb`,
    );
    expect(seedMigration).toContain("verified_at is null");
    expect(seedMigration).not.toContain("'production_verified'");
    expect(seedMigration).not.toContain("'beta_supported'");
    expect(seedMigration).not.toContain("pg_catalog.now()");
    expect(seedMigration).not.toMatch(/verified_at,\s*now\s*\(/i);
  });

  it("fails closed when TAX/CAP identities or counts are incomplete", () => {
    expect(seedMigration).toContain("raise exception 'CTX-1 seed:");
    expect(seedMigration).toContain("taxonomy foundation knowledge missing");
    expect(seedMigration).toContain("taxonomy niche online-course-business missing");
    expect(seedMigration).toContain("missing capabilities");
    expect(seedMigration).toContain("expected 2 context_packs");
    expect(seedMigration).toContain("expected 10 context_capability_mappings");
    expect(seedMigration).toContain("Foundation required set missing CAP hard dependency closure");
  });

  it("does not assign Organizations or rewrite onboarding/Social/TAX/CAP", () => {
    expect(seedMigration).not.toMatch(/\borganization_id\b/);
    expect(seedMigration).not.toMatch(/alter table public\.organizations/i);
    expect(seedMigration).not.toContain("insert into public.organizations");
    expect(seedMigration).not.toContain("insert into public.taxonomy_");
    expect(seedMigration).not.toContain("update public.taxonomy_");
    expect(seedMigration).not.toContain("insert into public.capabilities");
    expect(seedMigration).not.toContain("insert into public.capability_");
    expect(seedMigration).not.toContain("social_closed_beta_enrollments");
    expect(seedMigration).not.toContain("business_type");
  });
});
