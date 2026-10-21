import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = "20260821194000_allow_scheduler_story_image_format.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);

describe("SMM-B1.11-F scheduler Story IMAGE migration security", () => {
  it("generalizes claim-time format without a second Story aggregate", () => {
    expect(migration).toContain("content_format not in ('image', 'story')");
    expect(migration).toContain("publish_story");
    expect(migration).toContain("media_category");
    expect(migration).not.toContain("create table public.social_stories");
    expect(migration).not.toContain("create table public.social_story_publications");
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("media_publish");
    expect(migration).not.toMatch(
      /grant execute on function private\.claim_due_social_publications/,
    );
  });

  it("keeps scheduler_start service_role-only and Story VIDEO fail-closed", () => {
    expect(migration).toContain("private.assert_social_scheduler_service_role");
    expect(migration).toContain("format_unsupported");
    expect(migration).toContain(
      "coalesce(v_version.media_snapshot->0->>'media_category', '') is distinct from 'image'",
    );
    expect(migration).toMatch(
      /revoke all on function public\.scheduler_start_scheduled_publication_attempt\(uuid, uuid\) from authenticated/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.scheduler_start_scheduled_publication_attempt\(uuid, uuid\) to service_role/,
    );
  });

  it("is additive after the B1.11-E consume migration", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("scheduler") ||
          name.includes("b18"),
      )
      .sort();
    expect(social).toContain(migrationName);
    expect(social.indexOf(migrationName)).toBeGreaterThan(
      social.indexOf(
        "20260821193300_add_scheduler_start_controlled_window_consume.sql",
      ),
    );
  });
});
