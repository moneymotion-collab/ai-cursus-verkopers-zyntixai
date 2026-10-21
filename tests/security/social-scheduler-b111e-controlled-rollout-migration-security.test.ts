import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationNames = [
  "20260821193000_add_scheduler_controlled_scheduled_rollout.sql",
  "20260821193100_add_scheduler_controlled_scheduled_rollout_bind.sql",
  "20260821193200_add_scheduler_controlled_window_operator_expiry.sql",
  "20260821193300_add_scheduler_start_controlled_window_consume.sql",
];
const migration = migrationNames
  .map((name) =>
    readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8"),
  )
  .join("\n");

describe("SMM-B1.11-E controlled scheduled rollout migration security", () => {
  it("reuses the existing window table and does not create a second queue", () => {
    expect(migration).toContain("social_controlled_publish_windows");
    expect(migration).toContain(
      "private.assert_and_consume_scheduled_controlled_publish_window",
    );
    expect(migration).not.toContain("create table public.social_schedules");
    expect(migration).not.toContain("create table public.social_publication_queue");
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("media_publish");
    expect(migration).not.toMatch(
      /grant execute on function private\.claim_due_social_publications/,
    );
  });

  it("fail-closes scheduled consume when no matching window exists", () => {
    expect(migration).toContain("controlled_scheduled_rollout_required");
    expect(migration).toContain("controlled_window_expired");
    expect(migration).toContain("publication_not_authorized_for_window");
    expect(migration).toContain("controlled_window_exhausted");
    expect(migration).toContain("zyntix.social_scheduler_unrestricted");
    expect(migration).toContain("workspace_id");
    expect(migration).toContain("connection_id");
    expect(migration).toContain("expires_at");
    expect(migration).toContain("'expired'");
    expect(migration).toContain("source', 'scheduler'");
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("v_lease integer := 360");
    expect(migration).toContain("extract(epoch from (pg_catalog.now() - v_due_at)) > 900");
  });

  it("keeps scheduler_start service_role-only after replace", () => {
    expect(migration).toContain("private.assert_social_scheduler_service_role");
    expect(migration).toMatch(
      /revoke all on function public\.scheduler_start_scheduled_publication_attempt\(uuid, uuid\) from authenticated/,
    );
    expect(migration).toMatch(
      /revoke all on function public\.scheduler_start_scheduled_publication_attempt\(uuid, uuid\) from anon/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.scheduler_start_scheduled_publication_attempt\(uuid, uuid\) to service_role/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.operator_set_social_controlled_publish_window_expiry[\s\S]{0,400}to service_role/,
    );
  });

  it("is additive after the C worker and PR1 trigger migrations", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19") ||
          name.includes("scheduler"),
      )
      .sort();
    for (const name of migrationNames) {
      expect(social).toContain(name);
    }
    expect(social.indexOf(migrationNames[0]!)).toBeGreaterThan(
      social.indexOf("20260821123346_add_social_scheduler_worker_domain.sql"),
    );
    expect(social.indexOf(migrationNames[0]!)).toBeGreaterThan(
      social.indexOf(
        "20260821135320_add_social_publication_scheduler_pg_cron_trigger.sql",
      ),
    );
  });
});
