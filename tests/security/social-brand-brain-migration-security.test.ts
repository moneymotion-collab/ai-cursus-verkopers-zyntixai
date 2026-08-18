import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  IMPLEMENTED_SOCIAL_PROVIDERS,
  isImplementedSocialProvider,
} from "@/features/social-media/domain/provider";
import {
  PLANNED_SOCIAL_PROVIDERS,
  isPlannedSocialProvider,
} from "@/features/social-media/domain/planned-providers";
import {
  SOCIAL_BRAND_TRUTH_SOURCE_KINDS,
  SOCIAL_CAMPAIGN_STATUSES,
  SOCIAL_OFFERS_B13_DECISION,
  isCanonicalBrandTruthSourceKind,
} from "@/features/social-media/domain/brand-brain";
import { SOCIAL_DATA_PROVENANCE_KINDS } from "@/features/social-media/domain/universal-contracts";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815182703_add_social_brand_brain_campaign_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.3 brand brain migration security", () => {
  it("creates Brand Brain and Campaign foundation tables", () => {
    expect(migration).toContain("create table public.social_brand_rules");
    expect(migration).toContain("create table public.social_audiences");
    expect(migration).toContain("create table public.social_content_pillars");
    expect(migration).toContain("create table public.social_goals");
    expect(migration).toContain("create table public.social_platform_strategies");
    expect(migration).toContain("create table public.social_campaigns");
    expect(migration).toContain("create table public.social_campaign_audiences");
    expect(migration).toContain("create table public.social_campaign_platforms");
    expect(migration).toContain("create table public.social_campaign_pillars");
    expect(migration).toContain("create table public.social_brand_brain_events");
  });

  it("extends brand profile without Brand Brain JSON dump tables", () => {
    expect(migration).toContain("add column voice_config jsonb");
    expect(migration).toContain("profile_source_kind");
    expect(migration).not.toContain("create table public.social_brand_profiles");
    expect(migration).not.toMatch(/brand_brain\s+jsonb/i);
    expect(migration).not.toMatch(/campaign_data\s+jsonb/i);
  });

  it("locks Brand/Workspace integrity and planned providers", () => {
    expect(migration).toContain("social_workspaces_org_brand_id_unique");
    expect(migration).toContain(
      "references public.social_workspaces (organization_id, brand_id, id)",
    );
    expect(migration).toContain("'pinterest'");
    expect(migration).toContain("'threads'");
    expect(migration).not.toContain(
      "drop constraint social_account_connections_provider_chk",
    );
  });

  it("excludes ai_inferred from canonical brand truth source kinds", () => {
    expect(migration).toContain("'manually_verified'");
    expect(migration).not.toMatch(
      /profile_source_kind_chk[\s\S]{0,200}ai_inferred/,
    );
    expect(migration).not.toMatch(
      /social_brand_rules_source_kind_chk[\s\S]{0,200}ai_inferred/,
    );
  });

  it("uses SECURITY DEFINER RPCs with empty search_path", () => {
    for (const name of [
      "upsert_social_brand_profile",
      "create_social_audience",
      "create_social_content_pillar",
      "create_social_goal",
      "upsert_social_platform_strategy",
      "create_social_campaign",
      "set_social_campaign_assignments",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toContain(`grant execute on function public.${name}`);
    }
  });

  it("does not implement Master Content / publishing / analytics", () => {
    expect(migration).not.toContain("social_content_items");
    expect(migration).not.toContain("social_publications");
    expect(migration).not.toContain("social_media_assets");
    expect(migration).not.toContain("social_metric");
  });
});

describe("SMM-B1.3 brand brain domain contracts", () => {
  it("keeps canonical brand truth separate from ai_inferred provenance catalog", () => {
    expect(SOCIAL_DATA_PROVENANCE_KINDS).toContain("ai_inferred");
    expect(SOCIAL_BRAND_TRUTH_SOURCE_KINDS).not.toContain("ai_inferred");
    expect(isCanonicalBrandTruthSourceKind("user_entered")).toBe(true);
    expect(isCanonicalBrandTruthSourceKind("ai_inferred")).toBe(false);
  });

  it("preserves planned providers as strategy targets without runtime enablement", () => {
    expect(isPlannedSocialProvider("tiktok")).toBe(true);
    expect(isImplementedSocialProvider("tiktok")).toBe(false);
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(PLANNED_SOCIAL_PROVIDERS).toContain("tiktok");
  });

  it("locks campaign statuses and offers deferral decision", () => {
    expect(SOCIAL_CAMPAIGN_STATUSES).toEqual([
      "draft",
      "active",
      "completed",
    ]);
    expect(SOCIAL_OFFERS_B13_DECISION).toBe(
      "deferred_no_duplicate_product_catalog",
    );
  });

  it("keeps social migration inventory ordered and additive", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("social"))
      .sort();
    expect(social).toEqual([
      "20260815130220_add_social_connection_credential_foundation.sql",
      "20260815161759_add_social_workspace_foundation.sql",
      "20260815162306_add_social_workspace_foundation.sql",
      "20260815182703_add_social_brand_brain_campaign_foundation.sql",
      "20260815184059_add_social_master_content_variants_media_foundation.sql",
      "20260815185612_add_social_versioning_review_approval_calendar_foundation.sql",
      "20260815202145_add_social_publishing_infrastructure_foundation.sql",
      "20260815212000_add_social_private_media_bucket_r1.sql",
      "20260818190346_add_social_closed_beta_enrollment_foundation.sql",
    ]);
  });
});
