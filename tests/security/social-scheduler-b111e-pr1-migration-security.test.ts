import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_SCHEDULER_CANONICAL_ORIGIN,
  SOCIAL_SCHEDULER_CRON_PATH,
  SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET,
  SOCIAL_SCHEDULER_SUPABASE_CRON_JOB_NAME,
  SOCIAL_SCHEDULER_SUPABASE_TRIGGER_FUNCTION,
  SOCIAL_SCHEDULER_VAULT_SECRET_NAME,
} from "@/features/social-media/domain/scheduler";

const migrationName =
  "20260821135320_add_social_publication_scheduler_pg_cron_trigger.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);

describe("SMM-B1.11-E-PR1 Supabase scheduler trigger security", () => {
  it("enables pg_cron and pg_net without a second publishing engine", () => {
    expect(migration).toContain("create extension pg_cron with schema pg_catalog");
    expect(migration).toContain("create extension pg_net with schema extensions");
    expect(migration).toContain("if not exists (select 1 from pg_extension where extname = 'pg_cron')");
    expect(migration).toContain("if not exists (select 1 from pg_extension where extname = 'pg_net')");
    expect(migration).not.toContain("create table public.social_schedules");
    expect(migration).not.toContain("create table public.social_publication_queue");
    expect(migration).not.toContain("inngest");
    expect(migration).not.toContain("qstash");
    expect(migration).not.toContain("bullmq");
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("media_publish");
    expect(migration).not.toContain("claim_due_social_publications");
    expect(migration).not.toMatch(
      /update\s+public\.social_publications/i,
    );
  });

  it("binds a private no-arg trigger to the canonical worker URL", () => {
    expect(migration).toContain(
      `create or replace function ${SOCIAL_SCHEDULER_SUPABASE_TRIGGER_FUNCTION}()`,
    );
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      `${SOCIAL_SCHEDULER_CANONICAL_ORIGIN}${SOCIAL_SCHEDULER_CRON_PATH}`,
    );
    expect(migration).toContain("net.http_post(");
    expect(migration).toContain("timeout_milliseconds := 300000");
    expect(migration).toContain("'Authorization', 'Bearer ' || btrim(v_secret)");
    expect(migration).not.toContain("?secret=");
    expect(migration).not.toContain("cron_secret=");
    expect(migration).not.toContain("searchParams");
    expect(migration).not.toMatch(
      /create or replace function private\.invoke_social_publication_scheduler\s*\([^)]+\)/,
    );
  });

  it("resolves the scheduler secret from Vault and fail-closes when missing", () => {
    expect(migration).toContain("vault.decrypted_secrets");
    expect(migration).toContain(
      `where ds.name = '${SOCIAL_SCHEDULER_VAULT_SECRET_NAME}'`,
    );
    expect(migration).toContain("'secret_missing'");
    expect(migration).not.toContain("vault.create_secret(");
    expect(migration).not.toMatch(/Bearer\s+[A-Za-z0-9_\-]{16,}/);
  });

  it("revokes ordinary and API roles from the private trigger", () => {
    expect(migration).toContain(
      "revoke all on function private.invoke_social_publication_scheduler() from public",
    );
    expect(migration).toContain(
      "revoke all on function private.invoke_social_publication_scheduler() from anon",
    );
    expect(migration).toContain(
      "revoke all on function private.invoke_social_publication_scheduler() from authenticated",
    );
    expect(migration).toContain(
      "revoke all on function private.invoke_social_publication_scheduler() from service_role",
    );
    expect(migration).toContain(
      "grant execute on function private.invoke_social_publication_scheduler() to postgres",
    );
  });

  it("registers one named five-minute job that only calls the private function", () => {
    expect(migration).toContain(
      `'${SOCIAL_SCHEDULER_SUPABASE_CRON_JOB_NAME}'`,
    );
    expect(migration).toContain(`'${SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET}'`);
    expect(migration).toContain(
      "select private.invoke_social_publication_scheduler();",
    );
    expect(migration).not.toMatch(
      /cron\.schedule\([\s\S]*Authorization/,
    );
    expect(migration).not.toMatch(
      /cron\.schedule\([\s\S]*decrypted_secret/,
    );
  });

  it("is present after the missed-window Attention migration", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("social"))
      .sort();
    expect(social).toContain(migrationName);
    expect(social.indexOf(migrationName)).toBeGreaterThan(
      social.indexOf(
        "20260821130449_add_social_attention_missed_window_domain.sql",
      ),
    );
    expect(social.at(-1)).toBe(migrationName);
  });
});
