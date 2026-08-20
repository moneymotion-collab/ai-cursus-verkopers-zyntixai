import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_CONTENT_FORMATS,
  SOCIAL_CONTENT_ORIGIN_KINDS,
  SOCIAL_MEDIA_STORAGE_DECISION,
} from "@/features/social-media/domain/content";
import { IMPLEMENTED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/provider";
import { PLANNED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/planned-providers";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815184059_add_social_master_content_variants_media_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.4 content/media migration security", () => {
  it("creates Master Content, Variant, Media, and join tables", () => {
    expect(migration).toContain("create table public.social_content_items");
    expect(migration).toContain("create table public.social_content_variants");
    expect(migration).toContain("create table public.social_media_assets");
    expect(migration).toContain("create table public.social_content_media");
    expect(migration).toContain("create table public.social_variant_media");
    expect(migration).toContain("create table public.social_content_events");
  });

  it("enforces Brand/Workspace composite ownership and planned providers", () => {
    expect(migration).toContain(
      "references public.social_workspaces (organization_id, brand_id, id)",
    );
    expect(migration).toContain("social_content_items_no_self_source_chk");
    expect(migration).toContain("social_media_assets_no_self_parent_chk");
    for (const provider of PLANNED_SOCIAL_PROVIDERS) {
      expect(migration).toContain(`'${provider}'`);
    }
    expect(migration).not.toContain(
      "drop constraint social_account_connections_provider_chk",
    );
  });

  it("keeps content provider-neutral and blocks publication/approval states", () => {
    expect(migration).not.toMatch(
      /social_content_items[\s\S]{0,800}instagram_caption/i,
    );
    expect(migration).not.toMatch(
      /social_content_items_status_chk[\s\S]{0,200}published/,
    );
    expect(migration).not.toMatch(
      /social_content_items_status_chk[\s\S]{0,200}scheduled/,
    );
    expect(migration).not.toMatch(
      /social_content_variants_status_chk[\s\S]{0,200}approved/,
    );
    expect(migration).not.toContain("create table public.social_content_versions");
    expect(migration).not.toContain("create table public.social_publications");
    expect(migration).not.toContain("create table public.instagram_posts");
  });

  it("enables RLS, denies direct client mutations, and uses empty search_path RPCs", () => {
    for (const table of [
      "public.social_content_items",
      "public.social_content_variants",
      "public.social_media_assets",
      "public.social_content_media",
      "public.social_variant_media",
      "public.social_content_events",
    ]) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(
        `revoke insert, update, delete on table ${table} from authenticated`,
      );
    }
    for (const name of [
      "create_social_content_item",
      "update_social_content_item",
      "archive_social_content_item",
      "create_social_content_variant",
      "update_social_content_variant",
      "archive_social_content_variant",
      "register_social_media_asset",
      "archive_social_media_asset",
      "set_social_content_media_attachments",
      "set_social_variant_media_attachments",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toContain(`grant execute on function public.${name}`);
      expect(migration).toContain(
        `revoke all on function public.${name}`,
      );
    }
    expect(migration).toContain(
      "select p_actor_role in ('owner', 'admin', 'staff')",
    );
  });

  it("stores media metadata only — no binary blobs or public buckets", () => {
    expect(migration).toContain("storage_object_key");
    expect(migration).not.toMatch(/bytea/i);
    expect(migration).not.toContain("storage.create_bucket");
    expect(migration).not.toContain("insert into storage.buckets");
    expect(migration).toContain("provider_config jsonb");
    expect(migration).toContain(
      "pg_catalog.octet_length(provider_config::text) <= 8192",
    );
    expect(migration).not.toMatch(/content_payload\s+jsonb/i);
    expect(migration).not.toMatch(/provider_payload\s+jsonb/i);
    expect(migration).not.toMatch(/media_data\s+jsonb/i);
  });

  it("does not broaden runtime provider implementation", () => {
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(migration).not.toContain("create table public.tiktok_posts");
    expect(SOCIAL_CONTENT_FORMATS).toContain("short_video");
    expect(SOCIAL_CONTENT_ORIGIN_KINDS).toContain("repurposed");
    expect(SOCIAL_MEDIA_STORAGE_DECISION).toContain("no_bucket");
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
      "20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
      "20260818194719_add_social_closed_beta_operator_mutation_wrappers.sql",
      "20260819101500_add_social_instagram_provider_4xx_diagnostic_hardening.sql",
      "20260819120000_add_social_controlled_publish_window_binding.sql",
    ]);
  });
});
