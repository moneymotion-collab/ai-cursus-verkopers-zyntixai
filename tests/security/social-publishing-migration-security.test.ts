import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS,
  SOCIAL_PUBLISHING_ENABLED_ENV,
} from "@/features/social-media/domain/publishing";
import { IMPLEMENTED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/provider";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815202145_add_social_publishing_infrastructure_foundation.sql",
  ),
  "utf8",
);

describe("SMM-B1.6 publishing migration security", () => {
  it("creates publication, attempt, and event tables", () => {
    expect(migration).toContain("create table public.social_publications");
    expect(migration).toContain("create table public.social_publication_attempts");
    expect(migration).toContain("create table public.social_publication_events");
    expect(migration).toContain("idempotency_key");
    expect(migration).toContain("claim_lease_expires_at");
    expect(migration).toContain("unknown_external_outcome");
  });

  it("enforces exact version/connection binding and schedule uniqueness", () => {
    expect(migration).toContain("variant_version_id");
    expect(migration).toContain("connection_id");
    expect(migration).toContain("social_publications_one_active_schedule_uidx");
    expect(migration).toContain("social_publications_org_idempotency_uidx");
    expect(migration).toContain("for update skip locked");
  });

  it("keeps system completion private and blocks browser success fabrication", () => {
    expect(migration).toContain("private.complete_social_publication_attempt");
    expect(migration).toContain("private.claim_due_social_publications");
    expect(migration).toContain("private.start_social_publication_attempt");
    expect(migration).toContain("zyntix.social_publication_worker");
    expect(migration).not.toMatch(
      /grant execute on function private\.complete_social_publication_attempt/,
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.complete_social_publication/,
    );
    expect(migration).toContain(
      "grant execute on function public.create_social_publication",
    );
  });

  it("enables RLS and empty search_path on human SECURITY DEFINER RPCs", () => {
    for (const table of [
      "public.social_publications",
      "public.social_publication_attempts",
      "public.social_publication_events",
    ]) {
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(
        `revoke insert, update, delete on table ${table} from authenticated`,
      );
    }
    for (const name of [
      "create_social_publication",
      "cancel_social_publication",
      "request_social_publication_retry",
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
    }
  });

  it("does not implement Instagram publishing or broaden provider CHECKs", () => {
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("instagram.com");
    expect(migration).not.toContain("create table public.instagram_publications");
    expect(migration).not.toContain(
      "drop constraint social_account_connections_provider_chk",
    );
    expect(migration).toContain("provider = 'instagram'");
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS).toBe(
      "implemented_b17_gated",
    );
    expect(SOCIAL_PUBLISHING_ENABLED_ENV).toBe("SOCIAL_PUBLISHING_ENABLED");
    expect(migration).not.toMatch(/access_token\s+text/i);
    expect(migration).not.toMatch(/provider_payload\s+jsonb/i);
  });

  it("keeps social migration inventory ordered and additive", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19"),
      )
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
      "20260818130747_add_b18_controlled_publication_execution_rpcs.sql",
      "20260818145249_add_b19_publishing_lifecycle_hardening.sql",
      "20260818190346_add_social_closed_beta_enrollment_foundation.sql",
      "20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
      "20260818194719_add_social_closed_beta_operator_mutation_wrappers.sql",
    ]);
  });

  it("grants B1.8 controlled wrappers to authenticated only", () => {
    const b18 = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260818130747_add_b18_controlled_publication_execution_rpcs.sql",
      ),
      "utf8",
    );
    expect(b18).toContain("public.b18_start_controlled_publication_attempt");
    expect(b18).toContain("public.b18_complete_controlled_publication_attempt");
    expect(b18).toContain("private.can_manage_social_connections");
    expect(b18).toContain("set_config('zyntix.social_publication_worker'");
    expect(b18).toContain("set_config('zyntix.social_publishing_enabled'");
    expect(b18).toContain(
      "grant execute on function public.b18_start_controlled_publication_attempt(uuid, uuid) to authenticated",
    );
    expect(b18).toContain(
      "grant execute on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) to authenticated",
    );
    expect(b18).toContain(
      "revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from service_role",
    );
    expect(b18).toContain(
      "revoke all on function public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from service_role",
    );
    expect(b18).toContain(
      "revoke all on function public.b18_start_controlled_publication_attempt(uuid, uuid) from anon",
    );
    expect(b18).not.toMatch(
      /grant execute on function public\.b18_start_controlled_publication_attempt[\s\S]*to service_role/,
    );
  });
});
