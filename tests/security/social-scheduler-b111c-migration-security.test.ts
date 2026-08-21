import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = "20260821123346_add_social_scheduler_worker_domain.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);

const publicFns = [
  "scheduler_list_due_scheduled_social_publications",
  "scheduler_start_scheduled_publication_attempt",
  "scheduler_load_social_publication_execution_context",
  "scheduler_load_social_provider_credential_envelope",
  "scheduler_complete_scheduled_publication_attempt",
];

describe("SMM-B1.11-C scheduler migration security", () => {
  it("does not create a second queue table or grant raw claim_due", () => {
    expect(migration).not.toContain("create table public.social_schedules");
    expect(migration).not.toContain("create table public.social_publication_queue");
    expect(migration).not.toContain("pg_cron");
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("media_publish");
    expect(migration).not.toMatch(
      /grant execute on function private\.claim_due_social_publications/,
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.claim_due_social_publications/,
    );
    expect(migration).toContain("private.claim_due_social_publications");
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("execution_mode = 'scheduled'");
    expect(migration).toContain("coalesce(p.next_attempt_at, p.intended_execute_at)");
  });

  it("keeps worker RPCs service_role-only and revokes authenticated/anon", () => {
    expect(migration).toContain("private.assert_social_scheduler_service_role");
    expect(migration).toContain("auth.role()");
    expect(migration).toContain("service_role");
    for (const name of publicFns) {
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]*?from authenticated`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]*?from anon`,
        ),
      );
      expect(migration).toContain(
        `grant execute on function public.${name}`,
      );
      expect(migration).toMatch(
        new RegExp(
          `grant execute on function public\\.${name}[\\s\\S]{0,500}to service_role`,
        ),
      );
    }
  });

  it("revalidates approval, connection, capability, enrollment, and miss grace before claim", () => {
    expect(migration).toContain("private.social_variant_version_is_workflow_ready");
    expect(migration).toContain("private.social_closed_beta_publish_result_code");
    expect(migration).toContain("publish_image");
    expect(migration).toContain("reauthorization_required_at is not null");
    expect(migration).toContain("health is distinct from 'healthy'");
    expect(migration).toContain("status is distinct from 'connected'");
    expect(migration).toContain("'unknown_external_outcome'");
    expect(migration).toContain("'missed_window'");
    expect(migration).toContain("extract(epoch from (pg_catalog.now() - v_due_at)) > 900");
    expect(migration).toContain("source', 'scheduler'");
    expect(migration).toContain("v_lease integer := 360");
    expect(migration).not.toContain("assert_and_consume_controlled_publish_window");
  });

  it("does not grant credential plaintext or authenticated complete", () => {
    expect(migration).toContain("private.social_provider_credentials");
    expect(migration).toContain("v_existing.ciphertext");
    expect(migration).not.toContain("access_token text");
    expect(migration).toContain("private.complete_social_publication_attempt");
    expect(migration).not.toMatch(
      /grant execute on function public\.scheduler_complete_scheduled_publication_attempt[\s\S]*to authenticated/,
    );
  });

  it("is present after the B1.11-A scheduling domain migration", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19") ||
          name.includes("scheduler"),
      )
      .sort();
    expect(social).toContain(migrationName);
    expect(social.indexOf(migrationName)).toBeGreaterThan(
      social.indexOf("20260821114627_add_social_publication_scheduling_domain.sql"),
    );
  });
});
