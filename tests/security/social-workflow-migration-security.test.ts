import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_CLIENT_APPROVAL_B15_DECISION,
  SOCIAL_SELF_APPROVAL_B15_POLICY,
} from "@/features/social-media/domain/workflow";
import { IMPLEMENTED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/provider";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815185612_add_social_versioning_review_approval_calendar_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.5 versioning/review/calendar migration security", () => {
  it("creates version, review, approval, and schedule foundation tables", () => {
    expect(migration).toContain("create table public.social_content_item_versions");
    expect(migration).toContain("create table public.social_content_variant_versions");
    expect(migration).toContain("create table public.social_review_requests");
    expect(migration).toContain("create table public.social_review_comments");
    expect(migration).toContain("create table public.social_approval_decisions");
    expect(migration).toContain("create table public.social_content_schedule_slots");
    expect(migration).toContain("create table public.social_workflow_events");
    expect(migration).toContain("internal_approval_required");
    expect(migration).toContain("client_approval_required");
  });

  it("enforces immutable versions/approvals/comments and media snapshots", () => {
    expect(migration).toContain("social content item versions are immutable");
    expect(migration).toContain("social content variant versions are immutable");
    expect(migration).toContain("social approval decisions are immutable");
    expect(migration).toContain("social review comments are immutable");
    expect(migration).toContain("media_snapshot");
    expect(migration).toContain("current_version_id");
    expect(migration).toContain("social_content_variant_versions_parent_number_unique");
  });

  it("binds schedules to exact versions and forbids publication statuses", () => {
    expect(migration).toContain("variant_version_id");
    expect(migration).toContain("planning_timezone");
    expect(migration).toContain("status in ('active', 'cancelled')");
    expect(migration).not.toMatch(
      /social_content_schedule_slots_status_chk[\s\S]{0,120}published/,
    );
    expect(migration).not.toContain("create table public.social_publications");
    expect(migration).not.toContain("create table public.social_publication_attempts");
  });

  it("enables RLS and SECURITY DEFINER empty search_path RPCs", () => {
    for (const table of [
      "public.social_content_item_versions",
      "public.social_content_variant_versions",
      "public.social_review_requests",
      "public.social_review_comments",
      "public.social_approval_decisions",
      "public.social_content_schedule_slots",
      "public.social_workflow_events",
    ]) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(
        `revoke insert, update, delete on table ${table} from authenticated`,
      );
    }
    for (const name of [
      "create_social_content_item_version",
      "create_social_content_variant_version",
      "create_social_review_request",
      "cancel_social_review_request",
      "add_social_review_comment",
      "submit_social_approval_decision",
      "create_social_content_schedule_slot",
      "move_social_content_schedule_slot",
      "cancel_social_content_schedule_slot",
      "update_social_workspace_approval_policy",
      "evaluate_social_variant_version_workflow_readiness",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toContain(`grant execute on function public.${name}`);
    }
    expect(migration).toContain("can_approve_social_content");
    expect(migration).toContain("workflow_ready");
  });

  it("does not broaden runtime providers or invent client portal users", () => {
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(migration).not.toContain(
      "drop constraint social_account_connections_provider_chk",
    );
    expect(SOCIAL_CLIENT_APPROVAL_B15_DECISION).toContain("deferred");
    expect(SOCIAL_SELF_APPROVAL_B15_POLICY).toBe("allowed");
    expect(migration).toContain("Self-approval allowed in Beta 1");
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
    ]);
  });
});
