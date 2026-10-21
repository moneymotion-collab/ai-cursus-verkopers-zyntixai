import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName =
  "20260821114627_add_social_publication_scheduling_domain.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);

describe("SMM-B1.11-A scheduling migration security", () => {
  it("does not create a second scheduling aggregate or worker schema", () => {
    expect(migration).not.toContain("create table public.social_schedules");
    expect(migration).not.toContain("pg_cron");
    expect(migration).not.toContain("vercel.json");
    expect(migration).not.toContain("SOCIAL_SCHEDULING_ENABLED");
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toMatch(/access_token\s+text/i);
  });

  it("uses existing publication execution clock fields", () => {
    expect(migration).toContain("execution_mode = 'scheduled'");
    expect(migration).toContain("intended_execute_at = p_intended_execute_at");
    expect(migration).toContain("next_attempt_at = p_intended_execute_at");
    expect(migration).toContain("for update");
    expect(migration).toContain("p_intended_execute_at <= pg_catalog.now()");
    expect(migration).toContain("'invalid_time'");
  });

  it("does not mutate version or connection bindings", () => {
    expect(migration).not.toMatch(
      /set[\s\S]*variant_version_id\s*=/,
    );
    expect(migration).not.toMatch(/set[\s\S]*connection_id\s*=/);
    expect(migration).not.toMatch(/set[\s\S]*content_id\s*=/);
    expect(migration).not.toMatch(/set[\s\S]*provider\s*=/);
  });

  it("enforces Owner/Admin via connection-management gate and denies Staff", () => {
    expect(migration).toContain(
      "private.assert_social_publication_schedule_actor",
    );
    expect(migration).toContain("private.can_manage_social_connections");
    expect(migration).not.toContain("can_manage_social_content(v_member_role)");
  });

  it("fail-closes claimed, processing, succeeded, cancelled, and unknown outcome", () => {
    expect(migration).toContain("status not in ('pending', 'queued', 'failed_retryable')");
    expect(migration).toContain("a.outcome = 'processing'");
    expect(migration).toContain("'claimed'");
    expect(migration).toContain("'unknown_external_outcome'");
  });

  it("grants authenticated only and revokes service_role/anon", () => {
    for (const name of [
      "schedule_social_publication",
      "reschedule_social_publication",
      "cancel_scheduled_social_publication",
    ]) {
      expect(migration).toContain(`grant execute on function public.${name}`);
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]*?from service_role`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]*?from anon`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `create or replace function public\\.${name}[\\s\\S]*?security definer\\s+set search_path = ''`,
        ),
      );
    }
    expect(migration).not.toMatch(
      /grant execute on function private\.assert_social_publication_schedule_actor/,
    );
  });

  it("reuses cancelled event for scheduled cancel and adds schedule events", () => {
    expect(migration).toContain("'social_publication_scheduled'");
    expect(migration).toContain("'social_publication_rescheduled'");
    expect(migration).toContain("'social_publication_cancelled'");
    expect(migration).toContain("previous_intended_execute_at");
  });

  it("is present in the social migration inventory after the R2 finalize migration", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19"),
      )
      .sort();
    expect(social).toContain(migrationName);
    expect(social.indexOf(migrationName)).toBeGreaterThan(
      social.indexOf(
        "20260820120000_add_social_reauthorization_connected_finalize.sql",
      ),
    );
  });

  it("does not implement missed-grace execution or Story publishing", () => {
    expect(migration).not.toContain("SOCIAL_SCHEDULE_MISS_GRACE");
    expect(migration).not.toContain("media_type=STORIES");
    expect(migration).not.toContain("create table public.social_stories");
  });
});
