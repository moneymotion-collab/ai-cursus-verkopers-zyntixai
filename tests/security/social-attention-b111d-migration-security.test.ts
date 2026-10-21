import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = "20260821130449_add_social_attention_missed_window_domain.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);

describe("SMM-B1.11-D missed-window Attention migration security", () => {
  it("extends existing Attention tables instead of a parallel Social inbox", () => {
    expect(migration).not.toContain("create table public.social_attention_items");
    expect(migration).not.toContain("create table public.social_notifications");
    expect(migration).not.toContain("create table public.social_alerts");
    expect(migration).toContain("source_type");
    expect(migration).toContain("social_publication");
    expect(migration).toContain("social_connection");
    expect(migration).toContain("scheduled_publication_missed");
    expect(migration).toContain("publication_result_unknown");
    expect(migration).toContain("social_account_reauthorization_required");
    expect(migration).toContain("provider_permission_missing");
    expect(migration).toContain("scheduled_publication_failed");
    expect(migration).toContain("schedule_missed");
  });

  it("keeps missed mutation and Attention upsert service_role-only", () => {
    expect(migration).toContain("scheduler_mark_scheduled_publication_missed");
    expect(migration).toContain("scheduler_upsert_social_intervention_attention");
    expect(migration).toContain("grant execute on function public.scheduler_mark_scheduled_publication_missed(uuid, uuid) to service_role");
    expect(migration).toContain(
      "grant execute on function public.scheduler_upsert_social_intervention_attention(uuid, uuid, text) to service_role",
    );
    expect(migration).toMatch(
      /revoke all on function public\.scheduler_mark_scheduled_publication_missed\(uuid, uuid\) from authenticated/,
    );
    expect(migration).toMatch(
      /revoke all on function public\.scheduler_upsert_social_intervention_attention\(uuid, uuid, text\) from authenticated/,
    );
  });

  it("scopes missed recovery to schedule_missed and Owner/Admin authenticated", () => {
    expect(migration).toContain("reschedule_missed_social_publication");
    expect(migration).toContain("cancel_missed_social_publication");
    expect(migration).toContain("last_failure_class is distinct from 'schedule_missed'");
    expect(migration).toContain(
      "grant execute on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) to authenticated",
    );
    expect(migration).toContain(
      "revoke all on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) from service_role",
    );
    expect(migration).toContain("assert_social_publication_schedule_actor");
  });

  it("binds Social Attention to the publication or connection organization", () => {
    expect(migration).toContain("attention_items_social_publication_fk");
    expect(migration).toContain("attention_items_social_connection_fk");
    expect(migration).toContain("p.organization_id = p_organization_id");
    expect(migration).toContain("raise exception 'social attention upsert failed after missed transition'");
  });

  it("resolves reauthorization Attention when the connection becomes healthy", () => {
    expect(migration).toContain("resolve_social_reauth_attention_on_connection_healthy");
    expect(migration).toContain("social_account_connections_resolve_reauth_attention");
    expect(migration).toContain("'social_account_reauthorization_required'");
    expect(migration).toContain("Instagram account reauthorized.");
  });

  it("is listed in the additive social inventory", () => {
    const names = readdirSync(join(process.cwd(), "supabase/migrations")).filter(
      (name) => name.includes("social") || name.includes("b18") || name.includes("b19"),
    );
    expect(names).toContain(migrationName);
  });
});
